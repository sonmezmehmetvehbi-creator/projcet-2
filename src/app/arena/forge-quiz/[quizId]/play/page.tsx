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
  if (!quiz || quiz.status === 'ended') redirect('/arena')

  const { data: questions } = await adminClient
    .from('forge_quiz_questions')
    .select('*')
    .eq('quiz_id', params.quizId)
    .order('position', { ascending: true })
  if (!questions || questions.length === 0) redirect(`/arena/forge-quiz/${params.quizId}/lobby`)

  // Already completed? → results.
  const { data: existing } = await adminClient
    .from('forge_quiz_players')
    .select('completed')
    .eq('quiz_id', params.quizId)
    .eq('user_id', user.id)
    .eq('completed', true)
    .maybeSingle()
  if (existing?.completed) redirect(`/arena/forge-quiz/${params.quizId}/results`)

  return (
    <ForgeQuizPlayClient
      quiz={{ id: quiz.id, title: quiz.title, subject: quiz.subject, time_per_question: quiz.time_per_question, banner_color: quiz.banner_color }}
      questions={questions}
      defaultName={profile?.display_name ?? 'Player'}
    />
  )
}
