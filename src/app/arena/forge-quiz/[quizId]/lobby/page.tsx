import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import LobbyClient from './LobbyClient'

export default async function ForgeQuizLobbyPage({ params }: { params: { quizId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arena/forge-quiz/${params.quizId}/lobby`)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const bans = await getUserBans(user.id, adminClient)

  const { data: quiz } = await adminClient
    .from('forge_quizzes')
    .select('*')
    .eq('id', params.quizId)
    .maybeSingle()
  if (!quiz) redirect('/arena')

  // Live Room quizzes never use this self-paced lobby (nor its room_code). Route
  // to the real live waiting room / code-join flow instead.
  if (quiz.play_mode === 'live' || quiz.play_mode === 'live_room') {
    const { data: liveSession } = await adminClient
      .from('forge_quiz_live_sessions')
      .select('id, host_id, status')
      .eq('quiz_id', params.quizId)
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (liveSession) {
      if (liveSession.host_id === user.id) redirect(`/arena/forge-quiz/live/${liveSession.id}/host`)
      redirect(`/arena/forge-quiz/live/${liveSession.id}/join`)
    }
    // No open session — the host relaunches from the Arena; nothing to join here.
    redirect('/arena')
  }

  const { data: questions } = await adminClient
    .from('forge_quiz_questions')
    .select('id, position, question_type')
    .eq('quiz_id', params.quizId)
    .order('position', { ascending: true })

  const { data: players } = await adminClient
    .from('forge_quiz_players')
    .select('id, user_id, display_name, avatar_emoji, total_score, completed')
    .eq('quiz_id', params.quizId)
    .eq('is_kicked', false)
    .order('joined_at', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} bans={bans} />
      <LobbyClient
        quiz={quiz}
        questionCount={questions?.length ?? quiz.question_count ?? 0}
        initialPlayers={players ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}
