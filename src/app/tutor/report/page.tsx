import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import TutorNavbar from '../dashboard/TutorNavbar'
import { TutorThemeProvider } from '../dashboard/TutorThemeContext'
import TutorReportClient from './TutorReportClient'

export const dynamic = 'force-dynamic'

export default async function TutorReportPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.tutor_status !== 'approved') redirect('/tutor/apply')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tutorProfile } = await adminClient
    .from('tutor_profiles').select('*').eq('user_id', user.id).single()

  const { data: sessionsRaw } = await adminClient
    .from('tutoring_sessions')
    .select('id, student_id, subject, scheduled_at, status')
    .eq('tutor_id', tutorProfile?.id)
    .in('status', ['confirmed', 'completed'])
    .order('scheduled_at', { ascending: false })

  const sessions = await Promise.all((sessionsRaw ?? []).map(async (s) => {
    const { data: student } = await adminClient.from('profiles').select('display_name').eq('id', s.student_id).single()
    return { id: s.id, subject: s.subject, scheduled_at: s.scheduled_at, studentName: student?.display_name ?? 'Student' }
  }))

  return (
    <TutorThemeProvider>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgb(10,10,20), rgb(15,15,30), rgb(18,15,35))' }}>
        <TutorNavbar profile={profile} tutorProfile={tutorProfile} />
        <TutorReportClient sessions={sessions} />
      </div>
    </TutorThemeProvider>
  )
}
