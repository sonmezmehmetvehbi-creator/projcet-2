import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const {
      tutorId, subject, topic, grade, sessionLength, scheduledAt,
      language, message, wantsIntroCall, wantsContinuing,
      fileUrls, studentPrice, tutorPayout
    } = await request.json()

    const { data: tutor } = await supabase
      .from('tutor_profiles')
      .select('*, profiles!tutor_profiles_user_id_fkey(email, display_name)')
      .eq('id', tutorId)
      .single()

    if (!tutor) return NextResponse.json({ error: 'Tutor not found' }, { status: 404 })

    const { data: session, error: sessionError } = await supabase
      .from('tutoring_sessions')
      .insert({
        student_id: user.id,
        tutor_id: tutorId,
        subject,
        topic,
        session_length: sessionLength,
        scheduled_at: scheduledAt,
        language,
        status: 'pending',
        student_price: studentPrice,
        tutor_payout: tutorPayout,
        recording_consent: true,
      })
      .select('id')
      .single()

    if (sessionError) throw sessionError

    // Email to tutor
    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: tutor.profiles?.email,
      subject: '📚 New Tutoring Session Request',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#22550e">New Session Request!</h2>
          <p>Hi ${tutor.display_name},</p>
          <p>You have a new tutoring session request.</p>
          <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Topic:</strong> ${topic}</p>
            <p><strong>Grade:</strong> ${grade}</p>
            <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
            <p><strong>Duration:</strong> ${sessionLength} minutes</p>
            <p><strong>Language:</strong> ${language}</p>
            ${message ? `<p><strong>Student note:</strong> ${message}</p>` : ''}
            <p><strong>Your payout:</strong> $${tutorPayout}</p>
            ${wantsIntroCall ? '<p style="color:#22550e;font-weight:700">🤝 Student requested a FREE 15-min intro call first. Please reach out to schedule it.</p>' : ''}
            ${wantsContinuing ? '<p style="color:#22550e;font-weight:700">🔁 Student is interested in ongoing sessions.</p>' : ''}
            ${fileUrls && fileUrls.length > 0 ? `
              <div style="margin-top:16px">
                <p><strong>📎 Student uploaded files:</strong></p>
                ${fileUrls.map((url: string, i: number) => `<p><a href="${url}" style="color:#22550e">File ${i+1}</a></p>`).join('')}
              </div>
            ` : ''}
          </div>
          <a href="https://aceforge.app/tutor/dashboard" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
            Go to Dashboard →
          </a>
          <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
        </div>
      `,
    })

    // Email to student
    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: profile?.email ?? user.email ?? '',
      subject: '✅ Tutoring Session Requested — AceForge',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#22550e">Session Requested! 🎓</h2>
          <p>Hi ${profile?.display_name?.split(' ')[0] ?? 'there'},</p>
          <p>Your tutoring session request has been sent to ${tutor.display_name}.</p>
          <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Topic:</strong> ${topic}</p>
            <p><strong>Date & Time:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
            <p><strong>Duration:</strong> ${sessionLength} minutes</p>
            <p><strong>Amount:</strong> $${studentPrice}</p>
            ${wantsIntroCall ? '<p style="color:#22550e;font-weight:700">🤝 Your tutor will contact you to schedule a free 15-min intro call first.</p>' : ''}
          </div>
          <p>The tutor will confirm within 24 hours and send you a Google Meet link.</p>
          <p>Complete your session to earn <strong>+${sessionLength === 30 ? 50 : sessionLength === 90 ? 150 : 100} XP</strong>! ⭐</p>
          <a href="https://aceforge.app/tutoring/sessions" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
            View My Sessions →
          </a>
          <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
        </div>
      `,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Book error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
