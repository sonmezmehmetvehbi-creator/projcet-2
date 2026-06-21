import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'contactinfo21342@gmail.com'

// Moves all of a tutor's pending payouts to "processing" and emails the admin.
export async function POST() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: tutorProfile } = await adminClient
      .from('tutor_profiles')
      .select('id, display_name, venmo, paypal, zelle')
      .eq('user_id', user.id)
      .single()
    if (!tutorProfile) return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })

    const { data: pending } = await adminClient
      .from('tutor_payouts')
      .select('id, amount')
      .eq('tutor_id', tutorProfile.id)
      .eq('request_status', 'pending')

    if (!pending || pending.length === 0) {
      return NextResponse.json({ error: 'No pending balance to request' }, { status: 400 })
    }

    const total = pending.reduce((sum, p) => sum + (p.amount ?? 0), 0)

    const { error } = await adminClient
      .from('tutor_payouts')
      .update({ request_status: 'processing', requested_at: new Date().toISOString() })
      .eq('tutor_id', tutorProfile.id)
      .eq('request_status', 'pending')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const method = tutorProfile.venmo
      ? `Venmo: ${tutorProfile.venmo}`
      : tutorProfile.paypal
        ? `PayPal: ${tutorProfile.paypal}`
        : tutorProfile.zelle
          ? `Zelle: ${tutorProfile.zelle}`
          : 'Not set'

    try {
      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        subject: `Payout Request from ${tutorProfile.display_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">💸 New Payout Request</h2>
            <p><strong>Tutor:</strong> ${tutorProfile.display_name}</p>
            <p><strong>Total amount:</strong> $${total.toFixed(2)}</p>
            <p><strong>Payout method:</strong> ${method}</p>
            <a href="https://aceforge.app/admin/payouts" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Review in Admin →</a>
            <p style="color:#888;font-size:13px;margin-top:24px">— AceForge</p>
          </div>
        `,
      })
    } catch (e) { console.error('payout request email error:', e) }

    return NextResponse.json({ success: true, total })
  } catch (error: any) {
    console.error('request-payout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
