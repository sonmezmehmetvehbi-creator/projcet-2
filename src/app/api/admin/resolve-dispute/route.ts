import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import Stripe from 'stripe'

const resend = new Resend(process.env.RESEND_API_KEY)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { sessionId, decision, note } = await request.json()

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session } = await adminClient
      .from('tutoring_sessions')
      .update({
        dispute_status: 'resolved',
        dispute_resolved_at: new Date().toISOString(),
        status: decision === 'refund' ? 'refunded' : 'completed',
      })
      .eq('id', sessionId)
      .select('*, tutor_profiles(display_name), profiles!tutoring_sessions_student_id_fkey(email, display_name)')
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    let stripeRefundId = null

    if (decision === 'refund') {
      // Withhold tutor payout
      await adminClient
        .from('tutor_payouts')
        .update({ status: 'withheld' })
        .eq('session_id', sessionId)

      // Issue Stripe refund if payment intent exists
      if (session.stripe_payment_intent_id) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: session.stripe_payment_intent_id,
            reason: 'fraudulent',
            metadata: {
              sessionId,
              reason: 'dispute_resolved_in_student_favor',
              note: note || '',
            },
          })
          stripeRefundId = refund.id

          // Save refund ID to session
          await adminClient
            .from('tutoring_sessions')
            .update({ stripe_refund_id: refund.id })
            .eq('id', sessionId)
        } catch (stripeError: any) {
          console.error('Stripe refund error:', stripeError.message)
          // Don't fail the whole request if Stripe refund fails
          // Admin can manually refund from Stripe dashboard
        }
      }
    }

    // Email student
    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: session.profiles?.email,
      subject: decision === 'refund' ? '✅ Dispute Resolved — Refund Approved' : '❌ Dispute Resolved — Refund Denied',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:${decision === 'refund' ? '#22550e' : '#991b1b'}">
            ${decision === 'refund' ? '✅ Refund Approved' : '❌ Refund Denied'}
          </h2>
          <p>Hi ${session.profiles?.display_name?.split(' ')[0]},</p>
          <p>We've reviewed your dispute for your tutoring session with ${session.tutor_profiles?.display_name}.</p>
          ${decision === 'refund'
            ? `<p>Your refund of <strong>$${session.student_price}</strong> has been issued to your original payment method. It typically appears within 5-10 business days depending on your bank.</p>
               ${stripeRefundId ? `<p style="color:#888;font-size:13px">Refund ID: ${stripeRefundId}</p>` : '<p style="color:#888;font-size:13px">Refund is being processed. Contact us if you don\'t receive it within 10 business days.</p>'}`
            : '<p>After reviewing the session recording and available evidence, we were unable to approve a refund for this session.</p>'
          }
          ${note ? `<p><strong>Note from our team:</strong> ${note}</p>` : ''}
          <a href="https://aceforge.app/login" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
            Log In →
          </a>
          <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, stripeRefundId })
  } catch (error: any) {
    console.error('Resolve dispute error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
