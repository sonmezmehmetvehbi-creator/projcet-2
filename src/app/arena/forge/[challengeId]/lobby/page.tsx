import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import LobbyClient from './LobbyClient'

export default async function ForgeLobbyPage({ params }: { params: { challengeId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/arena/forge/${params.challengeId}/lobby`)

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const bans = await getUserBans(user.id, adminClient)

  const { data: challenge } = await adminClient
    .from('forge_challenges')
    .select('id')
    .eq('id', params.challengeId)
    .maybeSingle()
  if (!challenge) redirect('/arena')

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} bans={bans} />
      <LobbyClient challengeId={params.challengeId} />
    </div>
  )
}
