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

    const { sessionId, stripePaymentIntentId } = await request.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session } = await adminClient
      .from('tutoring_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.student_id !== user.id) return NextResponse.json({ error: 'Not your session' }, { status: 403 })
    if (session.status !== 'proposed') return NextResponse.json({ error: 'This session is no longer awaiting payment' }, { status: 409 })

    // Paid — hand it to the tutor as a normal pending request so they confirm
    // and send the Google Meet link via the existing flow.
    const { data: updated, error } = await adminClient
      .from('tutoring_sessions')
      .update({ status: 'pending', stripe_payment_intent_id: stripePaymentIntentId ?? null })
      .eq('id', sessionId)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify the tutor that the follow-up was paid.
    try {
      const { data: tutorProfile } = await adminClient
        .from('tutor_profiles')
        .select('display_name, user_id')
        .eq('id', updated.tutor_id)
        .single()
      const { data: tutorUser } = await adminClient
        .from('profiles')
        .select('email')
        .eq('id', tutorProfile?.user_id)
        .single()
      const { data: student } = await adminClient
        .from('profiles')
        .select('display_name')
        .eq('id', updated.student_id)
        .single()

      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: tutorUser?.email,
        subject: `✅ Follow-up session paid — ${student?.display_name ?? 'a student'}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">Follow-up session confirmed & paid ✅</h2>
            <p>${student?.display_name ?? 'A student'} paid for the follow-up session you proposed:</p>
            <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
              <p style="margin:0 0 8px"><strong>📚 Subject:</strong> ${updated.subject}</p>
              <p style="margin:0 0 8px"><strong>📅 When:</strong> ${new Date(updated.scheduled_at).toLocaleString()}</p>
              <p style="margin:0"><strong>⏱ Duration:</strong> ${updated.session_length} minutes</p>
            </div>
            <p>It's now in your dashboard as a pending request — accept it and send the Google Meet link.</p>
            <a href="https://aceforge.app/tutor/dashboard" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
              Go to Dashboard →
            </a>
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `,
      })
    } catch (e) { console.error('Follow-up confirm email error:', e) }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Confirm follow-up error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
