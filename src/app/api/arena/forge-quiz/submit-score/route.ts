import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Per-question answers for a Forge Quiz. Run once in Supabase:
//
// -- CREATE TABLE IF NOT EXISTS forge_quiz_answers (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   quiz_id uuid REFERENCES forge_quizzes(id),
// --   player_id uuid REFERENCES forge_quiz_players(id),
// --   user_id uuid REFERENCES profiles(id),
// --   question_id uuid REFERENCES forge_quiz_questions(id),
// --   answer text,
// --   is_correct boolean,
// --   points int DEFAULT 0,
// --   created_at timestamptz DEFAULT now()
// -- );
// -- ALTER TABLE forge_quiz_answers DISABLE ROW LEVEL SECURITY;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId, score = 0, correct = 0, attempted = 0, bestStreak = 0, answers = [] } = await request.json()
    if (!quizId) return NextResponse.json({ error: 'Missing quizId' }, { status: 400 })

    const { data: quiz } = await adminClient.from('forge_quizzes').select('allow_replay').eq('id', quizId).maybeSingle()

    // Locate (or create) the player row.
    let { data: player } = await adminClient
      .from('forge_quiz_players')
      .select('id, completed')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Already completed → this is a replay. Store answers as practice (if the
    // creator allows it) but never overwrite the leaderboard score.
    if (player?.completed) {
      if (quiz?.allow_replay === false) {
        return NextResponse.json({ success: true, finalScore: score, alreadySubmitted: true })
      }
      if (Array.isArray(answers) && answers.length) {
        const rows = answers.map((a: any) => ({
          quiz_id: quizId, player_id: player!.id, user_id: user.id, question_id: a.question_id,
          answer: a.answer != null ? String(a.answer) : null, is_correct: !!a.is_correct, points: Number(a.points) || 0,
        }))
        const { error: answersError } = await adminClient.from('forge_quiz_answers').insert(rows)
        if (answersError) {
          console.error('forge_quiz_answers insert error:', answersError)
        } else {
          console.log('Inserted', rows.length, 'answers for player', player!.id)
        }
      }
      return NextResponse.json({ success: true, practice: true, finalScore: score })
    }

    if (!player) {
      const { data: created } = await adminClient
        .from('forge_quiz_players')
        .insert({ quiz_id: quizId, user_id: user.id, display_name: 'Player' })
        .select('id, completed')
        .single()
      player = created
    }

    console.log('Updating player:', player!.id, 'with total_score:', score, 'completed: true')
    await adminClient
      .from('forge_quiz_players')
      .update({
        total_score: score,
        completed: true,
        completed_at: new Date().toISOString(),
        correct: Number(correct) || 0,
        attempted: Number(attempted) || 0,
        best_streak: Number(bestStreak) || 0,
      })
      .eq('id', player!.id)

    // Store each answer.
    if (Array.isArray(answers) && answers.length) {
      const rows = answers.map((a: any) => ({
        quiz_id: quizId,
        player_id: player!.id,
        user_id: user.id,
        question_id: a.question_id,
        answer: a.answer != null ? String(a.answer) : null,
        is_correct: !!a.is_correct,
        points: Number(a.points) || 0,
      }))
      const { error: answersError } = await adminClient.from('forge_quiz_answers').insert(rows)
      if (answersError) {
        console.error('forge_quiz_answers insert error:', answersError)
      } else {
        console.log('Inserted', rows.length, 'answers for player', player!.id)
      }
    }

    // Award XP (5 per correct answer) directly on the profile.
    try {
      const gained = (Number(correct) || 0) * 5
      if (gained > 0) {
        const { data: prof } = await adminClient.from('profiles').select('xp').eq('id', user.id).single()
        await adminClient.from('profiles').update({ xp: (prof?.xp ?? 0) + gained }).eq('id', user.id)
      }
    } catch {}

    return NextResponse.json({ success: true, finalScore: score })
  } catch (error: any) {
    console.error('Forge quiz submit-score error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
