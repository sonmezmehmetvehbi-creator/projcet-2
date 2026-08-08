import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ForgeQuizPlayClient from './ForgeQuizPlayClient'

export default async function ForgeQuizPlayPage({ params }: { params: { quizId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Guests (no account) may play a Self-Paced Room via its shared link. They
  // identify via a client-side guest_id and always start a fresh playthrough
  // (their prior completion can't be resolved server-side).

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

  let profile: { display_name?: string | null } | null = null
  let existing: any = null
  let alreadyCompleted = false
  let myRank = 0, totalPlayers = 0

  if (user) {
    const { data: prof } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
    profile = prof

    // Has the user already completed this quiz?
    const { data: existingRow } = await adminClient
      .from('forge_quiz_players')
      .select('id, display_name, avatar_emoji, total_score, completed')
      .eq('quiz_id', params.quizId)
      .eq('user_id', user.id)
      .maybeSingle()
    existing = existingRow
    alreadyCompleted = !!existingRow?.completed

    // Expired, or completed with replay off → straight to results.
    if (alreadyCompleted && (expired || quiz.allow_replay === false)) {
      redirect(`/arena/forge-quiz/${params.quizId}/results`)
    }
    // Compute rank for the completed screen.
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
  }

  // Expired and not (yet) completed → can't play.
  if (!alreadyCompleted && expired) redirect(`/arena/forge-quiz/${params.quizId}/lobby`)

  return (
    <ForgeQuizPlayClient
      quiz={{ id: quiz.id, title: quiz.title, subject: quiz.subject, time_per_question: quiz.time_per_question, banner_color: quiz.banner_color, allow_replay: quiz.allow_replay !== false }}
      questions={questions}
      isGuest={!user}
      defaultName={existing?.display_name || profile?.display_name || 'Player'}
      defaultAvatar={existing?.avatar_emoji || '🎓'}
      alreadyCompleted={alreadyCompleted}
      previousScore={existing?.total_score ?? 0}
      myRank={myRank}
      totalPlayers={totalPlayers}
    />
  )
}
