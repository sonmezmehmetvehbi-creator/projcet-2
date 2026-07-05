import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'
import AdminSidebar from './AdminSidebar'
import { getSidebarCounts } from './adminSidebarCounts'

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { count: totalUsers } = await adminClient.from('profiles').select('*', { count: 'exact', head: true })
  const { count: premiumUsers } = await adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true)
  const { count: totalSessions } = await adminClient.from('sessions').select('*', { count: 'exact', head: true })
  const { count: totalWorksheets } = await adminClient.from('sessions').select('*', { count: 'exact', head: true }).eq('output_type', 'worksheet')
  const { count: totalQuestions } = await adminClient.from('sessions').select('*', { count: 'exact', head: true }).eq('output_type', 'questions')
  const { count: totalTutoringSessions } = await adminClient.from('tutoring_sessions').select('*', { count: 'exact', head: true })
  const { count: pendingTutors } = await adminClient.from('tutor_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  const { count: openTickets } = await adminClient.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')

  const today = new Date().toISOString().split('T')[0]
  const { count: activeToday } = await adminClient.from('daily_usage').select('*', { count: 'exact', head: true }).eq('date', today)

  const { data: recentUsersRaw } = await adminClient
    .from('profiles')
    .select('id, display_name, email, is_premium, is_admin, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  // Derive a role badge (Admin / Tutor / Student) for each recent user.
  const { data: tutorRows } = await adminClient.from('tutor_profiles').select('user_id')
  const tutorIds = new Set((tutorRows ?? []).map((r: any) => r.user_id))
  const recentUsers = (recentUsersRaw ?? []).map((u: any) => ({
    ...u,
    role: u.is_admin ? 'Admin' : tutorIds.has(u.id) ? 'Tutor' : 'Student',
  }))

  const { data: ticketsRaw } = await adminClient
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const tickets = await Promise.all((ticketsRaw ?? []).map(async (ticket) => {
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('display_name, email, avatar_url')
      .eq('id', ticket.user_id)
      .single()
    return { ...ticket, profiles: profileData }
  }))

  const { data: pendingTutorRaw } = await adminClient
    .from('tutor_profiles')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const pendingTutorList = await Promise.all((pendingTutorRaw ?? []).map(async (tutor) => {
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('email')
      .eq('id', tutor.user_id)
      .single()
    return { ...tutor, profiles: profileData }
  }))

  const counts = await getSidebarCounts()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'rgb(18,18,28)' }}>
      <AdminSidebar profile={profile} counts={counts} />
      <div className="admin-content" style={{ marginLeft: '240px', flex: 1, minWidth: 0, minHeight: '100vh', background: 'rgb(18,18,28)' }}>
      <AdminDashboardClient
        profile={profile}
        stats={{
          totalUsers: totalUsers ?? 0,
          premiumUsers: premiumUsers ?? 0,
          activeToday: activeToday ?? 0,
          totalSessions: totalSessions ?? 0,
          totalWorksheets: totalWorksheets ?? 0,
          totalQuestions: totalQuestions ?? 0,
          totalTutoringSessions: totalTutoringSessions ?? 0,
          pendingTutors: pendingTutors ?? 0,
          openTickets: openTickets ?? 0,
        }}
        recentUsers={recentUsers ?? []}
        tickets={tickets}
        pendingTutorList={pendingTutorList ?? []}
        currentUserId={user.id}
      />
      </div>
    </div>
  )
}
