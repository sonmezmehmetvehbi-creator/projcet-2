import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import Stripe from 'stripe'

// SQL (run once in Supabase):
// ALTER TABLE tutoring_sessions ADD COLUMN IF NOT EXISTS expires_at timestamptz;

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' as any })
  const resend = new Resend(process.env.RESEND_API_KEY as string)

  // Allow either the Vercel Cron secret OR an authenticated admin (so the
  // manual "Auto-Decline Expired" button in the admin dashboard can trigger it).
  const authHeader = request.headers.get('authorization')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  if (!isCron) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const nowIso = new Date().toISOString()

  // Find all pending sessions that have passed their expiry.
  const { data: expired, error } = await adminClient
    .from('tutoring_sessions')
    .select('*, tutor_profiles(display_name, user_id)')
    .eq('status', 'pending')
    .lt('expires_at', nowIso)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let autoDeclined = 0

  for (const session of (expired ?? [])) {
    try {
      // Mark declined
      const { error: updateErr } = await adminClient
        .from('tutoring_sessions')
        .update({ status: 'declined' })
        .eq('id', session.id)
      if (updateErr) { console.error('Auto-decline update error:', updateErr.message); continue }

      // Issue Stripe refund (same logic as decline-session route)
      let refundId = session.stripe_refund_id ?? null
      if (!refundId && session.stripe_payment_intent_id) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: session.stripe_payment_intent_id,
            reason: 'requested_by_customer',
            metadata: { sessionId: session.id, reason: 'auto_declined_expired' },
          })
          refundId = refund.id
          await adminClient.from('tutoring_sessions').update({ stripe_refund_id: refundId }).eq('id', session.id)
        } catch (e: any) {
          console.error('Auto-decline refund error:', e.message)
        }
      }

      // Look up the student and tutor emails
      const { data: student } = await adminClient
        .from('profiles')
        .select('email, display_name')
        .eq('id', session.student_id)
        .single()

      let tutorEmail: string | null = null
      if (session.tutor_profiles?.user_id) {
        const { data: tutorProfile } = await adminClient
          .from('profiles')
          .select('email')
          .eq('id', session.tutor_profiles.user_id)
          .single()
        tutorEmail = tutorProfile?.email ?? null
      }

      // Email student — full refund notice
      try {
        if (student?.email) {
          await resend.emails.send({
            from: 'AceForge <onboarding@resend.dev>',
            to: student.email,
            subject: 'Your session request was not accepted in time — full refund issued',
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
                <h2 style="color:#1a1a14">Request Expired — Full Refund Issued</h2>
                <p>Hi ${student.display_name?.split(' ')[0] ?? 'there'},</p>
                <p>Your tutoring session request for <strong>${session.subject}</strong> scheduled on <strong>${new Date(session.scheduled_at).toLocaleString()}</strong> was not accepted by the tutor within 24 hours, so it has been automatically cancelled.</p>
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
        }
      } catch (e: any) {
        console.error('Auto-decline student email error:', e.message)
      }

      // Email tutor — missed request notice
      try {
        if (tutorEmail) {
          await resend.emails.send({
            from: 'AceForge <onboarding@resend.dev>',
            to: tutorEmail,
            subject: 'A session request expired because it wasn’t accepted within 24 hours',
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
                <h2 style="color:#1a1a14">Session Request Expired</h2>
                <p>Hi ${session.tutor_profiles?.display_name ?? 'there'},</p>
                <p>You had a session request for <strong>${session.subject}</strong> scheduled on <strong>${new Date(session.scheduled_at).toLocaleString()}</strong> that expired because it wasn’t accepted within 24 hours.</p>
                <p>The request has been automatically declined and the student fully refunded. Accepting requests promptly helps you keep more bookings.</p>
                <a href="https://aceforge.app/tutor/dashboard" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
                  Go to Dashboard →
                </a>
                <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
              </div>
            `,
          })
        }
      } catch (e: any) {
        console.error('Auto-decline tutor email error:', e.message)
      }

      autoDeclined++
    } catch (e: any) {
      console.error('Auto-decline loop error:', e.message)
    }
  }

  return NextResponse.json({ success: true, autoDeclined })
}
