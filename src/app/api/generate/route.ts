import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subject, grade, topic, focus, outputType, questionCount, questionTypes, uploadedText } = await request.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    if (!profile?.is_premium) {
      const today = new Date().toISOString().split('T')[0]
      const { data: usage } = await supabase
        .from('daily_usage')
        .select('questions, worksheets')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
      const used = outputType === 'questions' ? (usage?.questions ?? 0) : (usage?.worksheets ?? 0)
      if (used >= 2) return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 })
    }

    const systemPrompt = `You are StudySpark, an expert educational tutor. Create engaging, accurate, age-appropriate study materials. Match language complexity to the student's grade level. Be encouraging and clear. Always respond in valid JSON only — no markdown, no preamble, no backticks.`

    const notesContext = uploadedText
      ? `\n\nIMPORTANT: Base ALL questions/content ONLY on the following student notes. Do not add information from outside these notes:\n\n---\n${uploadedText}\n---\n`
      : ''

    let userPrompt = ''
    if (outputType === 'questions') {
     const hasMC = questionTypes?.includes('mc')
const hasFR = questionTypes?.includes('fr')
const types = hasMC && hasFR
  ? 'a mix of multiple choice and free response'
  : hasFR
  ? 'ONLY free response — do not include any multiple choice questions'
  : 'ONLY multiple choice — do not include any free response questions'
      userPrompt = `Generate ${questionCount} study questions about "${topic}" in ${subject} for a ${grade} student.${focus ? ` Focus specifically on: ${focus}.` : ''}${notesContext}

Include ${types} questions. This is strictly enforced — if the type says ONLY, do not include any other type.

For each MC question provide:
- id (number)
- type: "mc"
- question (string)
- options (array of 4 strings like ["A. ...", "B. ...", "C. ...", "D. ..."])
- correctAnswer (string: "A", "B", "C", or "D")
- explanation (3-5 sentences, plain language, step by step)
- topic (string: the specific subtopic this question covers, e.g. "Mitosis", "Cell membrane")

For each FR question provide:
- id (number)
- type: "fr"
- question (string)
- modelAnswer (3-5 sentences)
- topic (string: the specific subtopic this question covers)

Return JSON: { "questions": [...] }`
    } else {
      userPrompt = `Create a complete study worksheet about "${topic}" in ${subject} for a ${grade} student.${focus ? ` Focus on: ${focus}.` : ''}${notesContext}

Return JSON with this exact structure:
{
  "worksheet": {
    "introduction": {
      "text": "2-3 sentence friendly intro",
      "vocabulary": [{"term": "...", "definition": "..."}]
    },
    "steps": [
      {
        "title": "Step title",
        "explanation": "Clear explanation paragraph",
        "visualDescription": "Describe a simple diagram or table that illustrates this step",
        "keyTakeaway": "One sentence summary"
      }
    ],
    "summary": {
      "bullets": ["bullet 1", "bullet 2"],
      "quickCheck": ["True or false question", "Fill in the blank"]
    },
    "practiceQuestions": [
      {
        "id": 1,
        "type": "mc",
        "question": "...",
        "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
        "correctAnswer": "A",
        "explanation": "...",
        "topic": "specific subtopic"
      }
    ]
  }
}`
    }

    const startTime = Date.now()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (!profile?.is_premium) {
      const elapsed = Date.now() - startTime
      const remaining = 30000 - elapsed
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        subject,
        grade,
        topic,
        focus: focus || null,
        output_type: outputType,
        content: parsed,
      })
      .select('id')
      .single()

    if (sessionError) throw sessionError

    const today = new Date().toISOString().split('T')[0]
    const field = outputType === 'questions' ? 'questions' : 'worksheets'

    const { data: existingUsage } = await supabase
      .from('daily_usage')
      .select('id, questions, worksheets')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (existingUsage) {
      await supabase
        .from('daily_usage')
        .update({ [field]: (existingUsage[field as keyof typeof existingUsage] as number) + 1 })
        .eq('id', existingUsage.id)
    } else {
      await supabase
        .from('daily_usage')
        .insert({ user_id: user.id, date: today, [field]: 1 })
    }

    return NextResponse.json({ sessionId: session.id, outputType })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 })
  }
}