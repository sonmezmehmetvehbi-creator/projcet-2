import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const VALID_TYPES = ['mc', 'tf', 'slider', 'fr']

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      subject = '',
      topic = '',
      difficulty = 'medium',
      count = 10,
      questionTypes = ['mc'],
      uploadedText = '',
    } = await request.json()

    const types: string[] = (Array.isArray(questionTypes) ? questionTypes : ['mc']).filter((t) => VALID_TYPES.includes(t))
    const useTypes = types.length ? types : ['mc']

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const systemPrompt = `Generate ${count} quiz questions for ${subject} - ${topic} at ${difficulty} level. Mix question types as requested: ${useTypes.join(', ')}. Keep questions clear and concise. Return valid JSON only.`

    const format = `Return JSON only in this exact shape:
{
  "questions": [{
    "question_text": string,
    "question_type": "mc" | "tf" | "slider" | "fr",
    "options": string[] (4 options, ONLY for mc),
    "correct_index": number 0-3 (for mc; for tf use 0=True,1=False),
    "correct_answer": string (for tf and fr),
    "slider_min": number (for slider),
    "slider_max": number (for slider),
    "slider_correct": number (for slider),
    "points_multiplier": 1,
    "time_limit": 20
  }]
}
Only use question types from: ${useTypes.join(', ')}. For "tf" set options to ["True","False"].`

    const userPrompt = `${format}
${uploadedText ? `Base the questions on this source material:\n${String(uploadedText).slice(0, 6000)}\n` : ''}Create ${count} questions on "${topic}" in ${subject} (${difficulty}). Variation seed: ${Math.floor(Math.random() * 900000) + 100000}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 4000,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

    const questions = (parsed.questions ?? [])
      .filter((q: any) => q && q.question_text)
      .map((q: any) => {
        const type = VALID_TYPES.includes(q.question_type) ? q.question_type : 'mc'
        const base = {
          question_text: String(q.question_text),
          question_type: type,
          points_multiplier: [0, 1, 2].includes(q.points_multiplier) ? q.points_multiplier : 1,
          time_limit: q.time_limit != null ? Number(q.time_limit) : null,
          options: null as string[] | null,
          correct_index: null as number | null,
          correct_answer: null as string | null,
          slider_min: null as number | null,
          slider_max: null as number | null,
          slider_correct: null as number | null,
          image_url: null as string | null,
        }
        if (type === 'mc') {
          const opts = Array.isArray(q.options) ? q.options.map((o: any) => String(o)).slice(0, 4) : []
          while (opts.length < 4) opts.push('')
          base.options = opts
          base.correct_index = Math.min(3, Math.max(0, Number(q.correct_index) || 0))
        } else if (type === 'tf') {
          base.options = ['True', 'False']
          base.correct_index = Number(q.correct_index) === 1 || String(q.correct_answer).toLowerCase() === 'false' ? 1 : 0
        } else if (type === 'slider') {
          base.slider_min = Number(q.slider_min) || 0
          base.slider_max = Number(q.slider_max) || 100
          base.slider_correct = Number(q.slider_correct) || 0
        } else if (type === 'fr') {
          base.correct_answer = String(q.correct_answer ?? '')
        }
        return base
      })

    if (questions.length === 0) throw new Error('No questions generated. Please try again.')

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Forge quiz generate error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate questions' }, { status: 500 })
  }
}
