import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Supabase migrations (run once):
// ALTER TABLE tutor_payouts ADD COLUMN IF NOT EXISTS paid_at timestamptz;
// ALTER TABLE tutor_payouts ADD COLUMN IF NOT EXISTS paid_via text;
// ALTER TABLE tutor_payouts ADD COLUMN IF NOT EXISTS reference_id text;
// ALTER TABLE tutor_payouts ADD COLUMN IF NOT EXISTS tutor_legal_name text;
// ALTER TABLE tutor_payouts ADD COLUMN IF NOT EXISTS tutor_payment_handle text;
// ALTER TABLE tutor_payouts ADD COLUMN IF NOT EXISTS receipt_url text;
// ALTER TABLE tutor_payouts ADD COLUMN IF NOT EXISTS notes text;
// ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS w9_collected boolean DEFAULT false;
// CREATE TABLE IF NOT EXISTS platform_reports (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, month text, year int, total_revenue numeric DEFAULT 0, total_payouts numeric DEFAULT 0, profit numeric DEFAULT 0, session_count int DEFAULT 0, created_at timestamptz DEFAULT now());
// Supabase: create 'payout-receipts' bucket as public

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const {
      payoutId, tutorId, amount, paidVia, referenceId,
      tutorName, tutorEmail, tutorPaymentHandle, notes,
    } = await request.json()

    if (!payoutId) return NextResponse.json({ error: 'Missing payoutId' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const paidAt = new Date().toISOString()

    // Update the payout record
    const { data: payout, error: updateErr } = await adminClient
      .from('tutor_payouts')
      .update({
        status: 'paid',
        request_status: 'paid',
        paid_at: paidAt,
        paid_via: paidVia ?? null,
        reference_id: referenceId ?? null,
        tutor_legal_name: tutorName ?? null,
        tutor_payment_handle: tutorPaymentHandle ?? null,
        notes: notes ?? null,
      })
      .eq('id', payoutId)
      .select('*')
      .single()

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
    if (!payout) return NextResponse.json({ error: 'Payout not found' }, { status: 404 })

    const paidAmount = Number(amount ?? payout.amount ?? 0)

    // Look up the linked session for the receipt
    let sessionSubject = '—'
    let sessionDate = '—'
    if (payout.session_id) {
      const { data: session } = await adminClient
        .from('tutoring_sessions')
        .select('subject, scheduled_at')
        .eq('id', payout.session_id)
        .single()
      if (session) {
        sessionSubject = session.subject ?? '—'
        sessionDate = session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : '—'
      }
    }

    const receiptDate = new Date(paidAt).toLocaleString()

    // Build a professional HTML receipt
    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AceForge Payout Receipt ${payoutId}</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f4f7ec;margin:0;padding:32px">
  <div style="max-width:640px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #d1e8c7">
    <div style="background:#22550e;padding:28px 32px">
      <div style="display:inline-block;background:white;color:#22550e;font-weight:800;font-size:20px;padding:6px 14px;border-radius:8px">AceForge</div>
      <p style="color:#d8efc9;margin:14px 0 0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase">Payment Receipt</p>
    </div>
    <div style="padding:32px">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1a1a14">
        <tr><td style="padding:8px 0;color:#6b6b58">Receipt #</td><td style="padding:8px 0;text-align:right;font-weight:600">${payoutId}</td></tr>
        <tr><td style="padding:8px 0;color:#6b6b58">Date</td><td style="padding:8px 0;text-align:right;font-weight:600">${receiptDate}</td></tr>
        <tr><td style="padding:8px 0;color:#6b6b58">Paid to</td><td style="padding:8px 0;text-align:right;font-weight:600">${tutorName ?? 'Tutor'}</td></tr>
        <tr><td style="padding:8px 0;color:#6b6b58">Session subject</td><td style="padding:8px 0;text-align:right;font-weight:600">${sessionSubject}</td></tr>
        <tr><td style="padding:8px 0;color:#6b6b58">Session date</td><td style="padding:8px 0;text-align:right;font-weight:600">${sessionDate}</td></tr>
        <tr><td style="padding:8px 0;color:#6b6b58">Payment method</td><td style="padding:8px 0;text-align:right;font-weight:600">${paidVia ?? '—'}${tutorPaymentHandle ? ' (' + tutorPaymentHandle + ')' : ''}</td></tr>
        <tr><td style="padding:8px 0;color:#6b6b58">Reference ID</td><td style="padding:8px 0;text-align:right;font-weight:600">${referenceId ?? '—'}</td></tr>
      </table>
      <div style="margin-top:24px;padding:20px;background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:15px;color:#6b6b58;font-weight:600">Amount Paid</span>
        <span style="font-size:26px;color:#22550e;font-weight:800">$${paidAmount.toFixed(2)}</span>
      </div>
      ${notes ? `<p style="margin-top:18px;font-size:13px;color:#6b6b58"><strong>Notes:</strong> ${notes}</p>` : ''}
      <p style="margin-top:24px;font-size:12px;color:#999;line-height:1.6">Keep this for your tax records. AceForge classifies tutors as independent contractors. You are responsible for reporting this income. Tutors earning $600+ in a calendar year will receive a 1099-NEC.</p>
    </div>
  </div>
</body>
</html>`

    // Store receipt in the public 'payout-receipts' bucket
    let receiptUrl: string | null = null
    try {
      const fileName = `${payoutId}.html`
      const { error: uploadErr } = await adminClient.storage
        .from('payout-receipts')
        .upload(fileName, receiptHtml, { contentType: 'text/html', upsert: true })
      if (uploadErr) {
        console.error('Receipt upload error:', uploadErr.message)
      } else {
        const { data: pub } = adminClient.storage.from('payout-receipts').getPublicUrl(fileName)
        receiptUrl = pub.publicUrl
        await adminClient.from('tutor_payouts').update({ receipt_url: receiptUrl }).eq('id', payoutId)
      }
    } catch (e: any) {
      console.error('Receipt storage error:', e.message)
    }

    // Email the tutor their receipt
    try {
      if (tutorEmail) {
        await resend.emails.send({
          from: 'AceForge <onboarding@resend.dev>',
          to: tutorEmail,
          subject: '💰 Payment Received — AceForge',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:0;border:1px solid #d1e8c7;border-radius:16px;overflow:hidden">
              <div style="background:#22550e;padding:24px 28px">
                <div style="display:inline-block;background:white;color:#22550e;font-weight:800;font-size:18px;padding:5px 12px;border-radius:8px">AceForge</div>
                <p style="color:#d8efc9;margin:12px 0 0;font-size:12px;letter-spacing:0.04em;text-transform:uppercase">Payment Receipt</p>
              </div>
              <div style="padding:28px">
                <h2 style="color:#1a1a14;margin:0 0 12px">You've been paid! 💰</h2>
                <p style="color:#555">Hi ${tutorName?.split(' ')[0] ?? 'there'}, your payout has been sent.</p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1a1a14;margin-top:12px">
                  <tr><td style="padding:6px 0;color:#6b6b58">Receipt #</td><td style="padding:6px 0;text-align:right;font-weight:600">${payoutId}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b6b58">Date</td><td style="padding:6px 0;text-align:right;font-weight:600">${receiptDate}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b6b58">Session</td><td style="padding:6px 0;text-align:right;font-weight:600">${sessionSubject} · ${sessionDate}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b6b58">Method</td><td style="padding:6px 0;text-align:right;font-weight:600">${paidVia ?? '—'}</td></tr>
                  <tr><td style="padding:6px 0;color:#6b6b58">Reference ID</td><td style="padding:6px 0;text-align:right;font-weight:600">${referenceId ?? '—'}</td></tr>
                </table>
                <div style="margin-top:18px;padding:16px;background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:14px;color:#6b6b58;font-weight:600">Amount Paid</span>
                  <span style="font-size:22px;color:#22550e;font-weight:800">$${paidAmount.toFixed(2)}</span>
                </div>
                ${receiptUrl ? `<a href="${receiptUrl}" style="display:inline-block;margin-top:18px;background:#22550e;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Download Receipt →</a>` : ''}
                <p style="margin-top:22px;font-size:12px;color:#999;line-height:1.6">🧾 Keep this for your tax records. You are an independent contractor and responsible for reporting this income.</p>
                <p style="color:#888;font-size:13px;margin-top:18px">— The AceForge Team</p>
              </div>
            </div>
          `,
        })
      }
    } catch (e: any) {
      console.error('Receipt email error:', e.message)
    }

    // Update platform_reports for the current month (increment total_payouts)
    try {
      const now = new Date()
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const year = now.getFullYear()
      const { data: existing } = await adminClient
        .from('platform_reports')
        .select('id, total_payouts, profit, total_revenue')
        .eq('month', monthKey)
        .eq('year', year)
        .maybeSingle()
      if (existing) {
        const newPayouts = Number(existing.total_payouts ?? 0) + paidAmount
        await adminClient
          .from('platform_reports')
          .update({ total_payouts: newPayouts, profit: Number(existing.total_revenue ?? 0) - newPayouts })
          .eq('id', existing.id)
      } else {
        await adminClient
          .from('platform_reports')
          .insert({ month: monthKey, year, total_payouts: paidAmount, profit: -paidAmount })
      }
    } catch (e: any) {
      console.error('platform_reports update error:', e.message)
    }

    return NextResponse.json({ success: true, receiptUrl })
  } catch (error: any) {
    console.error('mark-payout-paid error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
