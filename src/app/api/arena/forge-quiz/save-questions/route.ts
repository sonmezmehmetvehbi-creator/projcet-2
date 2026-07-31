import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/save-questions — creator replaces a quiz's
// questions (used by the edit flow before relaunching).
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId, questions } = await request.json()
    if (!quizId || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Missing quizId or questions' }, { status: 400 })
    }

    const { data: quiz } = await adminClient.from('forge_quizzes').select('creator_id').eq('id', quizId).maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    if (quiz.creator_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Replace the question set.
    await adminClient.from('forge_quiz_questions').delete().eq('quiz_id', quizId)

    const rows = questions.map((q: any, i: number) => ({
      quiz_id: quizId,
      position: i,
      question_text: String(q.question_text ?? ''),
      question_type: ['mc', 'tf', 'slider', 'fr'].includes(q.question_type) ? q.question_type : 'mc',
      options: Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : null,
      correct_index: typeof q.correct_index === 'number' ? q.correct_index : null,
      correct_answer: q.correct_answer != null ? String(q.correct_answer) : null,
      slider_min: q.slider_min != null ? Number(q.slider_min) : null,
      slider_max: q.slider_max != null ? Number(q.slider_max) : null,
      slider_correct: q.slider_correct != null ? Number(q.slider_correct) : null,
      points_multiplier: [0, 1, 2].includes(q.points_multiplier) ? q.points_multiplier : 1,
      time_limit: q.time_limit != null ? Number(q.time_limit) : null,
      speed_bonus_enabled: q.speed_bonus_enabled === false ? false : true,
      image_url: q.image_url && q.image_url !== '__uploading__' ? q.image_url : null,
    }))
    const { error: qErr } = await adminClient.from('forge_quiz_questions').insert(rows)
    if (qErr) throw qErr

    await adminClient.from('forge_quizzes').update({ question_count: rows.length }).eq('id', quizId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forge quiz save-questions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
