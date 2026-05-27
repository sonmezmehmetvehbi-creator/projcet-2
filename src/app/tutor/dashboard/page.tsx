import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import TutorDashboardClient from './TutorDashboardClient'

export default async function TutorDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.tutor_status !== 'approved') redirect('/tutor/apply')

  const { data: tutorProfile } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: sessions } = await supabase
    .from('tutoring_sessions')
    .select('*, profiles!tutoring_sessions_student_id_fkey(display_name, email, avatar_url)')
    .eq('tutor_id', tutorProfile?.id)
    .order('scheduled_at', { ascending: false })

  const { data: reviews } = await supabase
    .from('tutor_reviews')
    .select('*, profiles!tutor_reviews_student_id_fkey(display_name, avatar_url)')
    .eq('tutor_id', tutorProfile?.id)
    .order('created_at', { ascending: false })

  const { data: payouts } = await supabase
    .from('tutor_payouts')
    .select('*')
    .eq('tutor_id', tutorProfile?.id)
    .order('created_at', { ascending: false })

  const { data: availability } = await supabase
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', tutorProfile?.id)

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <Navbar profile={profile} />
      <TutorDashboardClient
        profile={profile}
        tutorProfile={tutorProfile}
        sessions={sessions ?? []}
        reviews={reviews ?? []}
        payouts={payouts ?? []}
        availability={availability ?? []}
      />
    </div>
  )
}
