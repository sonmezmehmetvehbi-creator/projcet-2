import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AdminUsersClient from './AdminUsersClient'
import AdminNavbar from '../dashboard/AdminNavbar'

export default async function AdminUsersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // All profiles.
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, display_name, email, role, is_admin, is_premium, created_at, xp, level, tutor_status')
    .order('created_at', { ascending: false })

  // Aggregate per-user usage without an N+1 query: pull the raw rows and fold in JS.
  const [{ data: sessionRows }, { data: tutoringRows }, { data: usageRows }] = await Promise.all([
    adminClient.from('sessions').select('user_id'),
    adminClient.from('tutoring_sessions').select('student_id'),
    adminClient.from('daily_usage').select('user_id, questions, worksheets, date'),
  ])

  const sessionCount = new Map<string, number>()
  for (const r of sessionRows ?? []) {
    if (!r.user_id) continue
    sessionCount.set(r.user_id, (sessionCount.get(r.user_id) ?? 0) + 1)
  }

  const tutoringCount = new Map<string, number>()
  for (const r of tutoringRows ?? []) {
    if (!r.student_id) continue
    tutoringCount.set(r.student_id, (tutoringCount.get(r.student_id) ?? 0) + 1)
  }

  const usageAgg = new Map<string, { questions: number; worksheets: number; lastActive: string | null }>()
  for (const r of usageRows ?? []) {
    if (!r.user_id) continue
    const cur = usageAgg.get(r.user_id) ?? { questions: 0, worksheets: 0, lastActive: null }
    cur.questions += r.questions ?? 0
    cur.worksheets += r.worksheets ?? 0
    if (r.date && (!cur.lastActive || r.date > cur.lastActive)) cur.lastActive = r.date
    usageAgg.set(r.user_id, cur)
  }

  const users = (profiles ?? []).map((u: any) => {
    const usage = usageAgg.get(u.id) ?? { questions: 0, worksheets: 0, lastActive: null }
    const accountType = u.is_admin
      ? 'Admin'
      : (u.tutor_status === 'approved' || u.role === 'tutor' || u.role === 'tutor_pending')
        ? 'Tutor'
        : 'Student'
    return {
      ...u,
      accountType,
      totalSessions: sessionCount.get(u.id) ?? 0,
      totalTutoringSessions: tutoringCount.get(u.id) ?? 0,
      totalQuestions: usage.questions,
      totalWorksheets: usage.worksheets,
      lastActive: usage.lastActive,
    }
  })

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(250,250,247)' }}>
      <AdminNavbar profile={profile} />
      <AdminUsersClient users={users} currentUserId={user.id} />
    </div>
  )
}
