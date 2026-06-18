import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import TutorDashboardClient from './TutorDashboardClient'
import { TutorThemeProvider } from './TutorThemeContext'

export default async function TutorDashboardPage() {
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
    .from('tutor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: sessionsRaw } = await adminClient
    .from('tutoring_sessions')
    .select('*')
    .eq('tutor_id', tutorProfile?.id)
    .order('scheduled_at', { ascending: false })

  const sessions = await Promise.all((sessionsRaw ?? []).map(async (s) => {
    const { data: studentProfile } = await adminClient
      .from('profiles')
      .select('display_name, email, avatar_url')
      .eq('id', s.student_id)
      .single()
    return { ...s, profiles: studentProfile }
  }))

  // Fetch reviews then look up student names manually — the embedded FK join
  // (profiles!tutor_reviews_student_id_fkey) was failing and returning nothing.
  const { data: reviewsRaw } = await adminClient
    .from('tutor_reviews')
    .select('*')
    .eq('tutor_id', tutorProfile?.id)
    .order('created_at', { ascending: false })

  const reviews = await Promise.all((reviewsRaw ?? []).map(async (r) => {
    const { data: student } = await adminClient.from('profiles').select('display_name').eq('id', r.student_id).single()
    return { ...r, profiles: student }
  }))

  const { data: payouts } = await adminClient
    .from('tutor_payouts')
    .select('*')
    .eq('tutor_id', tutorProfile?.id)
    .order('created_at', { ascending: false })

  const { data: availability } = await adminClient
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', tutorProfile?.id)

  return (
    <TutorThemeProvider>
      <div style={{ minHeight: '100vh' }}>
        <TutorDashboardClient
          profile={profile}
          tutorProfile={tutorProfile}
          sessions={sessions ?? []}
          reviews={reviews ?? []}
          payouts={payouts ?? []}
          availability={availability ?? []}
        />
      </div>
    </TutorThemeProvider>
  )
}
