import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import JoinIdentityClient from './JoinIdentityClient'

export default async function LiveJoinIdentityPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arena/forge-quiz/live/${params.sessionId}/join`)

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: session } = await adminClient
    .from('forge_quiz_live_sessions')
    .select('id, quiz_id, status')
    .eq('id', params.sessionId)
    .maybeSingle()
  if (!session) redirect('/arena')
  if (session.status === 'active') redirect(`/arena/forge-quiz/live/${params.sessionId}/play`)
  if (session.status === 'ended') redirect('/arena')

  const { data: quiz } = await adminClient
    .from('forge_quizzes')
    .select('title, banner_color')
    .eq('id', session.quiz_id)
    .maybeSingle()

  const { data: existing } = await adminClient
    .from('forge_quiz_live_players')
    .select('id, display_name, avatar_emoji, is_kicked')
    .eq('session_id', params.sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  const { count } = await adminClient
    .from('forge_quiz_live_players')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', params.sessionId)
    .eq('is_kicked', false)

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <JoinIdentityClient
        sessionId={params.sessionId}
        quiz={{ title: quiz?.title ?? 'Quiz', banner_color: quiz?.banner_color ?? '#7c3aed' }}
        currentUserId={user.id}
        defaultName={(profile?.display_name ?? 'Player').slice(0, 15)}
        existing={existing ? { name: existing.display_name, avatar: existing.avatar_emoji, kicked: !!existing.is_kicked } : null}
        initialCount={count ?? 0}
      />
    </div>
  )
}
