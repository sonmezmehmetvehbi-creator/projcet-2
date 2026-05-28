import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import SupportClient from './SupportClient'

export default async function SupportPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <Navbar profile={profile} />
      <SupportClient profile={profile} tickets={tickets ?? []} />
    </div>
  )
}
