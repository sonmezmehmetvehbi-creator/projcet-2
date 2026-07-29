import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ForgeQuizPlayClient from './ForgeQuizPlayClient'

export default async function ForgeQuizPlayPage({ params }: { params: { quizId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arena/forge-quiz/${params.quizId}/play`)

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: quiz } = await adminClient
    .from('forge_quizzes')
    .select('*')
    .eq('id', params.quizId)
    .maybeSingle()
  if (!quiz) redirect('/arena')

  const expired = quiz.status === 'ended' || (quiz.expires_at && new Date(quiz.expires_at) < new Date())

  const { data: questions } = await adminClient
    .from('forge_quiz_questions')
    .select('*')
    .eq('quiz_id', params.quizId)
    .order('position', { ascending: true })
  if (!questions || questions.length === 0) redirect(`/arena/forge-quiz/${params.quizId}/lobby`)

  // Has the user already completed this quiz?
  const { data: existing } = await adminClient
    .from('forge_quiz_players')
    .select('id, display_name, avatar_emoji, total_score, completed')
    .eq('quiz_id', params.quizId)
    .eq('user_id', user.id)
    .maybeSingle()

  const alreadyCompleted = !!existing?.completed
  // Expired, or completed with replay off → straight to results.
  if (alreadyCompleted && (expired || quiz.allow_replay === false)) {
    redirect(`/arena/forge-quiz/${params.quizId}/results`)
  }
  // Not yet played but expired → can't play.
  if (!alreadyCompleted && expired) redirect(`/arena/forge-quiz/${params.quizId}/lobby`)

  // Compute rank for the completed screen.
  let myRank = 0, totalPlayers = 0
  if (alreadyCompleted) {
    const { data: board } = await adminClient
      .from('forge_quiz_players')
      .select('user_id, total_score')
      .eq('quiz_id', params.quizId)
      .eq('completed', true)
      .eq('is_kicked', false)
      .order('total_score', { ascending: false })
    totalPlayers = board?.length ?? 0
    myRank = Math.max(1, (board ?? []).findIndex((b) => b.user_id === user.id) + 1)
  }

  return (
    <ForgeQuizPlayClient
      quiz={{ id: quiz.id, title: quiz.title, subject: quiz.subject, time_per_question: quiz.time_per_question, banner_color: quiz.banner_color, allow_replay: quiz.allow_replay !== false }}
      questions={questions}
      defaultName={existing?.display_name || profile?.display_name || 'Player'}
      defaultAvatar={existing?.avatar_emoji || '🎓'}
      alreadyCompleted={alreadyCompleted}
      previousScore={existing?.total_score ?? 0}
      myRank={myRank}
      totalPlayers={totalPlayers}
    />
  )
}
