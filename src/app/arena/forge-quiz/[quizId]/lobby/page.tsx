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
