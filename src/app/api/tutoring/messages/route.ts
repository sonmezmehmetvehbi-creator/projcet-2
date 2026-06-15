import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: messages } = await adminClient
      .from('session_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    return NextResponse.json({ messages: messages ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, message, fileUrl, fileName, isTutor } = await request.json()

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: newMessage } = await adminClient
      .from('session_messages')
      .insert({
        session_id: sessionId,
        sender_id: user.id,
        message,
        file_url: fileUrl || null,
        file_name: fileName || null,
        is_tutor: isTutor,
      })
      .select()
      .single()

    // Get session info to notify the other party
    const { data: session } = await adminClient
      .from('tutoring_sessions')
      .select('*, tutor_profiles(display_name, user_id)')
      .eq('id', sessionId)
      .single()

    // Get sender name
    const { data: sender } = await adminClient
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    // Notify the other party by email
    try {
      if (isTutor) {
        // Tutor sent — notify student
        const { data: student } = await adminClient
          .from('profiles')
          .select('email, display_name')
          .eq('id', session.student_id)
          .single()

        await resend.emails.send({
          from: 'AceForge <onboarding@resend.dev>',
          to: student?.email,
          subject: `💬 New message from your tutor — ${session?.tutor_profiles?.display_name}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#22550e">New message from ${session?.tutor_profiles?.display_name}</h2>
              <p>Hi ${student?.display_name?.split(' ')[0]},</p>
              <p>Your tutor sent you a message about your <strong>${session?.subject}</strong> session:</p>
              <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:16px;margin:20px 0">
                <p style="margin:0;color:#1a1a14">${message || '(file attached)'}</p>
                ${fileUrl ? `<p style="margin:8px 0 0"><a href="${fileUrl}" style="color:#22550e">📎 ${fileName || 'View attachment'}</a></p>` : ''}
              </div>
              <a href="https://aceforge.app/tutoring/session/${sessionId}" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
                Reply in App →
              </a>
              <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
            </div>
          `,
        })
      } else {
        // Student sent — notify tutor
        const { data: tutorUser } = await adminClient
          .from('profiles')
          .select('email, display_name')
          .eq('id', session?.tutor_profiles?.user_id)
          .single()

        const { data: student } = await adminClient
          .from('profiles')
          .select('display_name')
          .eq('id', session.student_id)
          .single()

        await resend.emails.send({
          from: 'AceForge <onboarding@resend.dev>',
          to: tutorUser?.email,
          subject: `💬 New message from student — ${student?.display_name}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#22550e">New message from ${student?.display_name}</h2>
              <p>Hi ${tutorUser?.display_name?.split(' ')[0]},</p>
              <p>A student sent you a message about their <strong>${session?.subject}</strong> session:</p>
              <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:16px;margin:20px 0">
                <p style="margin:0;color:#1a1a14">${message || '(file attached)'}</p>
                ${fileUrl ? `<p style="margin:8px 0 0"><a href="${fileUrl}" style="color:#22550e">📎 ${fileName || 'View attachment'}</a></p>` : ''}
              </div>
              <a href="https://aceforge.app/tutor/dashboard" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
                Reply in Dashboard →
              </a>
              <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
            </div>
          `,
        })
      }
    } catch (e) { console.error('Email notify error:', e) }

    return NextResponse.json({ message: newMessage })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
