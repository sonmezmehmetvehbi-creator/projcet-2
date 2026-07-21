import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import Stripe from 'stripe'

// Columns used by this route:
// -- ALTER TABLE tutoring_sessions ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
// -- ALTER TABLE tutoring_sessions ADD COLUMN IF NOT EXISTS cancellation_reason text;
// -- ALTER TABLE tutoring_sessions ADD COLUMN IF NOT EXISTS cancellation_notes text;

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' as any })
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { sessionId, reason, notes, refundStudent } = await request.json()
    if (!sessionId || !reason) return NextResponse.json({ error: 'Missing sessionId or reason' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session } = await adminClient
      .from('tutoring_sessions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        cancellation_notes: notes ?? null,
      })
      .eq('id', sessionId)
      .select('*')
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Withhold any tutor payout for this session.
    await adminClient.from('tutor_payouts').update({ status: 'withheld' }).eq('session_id', sessionId)

    // Issue a Stripe refund if requested.
    let refundId: string | null = session.stripe_refund_id ?? null
    if (refundStudent && !refundId && session.stripe_payment_intent_id) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: session.stripe_payment_intent_id,
          reason: 'requested_by_customer',
          metadata: { sessionId, reason: 'admin_cancel_session' },
        })
        refundId = refund.id
        await adminClient.from('tutoring_sessions').update({ stripe_refund_id: refundId }).eq('id', sessionId)
      } catch (e: any) {
        console.error('Cancel session stripe refund error:', e.message)
      }
    }

    // Look up student + tutor contact details (manual lookups — FK joins on this
    // table are unreliable).
    const { data: student } = await adminClient
      .from('profiles').select('email, display_name').eq('id', session.student_id).single()
    const { data: tutorProfile } = await adminClient
      .from('tutor_profiles').select('display_name, user_id').eq('id', session.tutor_id).single()
    const { data: tutorUser } = tutorProfile?.user_id
      ? await adminClient.from('profiles').select('email').eq('id', tutorProfile.user_id).single()
      : { data: null }

    const refundLine = refundStudent
      ? (refundId ? 'A refund has been issued to your original payment method.' : 'A refund is being processed.')
      : 'No refund was issued.'

    // Email the student.
    if (student?.email) {
      try {
        await resend.emails.send({
          from: 'AceForge <noreply@aceforge.app>',
          to: student.email,
          subject: 'Your tutoring session has been cancelled',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#991b1b">Session Cancelled</h2>
              <p>Hi ${student.display_name?.split(' ')[0] ?? 'there'},</p>
              <p>Your session has been cancelled by AceForge admin. Reason: <strong>${reason}</strong>.</p>
              <p>${refundLine}</p>
              <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
            </div>`,
        })
      } catch (e: any) { console.error('Cancel session student email error:', e.message) }
    }

    // Email the tutor.
    if (tutorUser?.email) {
      try {
        await resend.emails.send({
          from: 'AceForge <noreply@aceforge.app>',
          to: tutorUser.email,
          subject: 'A session has been cancelled',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#991b1b">Session Cancelled</h2>
              <p>Hi ${tutorProfile?.display_name?.split(' ')[0] ?? 'there'},</p>
              <p>A session has been cancelled by AceForge admin. Reason: <strong>${reason}</strong>.</p>
              <p>Your payout for this session will not be issued.</p>
              <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
            </div>`,
        })
      } catch (e: any) { console.error('Cancel session tutor email error:', e.message) }
    }

    return NextResponse.json({ success: true, refundId })
  } catch (error: any) {
    console.error('Cancel session error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
