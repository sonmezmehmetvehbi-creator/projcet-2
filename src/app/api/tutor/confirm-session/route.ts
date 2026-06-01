import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'



export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, meetLink } = await request.json()

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session } = await adminClient
      .from('tutoring_sessions')
      .update({ status: 'confirmed', meet_link: meetLink })
      .eq('id', sessionId)
      .select('*')
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Get student info
    const { data: student } = await adminClient
      .from('profiles')
      .select('email, display_name')
      .eq('id', session.student_id)
      .single()

    // Get tutor info
    const { data: tutorProfile } = await adminClient
      .from('tutor_profiles')
      .select('display_name, user_id')
      .eq('id', session.tutor_id)
      .single()

    const { data: tutorUser } = await adminClient
      .from('profiles')
      .select('email')
      .eq('id', tutorProfile?.user_id)
      .single()

    const sessionDate = new Date(session.scheduled_at).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    // Email to STUDENT — confirmation with meet link
    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: student?.email,
      subject: '✅ Your tutoring session is confirmed!',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#22550e">Your session is confirmed! 🎓</h2>
          <p>Hi ${student?.display_name?.split(' ')[0]},</p>
          <p>Great news — <strong>${tutorProfile?.display_name}</strong> has confirmed your tutoring session!</p>

          <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
            <p style="margin:0 0 8px"><strong>📚 Subject:</strong> ${session.subject}</p>
            <p style="margin:0 0 8px"><strong>📝 Topic:</strong> ${session.topic}</p>
            <p style="margin:0 0 8px"><strong>📅 Date & Time:</strong> ${sessionDate}</p>
            <p style="margin:0 0 8px"><strong>⏱ Duration:</strong> ${session.session_length} minutes</p>
            <p style="margin:0 0 8px"><strong>🌐 Language:</strong> ${session.language}</p>
            ${session.wants_intro_call ? `<p style="margin:0 0 8px"><strong>🤝 Intro Call:</strong> Your tutor will also send a separate 15-min intro call link below.</p>` : ''}
          </div>

          ${session.wants_intro_call ? `
          <div style="background:#f0f4ff;border:1px solid #c7d4f5;border-radius:12px;padding:20px;margin:20px 0">
            <p style="color:#1e40af;font-weight:700;margin:0 0 8px">🤝 Free 15-Min Intro Call</p>
            <p style="margin:0;color:#374151">Your tutor will send you a separate Google Meet link for your free 15-minute intro call. Check your email — it should arrive shortly from your tutor.</p>
          </div>
          ` : ''}

          <div style="background:#22550e;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
            <p style="color:white;font-weight:700;font-size:18px;margin:0 0 12px">🎥 Join Your Session</p>
            <a href="${meetLink}" style="display:inline-block;background:white;color:#22550e;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
              Join Google Meet →
            </a>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:12px 0 0">Or copy this link: ${meetLink}</p>
          </div>

          <div style="background:#fff8f0;border:1px solid #fde68a;border-radius:12px;padding:16px;margin:20px 0">
            <p style="color:#92400e;margin:0;font-size:14px">
              ⚠️ <strong>Recording notice:</strong> This session will be recorded for quality assurance and dispute resolution purposes only.
            </p>
          </div>

          <p style="color:#888;font-size:13px;margin-top:24px">
            Questions? Contact us at contactinfo21342@gmail.com<br>
            — The AceForge Team
          </p>
        </div>
      `,
    })

    // Email to TUTOR — step by step instructions
    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: tutorUser?.email,
      subject: `📋 Session confirmed — Next steps for your session with ${student?.display_name?.split(' ')[0]}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#22550e">Session Confirmed ✅</h2>
          <p>You've confirmed a tutoring session. Here's everything you need to know:</p>

          <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
            <p style="margin:0 0 8px"><strong>👤 Student:</strong> ${student?.display_name}</p>
            <p style="margin:0 0 8px"><strong>📧 Student Email:</strong> <a href="mailto:${student?.email}" style="color:#22550e">${student?.email}</a></p>
            <p style="margin:0 0 8px"><strong>📚 Subject:</strong> ${session.subject}</p>
            <p style="margin:0 0 8px"><strong>📝 Topic:</strong> ${session.topic}</p>
            <p style="margin:0 0 8px"><strong>🎓 Grade:</strong> ${session.grade}</p>
            <p style="margin:0 0 8px"><strong>📅 Date & Time:</strong> ${sessionDate}</p>
            <p style="margin:0 0 8px"><strong>⏱ Duration:</strong> ${session.session_length} minutes</p>
            <p style="margin:0 0 8px"><strong>🌐 Language:</strong> ${session.language}</p>
            <p style="margin:0 0 8px"><strong>💰 Your Payout:</strong> $${session.tutor_payout} (paid within 24hrs after session)</p>
            <p style="margin:0"><strong>🎥 Meet Link you provided:</strong> <a href="${meetLink}" style="color:#22550e">${meetLink}</a></p>
          </div>

          ${session.wants_intro_call ? `
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:20px;margin:20px 0">
            <p style="color:#92400e;font-weight:700;margin:0 0 12px">🤝 ACTION REQUIRED: Free 15-Min Intro Call Requested</p>
            <p style="color:#374151;margin:0 0 8px">This student requested a free 15-minute intro call before the main session.</p>
            <p style="color:#374151;margin:0 0 8px"><strong>What to do:</strong></p>
            <ol style="color:#374151;margin:0;padding-left:20px">
              <li style="margin-bottom:6px">Create a <strong>separate</strong> Google Meet link for the 15-min intro call</li>
              <li style="margin-bottom:6px">Email the student directly at <a href="mailto:${student?.email}" style="color:#22550e"><strong>${student?.email}</strong></a> with the intro call link and a suggested time</li>
              <li style="margin-bottom:6px">Keep the intro call to 15 minutes maximum — it's free of charge</li>
              <li>The main session link (above) is separate and will be used for the paid session</li>
            </ol>
          </div>
          ` : ''}

          ${session.wants_continuing ? `
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin:20px 0">
            <p style="color:#166534;margin:0">🔁 <strong>Ongoing sessions interest:</strong> This student is interested in regular sessions. Feel free to discuss a recurring schedule with them!</p>
          </div>
          ` : ''}

          ${session.file_urls?.length > 0 ? `
          <div style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:12px;padding:16px;margin:20px 0">
            <p style="font-weight:700;margin:0 0 8px">📎 Student uploaded files (${session.file_urls.length}):</p>
            ${session.file_urls.map((url: string, i: number) => `<p style="margin:0 0 4px"><a href="${url}" style="color:#22550e">📄 File ${i + 1} →</a></p>`).join('')}
          </div>
          ` : ''}

          <div style="background:#1e1e2e;border-radius:12px;padding:20px;margin:20px 0">
            <p style="color:white;font-weight:700;margin:0 0 12px">📋 Your Checklist</p>
            <p style="color:rgba(255,255,255,0.8);margin:0 0 8px;font-size:14px">
              ${session.wants_intro_call ? '☐ Send intro call link to student at ' + student?.email + '<br>' : ''}
              ☐ Review student's topic and any uploaded files before the session<br>
              ☐ Join the Google Meet on time: ${sessionDate}<br>
              ☐ Mark session as complete in your dashboard after it ends<br>
              ☐ Payout will be sent within 24hrs after completion
            </p>
          </div>

          <div style="background:#fff0f0;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:20px 0">
            <p style="color:#991b1b;margin:0;font-size:14px">
              ⚠️ <strong>Important:</strong> All sessions must be conducted through AceForge. Do not solicit students for outside sessions. This session will be recorded.
            </p>
          </div>

          <p style="color:#888;font-size:13px;margin-top:24px">
            Questions? Contact us at contactinfo21342@gmail.com<br>
            — The AceForge Team
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Confirm session error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
