import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: profile } = await adminClient.from('profiles').select('is_premium, bonus_generations').eq('id', user.id).single()

    // Check daily limit (same as generate — 2 per day for free)
    if (!profile?.is_premium) {
      const today = new Date().toISOString().split('T')[0]
      const { data: usage } = await adminClient.from('daily_usage').select('worksheets').eq('user_id', user.id).eq('date', today).single()
      const used = usage?.worksheets ?? 0
      const bonus = profile?.bonus_generations ?? 0
      if (used >= 2 && bonus <= 0) {
        return NextResponse.json({ error: 'daily_limit_reached', limitReached: true }, { status: 429 })
      }
    }

    const { subject, topic, grade, cardCount = 15, uploadedText } = await request.json()

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const systemPrompt = `You are an expert educational content creator. Generate flashcards for studying ${subject} at ${grade} level.

Each flashcard should have:
- A clear, specific question or term on the front
- A concise but complete answer or definition on the back
- Answers should be 1-3 sentences maximum
- Questions should test key concepts, definitions, formulas, or facts

FORMATTING: Respond in valid JSON only — no markdown, no backticks.
Return: { "flashcards": [{ "id": 1, "question": "...", "answer": "..." }] }`

    const userPrompt = `Generate ${cardCount} flashcards for the topic: ${topic} in ${subject} (${grade} level).
${uploadedText ? `Base the flashcards on this content:\n${uploadedText.slice(0, 3000)}` : ''}
Make sure the flashcards cover the most important concepts and are suitable for quick memorization.
Variation seed: ${Math.floor(Math.random() * 900000) + 100000}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 3000,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    // Save session
    const { data: session } = await adminClient.from('sessions').insert({
      user_id: user.id,
      subject,
      topic,
      grade,
      output_type: 'flashcards',
      content: parsed,
    }).select('id').single()

    // Update daily usage
    const today = new Date().toISOString().split('T')[0]
    await adminClient.from('daily_usage').upsert({
      user_id: user.id,
      date: today,
      worksheets: 1,
    }, { onConflict: 'user_id,date', ignoreDuplicates: false })

    return NextResponse.json({ sessionId: session?.id, flashcards: parsed.flashcards })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
