import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import LobbyClient from './LobbyClient'

export default async function ForgeLobbyPage({ params }: { params: { challengeId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // The lobby is public so a shared link works for logged-out users. Guests see
  // the challenge and a "Join Challenge" button that sends them to login.
  let profile = null
  let bans = { generation: false, tutoring: false, support: false }
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
    bans = await getUserBans(user.id, adminClient)
  }

  const { data: challenge } = await adminClient
    .from('forge_challenges')
    .select('id')
    .eq('id', params.challengeId)
    .maybeSingle()
  if (!challenge) redirect('/arena')

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} bans={bans} />
      <LobbyClient challengeId={params.challengeId} isLoggedIn={!!user} />
    </div>
  )
}
