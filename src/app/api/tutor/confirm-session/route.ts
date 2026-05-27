import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, meetLink } = await request.json()

    const { data: session } = await supabase
      .from('tutoring_sessions')
      .update({ status: 'confirmed', meet_link: meetLink })
      .eq('id', sessionId)
      .select('*, profiles!tutoring_sessions_student_id_fkey(email, display_name)')
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: session.profiles?.email,
      subject: '✅ Your tutoring session is confirmed!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #22550e;">Your session is confirmed! 🎓</h2>
          <p>Hi ${session.profiles?.display_name?.split(' ')[0]},</p>
          <p>Your tutoring session has been confirmed.</p>
          <div style="background: #f8faf5; border: 1px solid #d1e8c7; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p><strong>Subject:</strong> ${session.subject}</p>
            <p><strong>Topic:</strong> ${session.topic}</p>
            <p><strong>Date & Time:</strong> ${new Date(session.scheduled_at).toLocaleString()}</p>
            <p><strong>Duration:</strong> ${session.session_length} minutes</p>
            <p><strong>Google Meet:</strong> <a href="${meetLink}" style="color: #22550e;">${meetLink}</a></p>
          </div>
          <p>⚠️ This session will be recorded for quality assurance purposes.</p>
          <p style="color: #888; font-size: 13px; margin-top: 24px;">— The AceForge Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}