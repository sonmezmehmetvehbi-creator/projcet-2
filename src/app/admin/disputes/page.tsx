import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminSidebar from '../dashboard/AdminSidebar'
import { getSidebarCounts } from '../dashboard/adminSidebarCounts'
import AdminDisputesClient from './AdminDisputesClient'

export default async function AdminDisputesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: disputes } = await supabase
    .from('tutoring_sessions')
    .select('*, tutor_profiles(display_name), profiles!tutoring_sessions_student_id_fkey(display_name, email)')
    .eq('dispute_filed', true)
    .order('created_at', { ascending: false })

  const counts = await getSidebarCounts()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'rgb(18,18,28)' }}>
      <AdminSidebar profile={profile} counts={counts} />
      <div className="admin-content" style={{ marginLeft: '240px', flex: 1, minWidth: 0, minHeight: '100vh', background: 'rgb(250,250,247)' }}>
        <AdminDisputesClient disputes={disputes ?? []} />
      </div>
    </div>
  )
}
