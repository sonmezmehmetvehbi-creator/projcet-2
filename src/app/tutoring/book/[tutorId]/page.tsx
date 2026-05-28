
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import BookingClient from './BookingClient'

export default async function BookingPage({ params }: { params: { tutorId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: tutor } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('id', params.tutorId)
    .eq('status', 'approved')
    .single()

  if (!tutor) redirect('/tutoring')

  const { data: availability } = await supabase
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', params.tutorId)

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} />
      <BookingClient profile={profile} tutor={tutor} availability={availability ?? []} />
    </div>
  )
}