import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import LiveResultsClient from './LiveResultsClient'

// Static (non-realtime) after-the-fact results view for a finished live session.
export default async function LiveResultsPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arena/forge-quiz/live/${params.sessionId}/results`)

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: session } = await adminClient
    .from('forge_quiz_live_sessions')
    .select('id, quiz_id, host_id')
    .eq('id', params.sessionId)
    .maybeSingle()
  if (!session) redirect('/arena')

  const { data: quiz } = await adminClient
    .from('forge_quizzes')
    .select('title, banner_color')
    .eq('id', session.quiz_id)
    .maybeSingle()

  const { data: rows } = await adminClient
    .from('forge_quiz_live_players')
    .select('user_id, display_name, avatar_emoji, score, correct, attempted, best_streak')
    .eq('session_id', params.sessionId)
    .eq('is_kicked', false)
    .order('score', { ascending: false })

  const players = rows ?? []
  const isHost = session.host_id === user.id
  const viewerIdx = players.findIndex((p: any) => p.user_id === user.id)

  // Only the host or someone who actually played may view.
  if (!isHost && viewerIdx < 0) redirect('/arena')

  const viewerRow: any = viewerIdx >= 0 ? players[viewerIdx] : null
  const me = viewerRow ? {
    rank: viewerIdx + 1, totalPlayers: players.length, score: viewerRow.score ?? 0,
    correct: viewerRow.correct ?? 0, attempted: viewerRow.attempted ?? 0, bestStreak: viewerRow.best_streak ?? 0,
    displayName: viewerRow.display_name, avatar: viewerRow.avatar_emoji,
  } : null

  return (
    <LiveResultsClient
      isHost={isHost}
      sessionId={params.sessionId}
      quizId={session.quiz_id}
      quizTitle={quiz?.title ?? 'Quiz'}
      bannerColor={quiz?.banner_color ?? '#7c3aed'}
      players={players.map((p: any) => ({ user_id: p.user_id, display_name: p.display_name, avatar_emoji: p.avatar_emoji, score: p.score ?? 0 }))}
      viewerId={user.id}
      me={me}
    />
  )
}
