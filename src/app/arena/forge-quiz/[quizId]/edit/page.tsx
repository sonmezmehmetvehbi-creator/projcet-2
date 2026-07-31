import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import EditQuizClient from './EditQuizClient'

export default async function ForgeQuizEditPage({ params }: { params: { quizId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arena/forge-quiz/${params.quizId}/edit`)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const bans = await getUserBans(user.id, adminClient)

  const { data: quiz } = await adminClient
    .from('forge_quizzes')
    .select('*')
    .eq('id', params.quizId)
    .maybeSingle()
  if (!quiz) redirect('/arena')
  if (quiz.creator_id !== user.id) redirect(`/arena/forge-quiz/${params.quizId}/lobby`)

  // "Manage" from the Arena hub must reliably land here (edit + relaunch) for the
  // creator of ANY quiz. Previously this redirected every non-expired quiz to
  // /lobby — but for a live-mode quiz with no open session, /lobby then bounces
  // to /arena, so "Manage" appeared to do nothing. Only send an ACTIVE self-paced
  // quiz to its lobby (its real live-management screen, which never bounces).
  const expired = quiz.status === 'ended' || (quiz.expires_at && new Date(quiz.expires_at) < new Date())
  if (!expired && quiz.play_mode === 'self_paced') redirect(`/arena/forge-quiz/${params.quizId}/lobby`)

  const { data: questions } = await adminClient
    .from('forge_quiz_questions')
    .select('*')
    .eq('quiz_id', params.quizId)
    .order('position', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} bans={bans} />
      <EditQuizClient
        quiz={{ id: quiz.id, title: quiz.title, banner_color: quiz.banner_color, time_per_question: quiz.time_per_question, is_public: quiz.is_public ?? false }}
        initialQuestions={questions ?? []}
      />
    </div>
  )
}
