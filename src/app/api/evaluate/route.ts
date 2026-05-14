import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  try {
    const { question, modelAnswer, studentAnswer, grade, subject } = await request.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive educational tutor. Evaluate student answers encouragingly. Always respond in valid JSON only — no markdown, no backticks.',
        },
        {
          role: 'user',
          content: `Evaluate this ${subject} answer from a ${grade} student.

Question: ${question}
Model answer: ${modelAnswer}
Student answer: ${studentAnswer}

Give a score like "3/4" or "Good" and encouraging feedback (2-3 sentences) that explains what they got right and what to improve. Be warm and constructive.

Return JSON: { "score": "...", "feedback": "..." }`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}