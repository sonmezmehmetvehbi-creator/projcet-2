import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
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

  const { data: tutorProfile } = await adminClient
    .from('tutor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Check if they have a rejected appeal
  const { data: appeal } = await adminClient
    .from('tutor_appeals')
    .select('status, created_at')
    .eq('email', profile?.email ?? '')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} />
      <TutorApplyClient
        profile={profile}
        existingApplication={tutorProfile}
        appeal={appeal ?? null}
      />
    </div>
  )
}
