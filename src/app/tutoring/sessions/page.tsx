
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import StudentThemeShell from '@/app/contexts/StudentThemeShell'
import SessionsListClient from './SessionsListClient'

export default async function TutoringSessionsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: sessionsRaw } = await adminClient
    .from('tutoring_sessions')
    .select('*')
    .eq('student_id', user.id)
    .order('scheduled_at', { ascending: false })

  const sessions = await Promise.all((sessionsRaw ?? []).map(async (s) => {
    const { data: tp } = await adminClient.from('tutor_profiles').select('id, display_name, rating, subjects, avatar_url').eq('id', s.tutor_id).single()
    return { ...s, tutor_profiles: tp }
  }))

  return (
    <StudentThemeShell>
      <Navbar profile={profile} />
      <SessionsListClient sessions={sessions} userId={user.id} />
    </StudentThemeShell>
  )
}
