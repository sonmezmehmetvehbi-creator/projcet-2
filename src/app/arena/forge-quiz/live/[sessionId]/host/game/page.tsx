import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import HostGameClient from './HostGameClient'

export default async function HostGamePage({ params }: { params: { sessionId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: session } = await adminClient
    .from('forge_quiz_live_sessions')
    .select('*')
    .eq('id', params.sessionId)
    .maybeSingle()
  if (!session) redirect('/arena')
  if (session.host_id !== user.id) redirect('/arena')
  if (session.status === 'waiting') redirect(`/arena/forge-quiz/live/${params.sessionId}/host`)

  const { data: quiz } = await adminClient
    .from('forge_quizzes')
    .select('title, banner_color, time_per_question')
    .eq('id', session.quiz_id)
    .maybeSingle()

  const { data: questions } = await adminClient
    .from('forge_quiz_questions')
    .select('id, position, question_text, question_type, options, correct_index, correct_answer, slider_min, slider_max, slider_correct, time_limit, image_url')
    .eq('quiz_id', session.quiz_id)
    .order('position', { ascending: true })

  return (
    <HostGameClient
      sessionId={params.sessionId}
      initialSession={{
        status: session.status,
        display_mode: session.display_mode,
        current_question_index: session.current_question_index ?? 0,
        question_state: session.question_state ?? 'question',
        question_started_at: session.question_started_at,
      }}
      quiz={{ title: quiz?.title ?? 'Quiz', banner_color: quiz?.banner_color ?? '#7c3aed', time_per_question: quiz?.time_per_question ?? 20 }}
      questions={questions ?? []}
    />
  )
}
