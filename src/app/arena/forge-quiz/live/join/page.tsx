import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import JoinLiveClient from './JoinLiveClient'

export default async function LiveJoinPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/arena/forge-quiz/live/join')

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <JoinLiveClient />
    </div>
  )
}
