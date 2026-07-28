import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { redirect } from 'next/navigation'
import SpeedRoundClient from './SpeedRoundClient'

export default async function SpeedRoundPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const bans = await getUserBans(user.id, adminClient)
  if (bans.generation) redirect('/arena')

  const today = new Date().toISOString().split('T')[0]
  const { data: usage } = await supabase
    .from('daily_usage')
    .select('arena_games')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle()

  return (
    <SpeedRoundClient
      profile={profile}
      isPremium={!!profile?.is_premium}
      arenaGamesToday={usage?.arena_games ?? 0}
    />
  )
}
