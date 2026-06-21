import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Inserts in-app "starts in 15 minutes" notifications for confirmed sessions
// whose scheduled_at falls 14–16 minutes from now. Safe to call repeatedly —
// it won't double-send for the same session.
export async function GET() {
  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = Date.now()
    const from = new Date(now + 14 * 60 * 1000).toISOString()
    const to = new Date(now + 16 * 60 * 1000).toISOString()

    const { data: sessions } = await adminClient
      .from('tutoring_sessions')
      .select('id, tutor_id, student_id, subject')
      .eq('status', 'confirmed')
      .gte('scheduled_at', from)
      .lte('scheduled_at', to)

    let inserted = 0

    for (const session of (sessions ?? [])) {
      const link = `/tutoring/session/${session.id}`

      // Skip if a reminder already exists for this session.
      const { data: existing } = await adminClient
        .from('notifications')
        .select('id')
        .eq('type', 'session_reminder')
        .eq('link', link)
        .limit(1)
      if (existing && existing.length > 0) continue

      // Tutor's auth user id lives on tutor_profiles.user_id.
      const { data: tutorProfile } = await adminClient
        .from('tutor_profiles')
        .select('user_id')
        .eq('id', session.tutor_id)
        .single()

      const recipients = [session.student_id, tutorProfile?.user_id].filter(Boolean)
      for (const userId of recipients) {
        await adminClient.from('notifications').insert({
          user_id: userId,
          type: 'session_reminder',
          title: '⏰ Session starting soon',
          message: 'Your session starts in 15 minutes. Open session →',
          link,
        })
        inserted++
      }
    }

    return NextResponse.json({ success: true, inserted })
  } catch (error: any) {
    console.error('session-reminders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
