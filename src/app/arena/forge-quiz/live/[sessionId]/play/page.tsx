import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import PlayLiveClient from './PlayLiveClient'

export default async function LivePlayPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arena/forge-quiz/live/${params.sessionId}/play`)

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: session } = await adminClient
    .from('forge_quiz_live_sessions')
    .select('*')
    .eq('id', params.sessionId)
    .maybeSingle()
  if (!session) redirect('/arena')
  if (session.status === 'ended') redirect('/arena')
  if (session.status === 'waiting') redirect(`/arena/forge-quiz/live/${params.sessionId}/join`)

  const { data: player } = await adminClient
    .from('forge_quiz_live_players')
    .select('id, display_name, avatar_emoji, is_kicked')
    .eq('session_id', params.sessionId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!player || player.is_kicked) redirect(`/arena/forge-quiz/live/${params.sessionId}/join`)

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
    <PlayLiveClient
      sessionId={params.sessionId}
      userId={user.id}
      me={{ display_name: player.display_name, avatar_emoji: player.avatar_emoji }}
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
