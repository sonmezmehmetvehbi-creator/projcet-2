import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// DAILY LIMIT: free users get 2 Arena games/day, tracked in daily_usage.arena_games.
// We increment the counter HERE (once per successful question generation) — each
// call to this route counts as one game started. The server page also reads the
// count up front to gate the UI; this is the belt-and-suspenders enforcement.
//
// -- ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS arena_games int DEFAULT 0;

const ARENA_DAILY_LIMIT = 2

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subject, topic, difficulty = 'medium', count = 20 } = await request.json()
    if (!subject || !topic) return NextResponse.json({ error: 'Missing subject or topic' }, { status: 400 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // ── Enforce the free-plan daily Arena limit ──
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    const isPremium = !!profile?.is_premium
    const today = new Date().toISOString().split('T')[0]

    if (!isPremium) {
      const { data: usage } = await adminClient
        .from('daily_usage')
        .select('arena_games')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()
      const gamesToday = usage?.arena_games ?? 0
      if (gamesToday >= ARENA_DAILY_LIMIT) {
        return NextResponse.json(
          { error: 'daily_limit_reached', limitReached: true },
          { status: 429 }
        )
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const systemPrompt = `Generate ${count} fast-paced quiz questions for ${subject} - ${topic} at ${difficulty} level. Questions must be short (1-2 sentences max). Each question has exactly 4 options. Return JSON only: { "questions": [{ "id", "question", "options": [string x4], "correctIndex": 0-3, "subject" }] }`

    const userPrompt = `Create ${count} short multiple-choice questions on "${topic}" in ${subject} (${difficulty} level).
Rules:
- Each question is 1-2 sentences, quick to read.
- Exactly 4 answer options, only one correct.
- "correctIndex" is the 0-based index (0-3) of the correct option.
- "subject" is "${subject}".
- Respond with valid JSON only, no markdown or backticks.
Variation seed: ${Math.floor(Math.random() * 900000) + 100000}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 3500,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    // Normalize: ensure ids, valid correctIndex, and subject on each question.
    const questions = (parsed.questions ?? [])
      .filter((q: any) => q && q.question && Array.isArray(q.options) && q.options.length === 4)
      .map((q: any, i: number) => ({
        id: q.id ?? i + 1,
        question: String(q.question),
        options: q.options.map((o: any) => String(o)),
        correctIndex: Math.min(3, Math.max(0, Number(q.correctIndex) || 0)),
        subject: q.subject ?? subject,
      }))

    if (questions.length === 0) throw new Error('No questions generated. Please try again.')

    // Count this successful generation as one Arena game for free users.
    if (!isPremium) {
      const { data: usage } = await adminClient
        .from('daily_usage')
        .select('arena_games')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()
      await adminClient.from('daily_usage').upsert(
        { user_id: user.id, date: today, arena_games: (usage?.arena_games ?? 0) + 1 },
        { onConflict: 'user_id,date' }
      )
    }

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Arena generate-questions error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate questions' }, { status: 500 })
  }
}
