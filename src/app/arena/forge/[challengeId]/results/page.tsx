import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ResultsClient from './ResultsClient'

export default async function ForgeResultsPage({ params }: { params: { challengeId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arena/forge/${params.challengeId}/results`)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const bans = await getUserBans(user.id, adminClient)

  const lobby = `/arena/forge/${params.challengeId}/lobby`

  const { data: challenge } = await adminClient
    .from('forge_challenges')
    .select('id, creator_id, creator_name, title, subject, topic')
    .eq('id', params.challengeId)
    .maybeSingle()
  if (!challenge) redirect('/arena')

  // The current user must have completed the challenge to see results.
  const { data: me } = await adminClient
    .from('forge_participants')
    .select('*')
    .eq('challenge_id', params.challengeId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!me || !me.completed || me.is_kicked) redirect(lobby)

  const { data: leaderboard } = await adminClient
    .from('forge_participants')
    .select('user_id, display_name, avatar_emoji, score, correct, attempted, best_streak, completion_time_seconds, completed')
    .eq('challenge_id', params.challengeId)
    .eq('is_kicked', false)
    .order('score', { ascending: false })

  const canCreate = !!profile?.is_premium || (profile?.forge_challenges_created ?? 0) < 1

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} bans={bans} />
      <ResultsClient
        challenge={challenge}
        me={me}
        leaderboard={leaderboard ?? []}
        currentUserId={user.id}
        canCreate={canCreate}
      />
    </div>
  )
}
