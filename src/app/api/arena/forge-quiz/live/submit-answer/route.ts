import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { scoreAnswer, correctAnswerText } from '@/lib/quizScoring'

// Live answers. Run once in Supabase:
//
// -- CREATE TABLE IF NOT EXISTS forge_quiz_live_answers (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   session_id uuid REFERENCES forge_quiz_live_sessions(id),
// --   player_id uuid REFERENCES forge_quiz_live_players(id),
// --   user_id uuid REFERENCES profiles(id),
// --   question_index int,
// --   answer text,
// --   is_correct boolean,
// --   points int DEFAULT 0,
// --   answer_time_ms int,
// --   created_at timestamptz DEFAULT now()
// -- );
// -- ALTER TABLE forge_quiz_live_answers DISABLE ROW LEVEL SECURITY;
// -- ALTER PUBLICATION supabase_realtime ADD TABLE forge_quiz_live_answers;
// --
// -- ALTER TABLE forge_quiz_live_players ADD COLUMN IF NOT EXISTS streak int DEFAULT 0;
// -- ALTER TABLE forge_quiz_live_players ADD COLUMN IF NOT EXISTS best_streak int DEFAULT 0;
// -- ALTER TABLE forge_quiz_live_players ADD COLUMN IF NOT EXISTS correct int DEFAULT 0;
// -- ALTER TABLE forge_quiz_live_players ADD COLUMN IF NOT EXISTS attempted int DEFAULT 0;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { sessionId, questionIndex, answer } = await request.json()
    if (!sessionId || questionIndex == null) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: session } = await adminClient
      .from('forge_quiz_live_sessions')
      .select('quiz_id, status, question_state, current_question_index, question_started_at')
      .eq('id', sessionId)
      .maybeSingle()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    // Reject late submissions (after reveal) and answers for a different question.
    if (session.status !== 'active' || session.question_state !== 'question' || session.current_question_index !== questionIndex) {
      return NextResponse.json({ error: 'not_accepting', tooLate: true }, { status: 409 })
    }

    const { data: player } = await adminClient
      .from('forge_quiz_live_players')
      .select('id, score, streak, best_streak, correct, attempted, is_kicked')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!player) return NextResponse.json({ error: 'Not a player in this game' }, { status: 403 })
    if (player.is_kicked) return NextResponse.json({ error: 'kicked' }, { status: 403 })

    // One answer per question.
    const { data: existingAns } = await adminClient
      .from('forge_quiz_live_answers')
      .select('id, is_correct, points')
      .eq('session_id', sessionId)
      .eq('player_id', player.id)
      .eq('question_index', questionIndex)
      .maybeSingle()

    const { data: question } = await adminClient
      .from('forge_quiz_questions')
      .select('*')
      .eq('quiz_id', session.quiz_id)
      .eq('position', questionIndex)
      .maybeSingle()
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

    const correctAnswer = correctAnswerText(question)

    if (existingAns) {
      return NextResponse.json({ isCorrect: existingAns.is_correct, points: existingAns.points, correctAnswer, alreadyAnswered: true })
    }

    const { data: quiz } = await adminClient.from('forge_quizzes').select('time_per_question').eq('id', session.quiz_id).maybeSingle()
    const timeLimitSec = question.time_limit || quiz?.time_per_question || 20
    const elapsedMs = Math.max(0, Date.now() - new Date(session.question_started_at).getTime())

    const { isCorrect, points: basePoints } = scoreAnswer(question, answer, elapsedMs, timeLimitSec)

    // Streak bonus: +200 every 3 correct in a row.
    const newStreak = isCorrect ? (player.streak ?? 0) + 1 : 0
    const bonus = isCorrect && newStreak > 0 && newStreak % 3 === 0 ? 200 : 0
    const gained = basePoints + bonus
    const newBest = Math.max(player.best_streak ?? 0, newStreak)

    // NOTE: the live answers table keys answers by (session_id, question_index) —
    // there is no separate question_id column. question_index === the session's
    // current_question_index, which is exactly what the host queries against, so
    // there's no id/session mismatch here (verified against fetchReveal/fetchCounts).
    const { error: insertError } = await adminClient.from('forge_quiz_live_answers').insert({
      session_id: sessionId, player_id: player.id, user_id: user.id, question_index: questionIndex,
      answer: answer != null ? String(answer) : null, is_correct: isCorrect, points: gained, answer_time_ms: elapsedMs,
    })
    if (insertError) {
      console.error('[Live] answer insert failed:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    console.log('[Live] answer inserted for session:', sessionId, 'question_index:', questionIndex)

    await adminClient.from('forge_quiz_live_players').update({
      score: (player.score ?? 0) + gained,
      streak: newStreak,
      best_streak: newBest,
      correct: (player.correct ?? 0) + (isCorrect ? 1 : 0),
      attempted: (player.attempted ?? 0) + 1,
    }).eq('id', player.id)

    return NextResponse.json({ isCorrect, points: gained, correctAnswer })
  } catch (error: any) {
    console.error('Forge quiz live submit-answer error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
