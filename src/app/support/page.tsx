import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import TutorNavbar from '@/app/tutor/dashboard/TutorNavbar'
import { TutorThemeProvider } from '@/app/tutor/dashboard/TutorThemeContext'
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

  const content = (
    <div style={{ minHeight: '100vh', background: isTutor ? 'rgb(15,15,30)' : 'rgb(250,250,247)' }}>
      {isTutor ? (
        <TutorNavbar profile={profile} tutorProfile={tutorProfile} />
      ) : (
        <Navbar profile={profile} />
      )}
      <SupportClient profile={profile} tickets={tickets ?? []} currentUserId={user.id} isTutor={isTutor} />
    </div>
  )

  // Wrap tutors in the theme provider so the navbar toggle (useTutorTheme) works here too.
  return isTutor ? <TutorThemeProvider>{content}</TutorThemeProvider> : content
}
