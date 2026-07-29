import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ForgeQuizResultsClient from './ForgeQuizResultsClient'

export default async function ForgeQuizResultsPage({ params }: { params: { quizId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arena/forge-quiz/${params.quizId}/results`)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const bans = await getUserBans(user.id, adminClient)

  const { data: quiz } = await adminClient
    .from('forge_quizzes')
    .select('*')
    .eq('id', params.quizId)
    .maybeSingle()
  if (!quiz) redirect('/arena')

  // Current user's player row — must have completed to view results.
  const { data: me } = await adminClient
    .from('forge_quiz_players')
    .select('*')
    .eq('quiz_id', params.quizId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!me || !me.completed) redirect(`/arena/forge-quiz/${params.quizId}/lobby`)

  const { data: leaderboard } = await adminClient
    .from('forge_quiz_players')
    .select('id, user_id, display_name, avatar_emoji, score, completed')
    .eq('quiz_id', params.quizId)
    .eq('completed', true)
    .eq('is_kicked', false)
    .order('score', { ascending: false })

  const { data: answers } = await adminClient
    .from('forge_quiz_answers')
    .select('question_id, answer, is_correct, points')
    .eq('quiz_id', params.quizId)
    .eq('player_id', me.id)

  const { data: questions } = await adminClient
    .from('forge_quiz_questions')
    .select('id, position, question_text, question_type, options, correct_index, correct_answer, slider_correct')
    .eq('quiz_id', params.quizId)
    .order('position', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} bans={bans} />
      <ForgeQuizResultsClient
        quiz={{ id: quiz.id, title: quiz.title, banner_color: quiz.banner_color, status: quiz.status }}
        me={me}
        leaderboard={leaderboard ?? []}
        answers={answers ?? []}
        questions={questions ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}
