import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AdminSidebar from '../dashboard/AdminSidebar'
import { getSidebarCounts } from '../dashboard/adminSidebarCounts'
import AdminSupportClient from './AdminSupportClient'

export default async function AdminSupportPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: ticketsRaw } = await adminClient
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  const tickets = await Promise.all((ticketsRaw ?? []).map(async (ticket) => {
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('display_name, email, avatar_url')
      .eq('id', ticket.user_id)
      .single()
    return { ...ticket, profiles: profileData }
  }))

  const counts = await getSidebarCounts()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'rgb(18,18,28)' }}>
      <AdminSidebar profile={profile} counts={counts} />
      <div className="admin-content" style={{ marginLeft: '240px', flex: 1, minWidth: 0, minHeight: '100vh', background: 'rgb(250,250,247)' }}>
        <AdminSupportClient tickets={tickets} currentUserId={user.id} />
      </div>
    </div>
  )
}
