import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import SessionChatClient from './SessionChatClient'

export default async function SessionPage({ params }: { params: { sessionId: string } }) {
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

  if (!session) redirect('/tutoring/sessions')

  const { data: tutorProfile } = await adminClient
    .from('tutor_profiles')
    .select('*, profiles!tutor_profiles_user_id_fkey(email)')
    .eq('id', session.tutor_id)
    .single()

  const isTutor = tutorProfile?.profiles?.email === profile?.email

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(250,250,247)' }}>
      <Navbar profile={profile} />
      <SessionChatClient
        session={session}
        tutorProfile={tutorProfile}
        profile={profile}
        isTutor={isTutor}
      />
    </div>
  )
}
