import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import OpenAI from 'openai'

// Forge Challenge — user-created party tournaments. Run once in Supabase:
//
// -- CREATE TABLE IF NOT EXISTS forge_challenges ( ... );  (see project spec)
// -- ALTER TABLE forge_challenges DISABLE ROW LEVEL SECURITY;
// -- CREATE TABLE IF NOT EXISTS forge_participants ( ... );
// -- ALTER TABLE forge_participants DISABLE ROW LEVEL SECURITY;
// -- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS forge_challenges_created int DEFAULT 0;

const DURATION_HOURS: Record<string, number> = {
  '1h': 1, '6h': 6, '12h': 12, '24h': 24, '3d': 72, '7d': 168,
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

async function generateQuestions(subject: string, topic: string, difficulty: string, count: number) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const systemPrompt = `Generate ${count} fast-paced quiz questions for ${subject} - ${topic} at ${difficulty} level. Questions must be short (1-2 sentences max). Each question has exactly 4 options. Return JSON only: { "questions": [{ "id", "question", "options": [string x4], "correctIndex": 0-3, "subject" }] }`
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create ${count} short multiple-choice questions on "${topic}" in ${subject} (${difficulty} level). Respond with valid JSON only.` },
    ],
    temperature: 0.9,
    max_tokens: 3500,
  })
  const raw = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
  return normalize(parsed.questions ?? [], subject)
}

function normalize(list: any[], subject: string) {
  return (list ?? [])
    .filter((q: any) => q && q.question && Array.isArray(q.options) && q.options.length === 4)
    .map((q: any, i: number) => ({
      id: q.id ?? i + 1,
      question: String(q.question),
      options: q.options.map((o: any) => String(o)),
      correctIndex: Math.min(3, Math.max(0, Number(q.correctIndex) || 0)),
      subject: q.subject ?? subject,
    }))
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const body = await request.json()
    const {
      title,
      welcomeMessage = '',
      subject,
      topic,
      difficulty = 'medium',
      questionTypes = ['mc'],
      questionCount = 10,
      totalTimeSeconds = 60,
      correctBonusSeconds = 5,
      wrongPenaltySeconds = 2,
      maxPlayers = null,
      isPasswordProtected = false,
      password = '',
      bannerColor = '#7c3aed',
      duration = '24h',
      displayName,
      avatarEmoji = '🎓',
      questions: passedQuestions,
    } = body

    if (!title || !subject || !topic) {
      return NextResponse.json({ error: 'Missing title, subject, or topic' }, { status: 400 })
    }

    // Free-plan limit: one Forge Challenge creation.
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_premium, forge_challenges_created, display_name')
      .eq('id', user.id)
      .single()

    if (!profile?.is_premium && (profile?.forge_challenges_created ?? 0) >= 1) {
      return NextResponse.json({ error: 'forge_limit_reached', limitReached: true }, { status: 403 })
    }

    // Use client-provided (previewed) questions, else generate server-side.
    let questions = Array.isArray(passedQuestions) ? normalize(passedQuestions, subject) : []
    if (questions.length === 0) {
      questions = await generateQuestions(subject, topic, difficulty, questionCount)
    }
    if (questions.length === 0) throw new Error('Failed to prepare questions')

    const hours = DURATION_HOURS[duration] ?? 24
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
    const creatorName = displayName || profile?.display_name || 'Host'

    const { data: challenge, error } = await adminClient
      .from('forge_challenges')
      .insert({
        creator_id: user.id,
        creator_name: creatorName,
        title,
        welcome_message: welcomeMessage,
        subject,
        topic,
        difficulty,
        question_types: Array.isArray(questionTypes) && questionTypes.length ? questionTypes : ['mc'],
        question_count: questions.length,
        total_time_seconds: totalTimeSeconds,
        correct_bonus_seconds: correctBonusSeconds,
        wrong_penalty_seconds: wrongPenaltySeconds,
        max_players: maxPlayers ? Number(maxPlayers) : null,
        is_password_protected: !!isPasswordProtected,
        password_hash: isPasswordProtected && password ? sha256(password) : null,
        banner_color: bannerColor,
        status: 'active',
        expires_at: expiresAt,
        questions,
      })
      .select('id')
      .single()

    if (error) throw error

    // Increment the creator's usage counter.
    await adminClient
      .from('profiles')
      .update({ forge_challenges_created: (profile?.forge_challenges_created ?? 0) + 1 })
      .eq('id', user.id)

    // Seed the creator as the first participant (so they show in the lobby).
    await adminClient.from('forge_participants').insert({
      challenge_id: challenge.id,
      user_id: user.id,
      display_name: creatorName,
      avatar_emoji: avatarEmoji,
      completed: false,
    })

    return NextResponse.json({ challengeId: challenge.id })
  } catch (error: any) {
    console.error('Forge create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
