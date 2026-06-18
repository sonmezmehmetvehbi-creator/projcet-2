import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import TutoringDashboardClient from './TutoringDashboardClient'

export default async function TutoringDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: sessions } = await supabase
    .from('tutoring_sessions')
    .select('*, tutor_profiles(id, display_name, rating, subjects, bio, languages, avatar_url)')
    .eq('student_id', user.id)
    .order('scheduled_at', { ascending: false })

  const { data: allTutors } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('status', 'approved')
    .eq('is_active', true)
    .order('rating', { ascending: false })

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <Navbar profile={profile} />
      <TutoringDashboardClient
        profile={profile}
        sessions={sessions ?? []}
        allTutors={allTutors ?? []}
      />
    </div>
  )
}
