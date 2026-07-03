import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Supporting table:
// -- CREATE TABLE IF NOT EXISTS tutor_reports (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, tutor_id uuid, student_id uuid, session_id uuid, complaint_type text, description text, status text DEFAULT 'pending', admin_notes text, created_at timestamptz DEFAULT now());
// -- ALTER TABLE tutor_reports DISABLE ROW LEVEL SECURITY;

const ADMIN_EMAIL = 'contactinfo21342@gmail.com'

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role, tutor_status, display_name').eq('id', user.id).single()
    const isTutor = profile?.role === 'tutor' || profile?.tutor_status === 'approved'
    if (!isTutor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { sessionId, complaintType, description } = await request.json()
    if (!complaintType || !description || description.trim().length < 50) {
      return NextResponse.json({ error: 'Complaint type and a description of at least 50 characters are required.' }, { status: 400 })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Resolve the tutor profile and (if a session was chosen) the student it's for.
    const { data: tutorProfile } = await adminClient
      .from('tutor_profiles').select('id').eq('user_id', user.id).single()

    let studentId: string | null = null
    let sessionDate: string | null = null
    let studentName = 'a student'
    if (sessionId) {
      const { data: session } = await adminClient
        .from('tutoring_sessions').select('student_id, scheduled_at, tutor_id').eq('id', sessionId).single()
      // Ensure the session belongs to this tutor before recording it.
      if (session && session.tutor_id === tutorProfile?.id) {
        studentId = session.student_id
        sessionDate = session.scheduled_at
        const { data: student } = await adminClient.from('profiles').select('display_name').eq('id', session.student_id).single()
        studentName = student?.display_name ?? 'a student'
      }
    }

    const { error: insertError } = await adminClient.from('tutor_reports').insert({
      tutor_id: tutorProfile?.id ?? null,
      student_id: studentId,
      session_id: sessionId ?? null,
      complaint_type: complaintType,
      description: description.trim(),
      status: 'pending',
    })
    if (insertError) throw insertError

    const dateStr = sessionDate ? new Date(sessionDate).toLocaleString() : 'N/A'

    // Notify the admin.
    try {
      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        subject: `New tutor complaint: ${complaintType}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#991b1b">New Tutor Complaint</h2>
            <p>New tutor complaint filed by <strong>${profile?.display_name ?? 'a tutor'}</strong> against student <strong>${studentName}</strong>.</p>
            <p><strong>Type:</strong> ${complaintType}</p>
            <p><strong>Description:</strong> ${description.trim()}</p>
            <p><strong>Session:</strong> ${dateStr}</p>
          </div>`,
      })
    } catch (e: any) { console.error('Tutor report admin email error:', e.message) }

    // Confirm to the tutor.
    if (user.email) {
      try {
        await resend.emails.send({
          from: 'AceForge <onboarding@resend.dev>',
          to: user.email,
          subject: 'Your report has been received',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#22550e">Report Received</h2>
              <p>Hi ${profile?.display_name?.split(' ')[0] ?? 'there'},</p>
              <p>Your report has been received and will be reviewed within 48 hours.</p>
              <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
            </div>`,
        })
      } catch (e: any) { console.error('Tutor report confirm email error:', e.message) }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Report student error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
