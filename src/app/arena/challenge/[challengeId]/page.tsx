import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ChallengeClient from './ChallengeClient'

export default async function ChallengePage({ params }: { params: { challengeId: string } }) {
  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Don't redirect guests — the challenge page is public so a shared link works
  // for logged-out users, who then get an auth prompt to accept.
  let profile = null
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      profile = data
    }
  } catch {}

  const { data: challenge } = await adminClient
    .from('arena_challenges')
    .select('*')
    .eq('id', params.challengeId)
    .single()

  if (!challenge) redirect('/arena')

  return <ChallengeClient challenge={challenge} profile={profile} />
}
