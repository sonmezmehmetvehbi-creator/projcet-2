import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import TutorApplyClient from './TutorApplyClient'

export default async function TutorApplyPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: tutorProfile } = await supabase.from('tutor_profiles').select('*').eq('user_id', user.id).single()

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} />
      <TutorApplyClient profile={profile} existingApplication={tutorProfile} />
    </div>
  )
}