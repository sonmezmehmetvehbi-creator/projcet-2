import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import TutorNavbar from '@/app/tutor/dashboard/TutorNavbar'
import { TutorThemeProvider } from '@/app/tutor/dashboard/TutorThemeContext'
import TutorApplyClient from './TutorApplyClient'

export default async function TutorApplyPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const isTutor = profile?.role === 'tutor' || profile?.role === 'tutor_pending'

  // Tutors (approved or pending) get the tutor navbar + dark-purple theme. Fetch
  // their tutor profile with the service role so the navbar can render it.
  let tutorProfile: any = null
  if (isTutor) {
    const { data } = await adminClient
      .from('tutor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    tutorProfile = data
  }

  // Check if they have a rejected appeal
  const { data: appeal } = await adminClient
    .from('tutor_appeals')
    .select('status, created_at')
    .eq('email', profile?.email ?? '')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const content = (
    <div style={{ minHeight: '100vh', background: isTutor ? 'rgb(15,15,30)' : 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      {isTutor ? (
        <TutorNavbar profile={profile} tutorProfile={tutorProfile} />
      ) : (
        <Navbar profile={profile} />
      )}
      <TutorApplyClient
        profile={profile}
        existingApplication={tutorProfile}
        appeal={appeal ?? null}
        isTutor={isTutor}
      />
    </div>
  )

  // Wrap tutors in the theme provider so the navbar toggle (useTutorTheme) works here too.
  return isTutor ? <TutorThemeProvider>{content}</TutorThemeProvider> : content
}
