import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const APP_URL = 'https://aceforge.app'

function priceFor(length: number, isPremium: boolean) {
  const baseRate = isPremium ? 34.99 : 49.99
  const studentPrice = length === 30 ? Math.round((baseRate / 2) * 100) / 100 : length === 90 ? (isPremium ? 54.99 : 69.99) : baseRate
  const tutorPayout = length === 30 ? 15 : length === 90 ? 45 : 30
  return { studentPrice, tutorPayout }
}

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, sessionLength, scheduledAt } = await request.json()
    if (!sessionId || !sessionLength || !scheduledAt) {
      return NextResponse.json({ error: 'Missing sessionId, sessionLength or scheduledAt' }, { status: 400 })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // The original (completed) session supplies student/tutor/subject context.
    const { data: original, error: originalError } = await adminClient
      .from('tutoring_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    if (originalError || !original) return NextResponse.json({ error: 'Original session not found' }, { status: 404 })

    // Authorize: the caller must be the tutor on the original session.
    const { data: tutorProfile } = await adminClient
      .from('tutor_profiles')
      .select('id, user_id, display_name')
      .eq('id', original.tutor_id)
      .single()
    if (!tutorProfile || tutorProfile.user_id !== user.id) {
      return NextResponse.json({ error: 'Only the tutor can propose a follow-up' }, { status: 403 })
    }

    const { data: student } = await adminClient
      .from('profiles')
      .select('email, display_name, is_premium')
      .eq('id', original.student_id)
      .single()

    const { studentPrice, tutorPayout } = priceFor(Number(sessionLength), !!student?.is_premium)

    // Create the proposed follow-up session.
    // SQL (run manually in Supabase if tutoring_sessions.status has a CHECK constraint):
    //   ALTER TABLE tutoring_sessions DROP CONSTRAINT IF EXISTS tutoring_sessions_status_check;
    //   ALTER TABLE tutoring_sessions ADD CONSTRAINT tutoring_sessions_status_check
    //     CHECK (status IN ('pending','confirmed','completed','declined','disputed','proposed'));
    const { data: followup, error: insertError } = await adminClient
      .from('tutoring_sessions')
      .insert({
        student_id: original.student_id,
        tutor_id: original.tutor_id,
        subject: original.subject,
        topic: 'Follow-up session',
        grade: original.grade ?? null,
        session_length: Number(sessionLength),
        scheduled_at: scheduledAt,
        language: original.language ?? 'English',
        status: 'proposed',
        student_price: studentPrice,
        tutor_payout: tutorPayout,
        recording_consent: true,
        wants_continuing: true,
      })
      .select('*')
      .single()
    if (insertError || !followup) return NextResponse.json({ error: insertError?.message ?? 'Could not create follow-up' }, { status: 500 })

    const whenStr = new Date(scheduledAt).toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    const payLink = `${APP_URL}/tutoring/followup/${followup.id}`

    // Drop a message into the ORIGINAL session chat so the student sees it there.
    await adminClient.from('session_messages').insert({
      session_id: sessionId,
      sender_id: user.id,
      message: `📅 Your tutor has proposed a follow-up session: ${original.subject} on ${whenStr} for ${sessionLength} minutes. Click here to confirm and pay: ${payLink}`,
      is_tutor: true,
    })

    // Email the student.
    try {
      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: student?.email,
        subject: `📅 ${tutorProfile.display_name} proposed a follow-up session`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">You have a follow-up session proposal 📅</h2>
            <p>Hi ${student?.display_name?.split(' ')[0] ?? 'there'},</p>
            <p><strong>${tutorProfile.display_name}</strong> has proposed a follow-up session for you:</p>
            <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
              <p style="margin:0 0 8px"><strong>📚 Subject:</strong> ${original.subject}</p>
              <p style="margin:0 0 8px"><strong>📅 When:</strong> ${whenStr}</p>
              <p style="margin:0 0 8px"><strong>⏱ Duration:</strong> ${sessionLength} minutes</p>
              <p style="margin:0"><strong>💳 Price:</strong> $${studentPrice}</p>
            </div>
            <a href="${payLink}" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
              Confirm & Pay →
            </a>
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `,
      })
    } catch (e) { console.error('Follow-up email error:', e) }

    return NextResponse.json({ success: true, sessionId: followup.id })
  } catch (error: any) {
    console.error('Propose follow-up error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
