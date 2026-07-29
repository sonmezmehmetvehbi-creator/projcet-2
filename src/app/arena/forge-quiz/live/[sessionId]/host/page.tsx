import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import HostWaitingRoomClient from './HostWaitingRoomClient'

export default async function HostWaitingRoomPage({ params }: { params: { sessionId: string } }) {
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

  // If the game already started, jump the host straight to the game view.
  if (session.status === 'active') redirect(`/arena/forge-quiz/live/${params.sessionId}/host/game`)

  const { data: quiz } = await adminClient
    .from('forge_quizzes')
    .select('title, banner_color')
    .eq('id', session.quiz_id)
    .maybeSingle()

  const { data: players } = await adminClient
    .from('forge_quiz_live_players')
    .select('id, user_id, display_name, avatar_emoji')
    .eq('session_id', params.sessionId)
    .eq('is_kicked', false)
    .order('joined_at', { ascending: true })

  return (
    <HostWaitingRoomClient
      session={{ id: session.id, room_code: session.room_code, status: session.status, max_players: session.max_players, countdown_target_at: session.countdown_target_at }}
      quiz={{ title: quiz?.title ?? 'Quiz', banner_color: quiz?.banner_color ?? '#7c3aed' }}
      initialPlayers={players ?? []}
    />
  )
}
