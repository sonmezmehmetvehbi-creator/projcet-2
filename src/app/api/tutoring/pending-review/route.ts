import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Always run dynamically (depends on the auth cookie) and never cache.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Returns the first completed session by the logged-in student that does not
// yet have a review in tutor_reviews, so the UI can prompt them to leave one.
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[pending-review] no user')
      return NextResponse.json({ pending: null })
    }
    console.log('[pending-review] user id:', user.id)

    // Use the service-role client for both reads so row-level security can't
    // silently hide the student's own sessions or reviews.
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: sessions, error: sessionsError } = await adminClient
      .from('tutoring_sessions')
      .select('id, tutor_id, scheduled_at')
      .eq('student_id', user.id)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })

    console.log('[pending-review] completed sessions:', sessions, 'error:', sessionsError?.message)

    if (!sessions || sessions.length === 0) return NextResponse.json({ pending: null })

    const { data: reviews, error: reviewsError } = await adminClient
      .from('tutor_reviews')
      .select('session_id')
      .eq('student_id', user.id)

    console.log('[pending-review] existing reviews:', reviews, 'error:', reviewsError?.message)

    // Find the first completed session that has NO matching review row for this
    // student (matched on session_id).
    const reviewed = new Set((reviews ?? []).map(r => r.session_id))
    const firstUnreviewed = sessions.find(s => !reviewed.has(s.id))

    if (!firstUnreviewed) {
      console.log('[pending-review] all completed sessions already reviewed')
      return NextResponse.json({ pending: null })
    }

    const { data: tutor } = await adminClient
      .from('tutor_profiles')
      .select('display_name')
      .eq('id', firstUnreviewed.tutor_id)
      .single()

    const pending = {
      session_id: firstUnreviewed.id,
      tutor_id: firstUnreviewed.tutor_id,
      tutor_name: tutor?.display_name ?? 'your tutor',
    }
    console.log('[pending-review] returning pending:', pending)

    return NextResponse.json({ pending })
  } catch (error: any) {
    console.error('[pending-review] error:', error)
    return NextResponse.json({ pending: null })
  }
}
