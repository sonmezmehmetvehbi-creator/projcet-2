import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AdminNavbar from '../dashboard/AdminNavbar'
import AdminReportsClient from './AdminReportsClient'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Wrapped so a missing tutor_reports table (before migration) renders empty.
  let reports: any[] = []
  try {
    const { data: raw } = await adminClient
      .from('tutor_reports').select('*').order('created_at', { ascending: false })
    reports = await Promise.all((raw ?? []).map(async (r: any) => {
      const [{ data: tutor }, { data: student }, session] = await Promise.all([
        r.tutor_id ? adminClient.from('tutor_profiles').select('display_name').eq('id', r.tutor_id).single() : Promise.resolve({ data: null }),
        r.student_id ? adminClient.from('profiles').select('display_name, email').eq('id', r.student_id).single() : Promise.resolve({ data: null }),
        r.session_id ? adminClient.from('tutoring_sessions').select('scheduled_at, subject').eq('id', r.session_id).single().then(x => x.data) : Promise.resolve(null),
      ])
      return {
        ...r,
        tutorName: tutor?.display_name ?? 'Tutor',
        studentName: student?.display_name ?? 'Student',
        studentEmail: student?.email ?? null,
        sessionDate: session?.scheduled_at ?? null,
        sessionSubject: session?.subject ?? null,
      }
    }))
  } catch {
    reports = []
  }

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(250,250,247)' }}>
      <AdminNavbar profile={profile} />
      <AdminReportsClient reports={reports} />
    </div>
  )
}
