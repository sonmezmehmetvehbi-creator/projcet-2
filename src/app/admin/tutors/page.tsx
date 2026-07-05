import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AdminSidebar from '../dashboard/AdminSidebar'
import { getSidebarCounts } from '../dashboard/adminSidebarCounts'
import AdminTutorsClient from './AdminTutorsClient'

export default async function AdminTutorsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: appsRaw } = await adminClient
    .from('tutor_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const applications = await Promise.all((appsRaw ?? []).map(async (app) => {
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('email, display_name')
      .eq('id', app.user_id)
      .single()
    return { ...app, profiles: profileData }
  }))

  const counts = await getSidebarCounts()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'rgb(18,18,28)' }}>
      <AdminSidebar profile={profile} counts={counts} />
      <div className="admin-content" style={{ marginLeft: '240px', flex: 1, minWidth: 0, minHeight: '100vh', background: 'rgb(250,250,247)' }}>
        <AdminTutorsClient applications={applications} />
      </div>
    </div>
  )
}
