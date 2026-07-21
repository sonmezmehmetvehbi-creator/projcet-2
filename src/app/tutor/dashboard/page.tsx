import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import TutorDashboardClient from './TutorDashboardClient'
import { TutorThemeProvider } from './TutorThemeContext'

export default async function TutorDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.tutor_status !== 'approved') redirect('/tutor/apply')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tutorProfile } = await adminClient
    .from('tutor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Server-side expiry processing: auto-decline pending requests past their expiry.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' as any })
  const now = new Date().toISOString()
  const { data: expiredSessions } = await adminClient
    .from('tutoring_sessions')
    .select('*')
    .eq('tutor_id', tutorProfile?.id)
    .eq('status', 'pending')
    .lt('expires_at', now)

  if (expiredSessions && expiredSessions.length > 0) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    for (const session of expiredSessions) {
      await adminClient.from('tutoring_sessions').update({ status: 'declined' }).eq('id', session.id)

      // Stripe refund
      if (session.stripe_payment_intent_id) {
        try {
          const refund = await stripe.refunds.create({ payment_intent: session.stripe_payment_intent_id })
          await adminClient.from('tutoring_sessions').update({ stripe_refund_id: refund.id }).eq('id', session.id)
        } catch (e) { console.error('Refund error:', e) }
      }

      // Get student info
      const { data: student } = await adminClient.from('profiles').select('email, display_name').eq('id', session.student_id).single()

      // Email student
      await resend.emails.send({
        from: 'AceForge <noreply@aceforge.app>',
        to: student?.email,
        subject: '⏰ Session request expired — Full refund issued',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">Session Request Expired</h2>
            <p>Hi ${student?.display_name?.split(' ')[0]},</p>
            <p>Unfortunately your tutoring session request for <strong>${session.subject}</strong> scheduled on <strong>${new Date(session.scheduled_at).toLocaleString()}</strong> was not accepted within 24 hours.</p>
            <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:16px;margin:20px 0">
              <p style="color:#22550e;font-weight:700;margin:0">✅ Full Refund Issued</p>
              <p style="color:#555;margin:8px 0 0">$${session.student_price} will appear in your account within 5-10 business days.</p>
            </div>
            <p>You can book a session with another tutor at any time.</p>
            <a href="https://aceforge.app/tutoring" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Browse Other Tutors →</a>
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `
      })

      // Email tutor
      await resend.emails.send({
        from: 'AceForge <noreply@aceforge.app>',
        to: profile?.email,
        subject: '⚠️ You missed a session request',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#a32d2d">Missed Session Request</h2>
            <p>Hi ${profile?.display_name?.split(' ')[0]},</p>
            <p>A student's session request for <strong>${session.subject}</strong> on <strong>${new Date(session.scheduled_at).toLocaleString()}</strong> expired because it was not accepted within 24 hours.</p>
            <p>The student has been automatically refunded.</p>
            <div style="background:#faf5f5;border:1px solid #f0d0d0;border-radius:12px;padding:16px;margin:20px 0">
              <p style="color:#a32d2d;margin:0;font-size:14px">⚠️ <strong>Important:</strong> Respond to session requests within 24 hours to avoid missing opportunities. Repeated missed requests may affect your tutor standing.</p>
            </div>
            <a href="https://aceforge.app/tutor/dashboard" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Go to Dashboard →</a>
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `
      })
    }
  }

  const { data: sessionsRaw } = await adminClient
    .from('tutoring_sessions')
    .select('*')
    .eq('tutor_id', tutorProfile?.id)
    .order('scheduled_at', { ascending: false })

  const sessions = await Promise.all((sessionsRaw ?? []).map(async (s) => {
    const { data: studentProfile } = await adminClient
      .from('profiles')
      .select('display_name, email, avatar_url')
      .eq('id', s.student_id)
      .single()
    return { ...s, profiles: studentProfile }
  }))

  // Fetch reviews then look up student names manually — the embedded FK join
  // (profiles!tutor_reviews_student_id_fkey) was failing and returning nothing.
  const { data: reviewsRaw } = await adminClient
    .from('tutor_reviews')
    .select('*')
    .eq('tutor_id', tutorProfile?.id)
    .order('created_at', { ascending: false })

  const reviews = await Promise.all((reviewsRaw ?? []).map(async (r) => {
    const { data: student } = await adminClient.from('profiles').select('display_name').eq('id', r.student_id).single()
    return { ...r, profiles: student }
  }))

  const { data: payouts } = await adminClient
    .from('tutor_payouts')
    .select('*')
    .eq('tutor_id', tutorProfile?.id)
    .order('created_at', { ascending: false })

  const { data: availability } = await adminClient
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', tutorProfile?.id)

  return (
    <TutorThemeProvider>
      <div style={{ minHeight: '100vh' }}>
        <TutorDashboardClient
          profile={profile}
          tutorProfile={tutorProfile}
          sessions={sessions ?? []}
          reviews={reviews ?? []}
          payouts={payouts ?? []}
          availability={availability ?? []}
        />
      </div>
    </TutorThemeProvider>
  )
}
