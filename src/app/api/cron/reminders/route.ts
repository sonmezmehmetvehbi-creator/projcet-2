import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const safeMeetLink = (url?: string | null) => (!url ? '' : url.startsWith('http') ? url : 'https://' + url)

function reminderHtml(name: string, minutesLabel: string, session: any, meetLink: string) {
  const when = new Date(session.scheduled_at).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#22550e">⏰ Your session starts in ${minutesLabel}!</h2>
      <p>Hi ${name?.split(' ')[0] ?? 'there'},</p>
      <p>This is a reminder that your <strong>${session.subject}</strong> tutoring session is coming up.</p>
      <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px"><strong>📅 When:</strong> ${when}</p>
        <p style="margin:0"><strong>⏱ Duration:</strong> ${session.session_length} minutes</p>
      </div>
      ${meetLink ? `
      <div style="background:#22550e;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
        <a href="${meetLink}" style="display:inline-block;background:white;color:#22550e;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
          🎥 Join Google Meet →
        </a>
        <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:12px 0 0">Or copy: ${meetLink}</p>
      </div>` : ''}
      <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
    </div>
  `
}

export async function GET() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // "Within the next 10 minutes" — also catches any slightly-overdue ones so a
    // late manual trigger still sends.
    const cutoff = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const kinds: { dueCol: string; sentCol: string; label: string }[] = [
      { dueCol: 'reminder_1hr_due', sentCol: 'reminder_1hr_sent', label: '1 hour' },
      { dueCol: 'reminder_15min_due', sentCol: 'reminder_15min_sent', label: '15 minutes' },
    ]

    let sent = 0
    const results: any[] = []

    for (const kind of kinds) {
      const { data: sessions } = await adminClient
        .from('tutoring_sessions')
        .select('*')
        .eq('status', 'confirmed')
        .eq(kind.sentCol, false)
        .not(kind.dueCol, 'is', null)
        .lte(kind.dueCol, cutoff)

      for (const session of sessions ?? []) {
        try {
          const { data: student } = await adminClient
            .from('profiles')
            .select('email, display_name')
            .eq('id', session.student_id)
            .single()

          const { data: tutorProfile } = await adminClient
            .from('tutor_profiles')
            .select('display_name, user_id')
            .eq('id', session.tutor_id)
            .single()

          const { data: tutorUser } = await adminClient
            .from('profiles')
            .select('email, display_name')
            .eq('id', tutorProfile?.user_id)
            .single()

          const meetLink = safeMeetLink(session.meet_link)
          const subject = `⏰ Your session starts in ${kind.label}!`

          if (student?.email) {
            await resend.emails.send({
              from: 'AceForge <onboarding@resend.dev>',
              to: student.email,
              subject,
              html: reminderHtml(student.display_name, kind.label, session, meetLink),
            })
          }
          if (tutorUser?.email) {
            await resend.emails.send({
              from: 'AceForge <onboarding@resend.dev>',
              to: tutorUser.email,
              subject,
              html: reminderHtml(tutorUser.display_name, kind.label, session, meetLink),
            })
          }

          await adminClient
            .from('tutoring_sessions')
            .update({ [kind.sentCol]: true })
            .eq('id', session.id)

          sent++
          results.push({ sessionId: session.id, kind: kind.label })
        } catch (e: any) {
          console.error('Reminder send error for session', session.id, e?.message)
        }
      }
    }

    return NextResponse.json({ success: true, sent, results })
  } catch (error: any) {
    console.error('Cron reminders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
