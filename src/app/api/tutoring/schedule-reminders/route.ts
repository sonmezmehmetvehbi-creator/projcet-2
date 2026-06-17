import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Called when a session is confirmed. Stores the two reminder due-times so a
// (manual or future-cron) sweep can pick them up. Hobby Vercel can't run
// minute-level crons, so we precompute the timestamps here instead.
//
// SQL — add these columns to tutoring_sessions (run manually in Supabase):
//   ALTER TABLE tutoring_sessions ADD COLUMN IF NOT EXISTS reminder_1hr_due timestamptz;
//   ALTER TABLE tutoring_sessions ADD COLUMN IF NOT EXISTS reminder_15min_due timestamptz;
//   ALTER TABLE tutoring_sessions ADD COLUMN IF NOT EXISTS reminder_1hr_sent boolean DEFAULT false;
//   ALTER TABLE tutoring_sessions ADD COLUMN IF NOT EXISTS reminder_15min_sent boolean DEFAULT false;
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId } = await request.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session } = await adminClient
      .from('tutoring_sessions')
      .select('scheduled_at')
      .eq('id', sessionId)
      .single()
    if (!session?.scheduled_at) return NextResponse.json({ error: 'Session not found or has no scheduled time' }, { status: 404 })

    const scheduled = new Date(session.scheduled_at).getTime()
    const reminder1hrDue = new Date(scheduled - 60 * 60 * 1000).toISOString()
    const reminder15minDue = new Date(scheduled - 15 * 60 * 1000).toISOString()

    const { error } = await adminClient
      .from('tutoring_sessions')
      .update({
        reminder_1hr_due: reminder1hrDue,
        reminder_15min_due: reminder15minDue,
        reminder_1hr_sent: false,
        reminder_15min_sent: false,
      })
      .eq('id', sessionId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, reminder_1hr_due: reminder1hrDue, reminder_15min_due: reminder15minDue })
  } catch (error: any) {
    console.error('Schedule reminders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
