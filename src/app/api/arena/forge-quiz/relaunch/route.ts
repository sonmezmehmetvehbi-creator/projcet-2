import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DURATION_HOURS: Record<string, number> = { '1h': 1, '6h': 6, '12h': 12, '24h': 24, '3d': 72, '7d': 168 }

function roomCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

// POST /api/arena/forge-quiz/relaunch — clone a quiz's questions into a brand
// new quiz with a fresh mode/duration.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { originalQuizId, playMode = 'self_paced', duration = '24h', customDurationHours = null } = await request.json()
    if (!originalQuizId) return NextResponse.json({ error: 'Missing originalQuizId' }, { status: 400 })

    const { data: orig } = await adminClient.from('forge_quizzes').select('*').eq('id', originalQuizId).maybeSingle()
    if (!orig) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    // The creator can always relaunch; anyone can play a PUBLIC quiz from Browse
    // (the clone is owned by the caller and stays private — is_public not copied).
    const isOwner = orig.creator_id === user.id
    if (!isOwner && !orig.is_public) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: questions } = await adminClient
      .from('forge_quiz_questions')
      .select('*')
      .eq('quiz_id', originalQuizId)
      .order('position', { ascending: true })
    if (!questions || questions.length === 0) return NextResponse.json({ error: 'No questions to relaunch' }, { status: 400 })

    const isLive = playMode === 'live'
    const hours = customDurationHours ? Math.max(1, Number(customDurationHours)) : (DURATION_HOURS[duration] ?? 24)
    const expiresAt = isLive ? null : new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

    const { data: newQuiz, error } = await adminClient
      .from('forge_quizzes')
      .insert({
        creator_id: user.id,
        creator_name: orig.creator_name,
        title: orig.title,
        welcome_message: orig.welcome_message,
        banner_color: orig.banner_color,
        play_mode: isLive ? 'live' : 'self_paced',
        time_per_question: orig.time_per_question,
        max_players: orig.max_players,
        allow_replay: orig.allow_replay ?? true,
        room_code: roomCode(),
        status: isLive ? 'waiting' : 'active',
        question_count: questions.length,
        expires_at: expiresAt,
        subject: orig.subject ?? null,
        topic: orig.topic ?? null,
        // Trace this playable copy back to its origin so plays of it count toward
        // the original (e.g. the Browse "have you played this?" rating gate).
        // -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS source_quiz_id uuid;
        source_quiz_id: orig.source_quiz_id ?? originalQuizId,
      })
      .select('id')
      .single()
    if (error) throw error

    const rows = questions.map((q: any, i: number) => ({
      quiz_id: newQuiz.id,
      position: q.position ?? i,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_index: q.correct_index,
      correct_answer: q.correct_answer,
      slider_min: q.slider_min,
      slider_max: q.slider_max,
      slider_correct: q.slider_correct,
      points_multiplier: q.points_multiplier,
      time_limit: q.time_limit,
      speed_bonus_enabled: q.speed_bonus_enabled ?? true,
      image_url: q.image_url,
    }))
    const { error: qErr } = await adminClient.from('forge_quiz_questions').insert(rows)
    if (qErr) throw qErr

    // Count this launch toward the ORIGINAL quiz's popularity (drives Browse's
    // "Most Popular" sort). -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS play_count int DEFAULT 0;
    await adminClient.from('forge_quizzes').update({ play_count: (orig.play_count ?? 0) + 1 }).eq('id', originalQuizId)

    return NextResponse.json({ newQuizId: newQuiz.id, mode: isLive ? 'live' : 'self_paced' })
  } catch (error: any) {
    console.error('Forge quiz relaunch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
