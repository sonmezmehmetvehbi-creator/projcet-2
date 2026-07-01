import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import TutorNavbar from '@/app/tutor/dashboard/TutorNavbar'
import { TutorThemeProvider } from '@/app/tutor/dashboard/TutorThemeContext'
import StudentThemeShell from '@/app/contexts/StudentThemeShell'
import SupportClient from './SupportClient'

export default async function SupportPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const isTutor = profile?.role === 'tutor'

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Tutors get the tutor navbar/theme. Fetch their tutor profile with the service
  // role so the navbar can render their rating and avatar.
  let tutorProfile: any = null
  if (isTutor) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await adminClient
      .from('tutor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    tutorProfile = data
  }

  const supportClient = (
    <SupportClient profile={profile} tickets={tickets ?? []} currentUserId={user.id} isTutor={isTutor} />
  )

  // Tutors get the dark-purple tutor theme; wrap them in the theme provider so
  // the navbar toggle (useTutorTheme) works here too.
  if (isTutor) {
    return (
      <TutorThemeProvider>
        <div style={{ minHeight: '100vh', background: 'rgb(15,15,30)' }}>
          <TutorNavbar profile={profile} tutorProfile={tutorProfile} />
          {supportClient}
        </div>
      </TutorThemeProvider>
    )
  }

  // Students get the scoped .student-dark theme via StudentThemeShell.
  return (
    <StudentThemeShell>
      <Navbar profile={profile} />
      {supportClient}
    </StudentThemeShell>
  )
}
