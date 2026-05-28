
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { sessionId, decision, note } = await request.json()

    const { data: session } = await supabase
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

    // If refund approved — withhold tutor payout
    if (decision === 'refund') {
      await supabase
        .from('tutor_payouts')
        .update({ status: 'withheld' })
        .eq('session_id', sessionId)
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
            ? '<p>Your refund of <strong>$' + session.student_price + '</strong> has been approved. You will receive it within 3-5 business days to your original payment method.</p>'
            : '<p>After reviewing the session recording, we were unable to approve a refund for this session.</p>'
          }
          ${note ? '<p><strong>Note from our team:</strong> ' + note + '</p>' : ''}
          <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Resolve dispute error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}