import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Returns the first completed session by the logged-in student that does not
// yet have a review in tutor_reviews, so the UI can prompt them to leave one.
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ pending: null })

    const { data: sessions } = await supabase
      .from('tutoring_sessions')
      .select('id, tutor_id, scheduled_at')
      .eq('student_id', user.id)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })

    if (!sessions || sessions.length === 0) return NextResponse.json({ pending: null })

    const { data: reviews } = await supabase
      .from('tutor_reviews')
      .select('session_id')
      .eq('student_id', user.id)

    const reviewed = new Set((reviews ?? []).map(r => r.session_id))
    const firstUnreviewed = sessions.find(s => !reviewed.has(s.id))
    if (!firstUnreviewed) return NextResponse.json({ pending: null })

    const { data: tutor } = await supabase
      .from('tutor_profiles')
      .select('display_name')
      .eq('id', firstUnreviewed.tutor_id)
      .single()

    return NextResponse.json({
      pending: {
        session_id: firstUnreviewed.id,
        tutor_id: firstUnreviewed.tutor_id,
        tutor_name: tutor?.display_name ?? 'your tutor',
      },
    })
  } catch (error: any) {
    console.error('pending-review error:', error)
    return NextResponse.json({ pending: null })
  }
}
