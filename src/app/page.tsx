import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import LandingExperience from '@/components/landing/landing-experience'

export default async function HomePage() {
  // Only unauthenticated visitors see the marketing landing page; signed-in
  // users go straight to their dashboard. Auth check is wrapped in try/catch,
  // but redirect() is called OUTSIDE it — redirect throws a control-flow signal
  // that must not be swallowed by the catch.
  let isLoggedIn = false
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {}

  if (isLoggedIn) redirect('/dashboard')

  return <LandingExperience />
}
