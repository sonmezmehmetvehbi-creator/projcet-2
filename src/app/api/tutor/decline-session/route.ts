import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import Stripe from 'stripe'

const resend = new Resend(process.env.RESEND_API_KEY)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' as any })

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, paymentIntentId } = await request.json()

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session } = await adminClient
      .from('tutoring_sessions')
      .update({ status: 'declined' })
      .eq('id', sessionId)
      .select('*, profiles!tutoring_sessions_student_id_fkey(email, display_name)')
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Auto refund via Stripe
    let refundId = null
    if (paymentIntentId) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason: 'requested_by_customer',
        })
        refundId = refund.id
        await adminClient.from('tutoring_sessions').update({ stripe_refund_id: refundId }).eq('id', sessionId)
      } catch (e: any) {
        console.error('Refund error:', e.message)
      }
    }

    // Email student
    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: session.profiles?.email,
      subject: 'Your tutoring session was declined — Full Refund Issued',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a14">Session Declined</h2>
          <p>Hi ${session.profiles?.display_name?.split(' ')[0] ?? 'there'},</p>
          <p>Unfortunately, the tutor was unable to accept your session request for <strong>${session.subject}</strong> scheduled on <strong>${new Date(session.scheduled_at).toLocaleString()}</strong>.</p>
          <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:16px;margin:20px 0">
            <p style="color:#22550e;margin:0;font-weight:700">✅ Full Refund Issued</p>
            <p style="color:#555;margin:8px 0 0">A full refund of <strong>$${session.student_price}</strong> has been issued to your original payment method. It typically appears within 5-10 business days.</p>
            ${refundId ? `<p style="color:#888;font-size:12px;margin:8px 0 0">Refund ID: ${refundId}</p>` : ''}
          </div>
          <p>You can book a session with another tutor at any time.</p>
          <a href="https://aceforge.app/tutoring" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
            Browse Other Tutors →
          </a>
          <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, refundId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
