import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'
import AdminNavbar from './AdminNavbar'

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  // Stats
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count:'exact', head:true })
  const { count: premiumUsers } = await supabase.from('profiles').select('*', { count:'exact', head:true }).eq('is_premium', true)
  const { count: totalSessions } = await supabase.from('sessions').select('*', { count:'exact', head:true })
  const { count: totalWorksheets } = await supabase.from('sessions').select('*', { count:'exact', head:true }).eq('output_type', 'worksheet')
  const { count: totalQuestions } = await supabase.from('sessions').select('*', { count:'exact', head:true }).eq('output_type', 'questions')
  const { count: totalTutoringSessions } = await supabase.from('tutoring_sessions').select('*', { count:'exact', head:true })
  const { count: pendingTutors } = await supabase.from('tutor_profiles').select('*', { count:'exact', head:true }).eq('status', 'pending')
  const { count: openTickets } = await supabase.from('support_tickets').select('*', { count:'exact', head:true }).eq('status', 'open')

  // Active today
  const today = new Date().toISOString().split('T')[0]
  const { count: activeToday } = await supabase.from('daily_usage').select('*', { count:'exact', head:true }).eq('date', today)

  // Recent signups
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, display_name, email, is_premium, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // Support tickets
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*, profiles!support_tickets_user_id_fkey(display_name, email, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(20)

  // Pending tutor applications
  const { data: pendingTutorList } = await supabase
    .from('tutor_profiles')
    .select('*, profiles!tutor_profiles_user_id_fkey(email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <AdminNavbar profile={profile} />
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
        tickets={tickets ?? []}
        pendingTutorList={pendingTutorList ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}
