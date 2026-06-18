import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import Stripe from 'stripe'


export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' as any })
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { sessionId } = await request.json()

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session } = await adminClient
      .from('tutoring_sessions')
      .update({ status: 'refunded' })
      .eq('id', sessionId)
      .select('*')
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Withhold any pending tutor payout for this session
    await adminClient.from('tutor_payouts').update({ status: 'withheld' }).eq('session_id', sessionId)

    // Issue Stripe refund
    let refundId = session.stripe_refund_id ?? null
    if (!refundId && session.stripe_payment_intent_id) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: session.stripe_payment_intent_id,
          reason: 'requested_by_customer',
          metadata: { sessionId, reason: 'admin_issued_refund' },
        })
        refundId = refund.id
        await adminClient.from('tutoring_sessions').update({ stripe_refund_id: refundId }).eq('id', sessionId)
      } catch (e: any) {
        console.error('Admin refund stripe error:', e.message)
      }
    }

    // Email the student
    const { data: student } = await adminClient
      .from('profiles')
      .select('email, display_name')
      .eq('id', session.student_id)
      .single()

    try {
      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: student?.email,
        subject: '✅ Refund Issued for Your Tutoring Session',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">Refund Issued ✅</h2>
            <p>Hi ${student?.display_name?.split(' ')[0] ?? 'there'},</p>
            <p>A refund of <strong>$${session.student_price}</strong> has been issued for your tutoring session (${session.subject}) to your original payment method. It typically appears within 5-10 business days.</p>
            ${refundId ? `<p style="color:#888;font-size:12px">Refund ID: ${refundId}</p>` : ''}
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `,
      })
    } catch (e: any) {
      console.error('Admin refund email error:', e.message)
    }

    return NextResponse.json({ success: true, refundId })
  } catch (error: any) {
    console.error('Admin refund error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
