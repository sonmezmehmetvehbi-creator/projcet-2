import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AdminSidebar from '../dashboard/AdminSidebar'
import { getSidebarCounts } from '../dashboard/adminSidebarCounts'
import AdminAppealsClient from './AdminAppealsClient'

export default async function AdminAppealsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: appeals } = await adminClient
    .from('tutor_appeals')
    .select('*')
    .order('created_at', { ascending: false })

  const counts = await getSidebarCounts()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'rgb(18,18,28)' }}>
      <AdminSidebar profile={profile} counts={counts} />
      <div className="admin-content" style={{ marginLeft: '240px', flex: 1, minWidth: 0, minHeight: '100vh', background: 'rgb(18,18,28)' }}>
        <AdminAppealsClient appeals={appeals ?? []} />
      </div>
    </div>
  )
}
