
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import SessionClient from './SessionClient'

export default async function SessionPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: session } = await supabase
    .from('tutoring_sessions')
    .select('*, tutor_profiles(display_name, rating, subjects, bio)')
    .eq('id', params.sessionId)
    .single()

  if (!session || session.student_id !== user.id) redirect('/tutoring/sessions')

  const { data: review } = await supabase
    .from('tutor_reviews')
    .select('*')
    .eq('session_id', params.sessionId)
    .single()

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <Navbar profile={profile} />
      <SessionClient profile={profile} session={session} existingReview={review} />
    </div>
  )
}
