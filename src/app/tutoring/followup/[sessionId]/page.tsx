import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import FollowupClient from './FollowupClient'

export default async function FollowupPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: session } = await adminClient
    .from('tutoring_sessions')
    .select('*')
    .eq('id', params.sessionId)
    .single()

  // Only the owning student can pay, and only while it's still a proposal.
  if (!session || session.student_id !== user.id) redirect('/tutoring/sessions')

  const { data: tutorProfile } = await adminClient
    .from('tutor_profiles')
    .select('id, display_name, rating')
    .eq('id', session.tutor_id)
    .single()

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} />
      <FollowupClient session={session} tutorProfile={tutorProfile} />
    </div>
  )
}
