import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'



export async function GET(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY as string)
  // Verify this is called by Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const in15min = new Date(now.getTime() + 15 * 60 * 1000)
  const in24hr = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const buffer = 5 * 60 * 1000 // 5 min buffer

  // Find sessions starting in ~15 minutes
  const { data: upcomingSoon } = await adminClient
    .from('tutoring_sessions')
    .select('*, tutor_profiles(display_name, user_id), profiles!tutoring_sessions_student_id_fkey(email, display_name)')
    .eq('status', 'confirmed')
    .eq('reminder_15min_sent', false)
    .gte('scheduled_at', new Date(in15min.getTime() - buffer).toISOString())
    .lte('scheduled_at', new Date(in15min.getTime() + buffer).toISOString())

  // Find sessions starting in ~24 hours
  const { data: upcoming24hr } = await adminClient
    .from('tutoring_sessions')
    .select('*, tutor_profiles(display_name, user_id), profiles!tutoring_sessions_student_id_fkey(email, display_name)')
    .eq('status', 'confirmed')
    .eq('reminder_24hr_sent', false)
    .gte('scheduled_at', new Date(in24hr.getTime() - buffer).toISOString())
    .lte('scheduled_at', new Date(in24hr.getTime() + buffer).toISOString())

  let emailsSent = 0

  // Send 15-min reminders
  for (const session of (upcomingSoon ?? [])) {
    try {
      // Get tutor email
      const { data: tutorProfile } = await adminClient.from('profiles').select('email').eq('id', session.tutor_profiles?.user_id).single()

      const sessionTime = new Date(session.scheduled_at).toLocaleString()
      const meetLink = session.meet_link

      // Email student
      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: session.profiles?.email,
        subject: '⏰ Your tutoring session starts in 15 minutes!',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">⏰ Session Starting Soon!</h2>
            <p>Hi ${session.profiles?.display_name?.split(' ')[0]},</p>
            <p>Your tutoring session with <strong>${session.tutor_profiles?.display_name}</strong> starts in <strong>15 minutes</strong>!</p>
            <p><strong>Subject:</strong> ${session.subject}</p>
            <p><strong>Time:</strong> ${sessionTime}</p>
            ${meetLink ? `<a href="${meetLink}" style="display:inline-block;background:#22550e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">🎥 Join Google Meet Now →</a>` : ''}
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `,
      })

      // Email tutor
      if (tutorProfile?.email) {
        await resend.emails.send({
          from: 'AceForge <onboarding@resend.dev>',
          to: tutorProfile.email,
          subject: '⏰ Your tutoring session starts in 15 minutes!',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#22550e">⏰ Session Starting Soon!</h2>
              <p>Your session with <strong>${session.profiles?.display_name}</strong> starts in <strong>15 minutes</strong>!</p>
              <p><strong>Subject:</strong> ${session.subject}</p>
              <p><strong>Time:</strong> ${sessionTime}</p>
              ${meetLink ? `<a href="${meetLink}" style="display:inline-block;background:#22550e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">🎥 Join Google Meet →</a>` : ''}
              <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
            </div>
          `,
        })
      }

      await adminClient.from('tutoring_sessions').update({ reminder_15min_sent: true }).eq('id', session.id)
      emailsSent += 2
    } catch (e) { console.error(e) }
  }

  // Send 24hr reminders
  for (const session of (upcoming24hr ?? [])) {
    try {
      const { data: tutorProfile } = await adminClient.from('profiles').select('email').eq('id', session.tutor_profiles?.user_id).single()
      const sessionTime = new Date(session.scheduled_at).toLocaleString()

      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: session.profiles?.email,
        subject: '📅 Reminder: Tutoring session tomorrow',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">📅 Session Reminder</h2>
            <p>Hi ${session.profiles?.display_name?.split(' ')[0]},</p>
            <p>Just a reminder that your tutoring session with <strong>${session.tutor_profiles?.display_name}</strong> is tomorrow!</p>
            <p><strong>Subject:</strong> ${session.subject}</p>
            <p><strong>Time:</strong> ${sessionTime}</p>
            <p>Your tutor will send a Google Meet link before the session.</p>
            <a href="https://aceforge.app/tutoring/sessions" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">View Session Details →</a>
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `,
      })

      if (tutorProfile?.email) {
        await resend.emails.send({
          from: 'AceForge <onboarding@resend.dev>',
          to: tutorProfile.email,
          subject: '📅 Reminder: Tutoring session tomorrow',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#22550e">📅 Session Reminder</h2>
              <p>Reminder: You have a tutoring session with <strong>${session.profiles?.display_name}</strong> tomorrow!</p>
              <p><strong>Subject:</strong> ${session.subject}</p>
              <p><strong>Time:</strong> ${sessionTime}</p>
              <a href="https://aceforge.app/tutor/dashboard" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">View Dashboard →</a>
              <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
            </div>
          `,
        })
      }

      await adminClient.from('tutoring_sessions').update({ reminder_24hr_sent: true }).eq('id', session.id)
      emailsSent += 2
    } catch (e) { console.error(e) }
  }

  return NextResponse.json({ success: true, emailsSent })
}
// trigger
// trigger
