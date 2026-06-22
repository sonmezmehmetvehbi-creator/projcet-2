
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'



export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, reason, details } = await request.json()

    const { data: profile } = await supabase.from('profiles').select('email, display_name').eq('id', user.id).single()

    const fullReason = details ? `${reason} — ${details}` : reason

    await supabase.from('tutoring_sessions').update({
      status: 'disputed',
      dispute_filed: true,
      dispute_reason: fullReason,
      dispute_status: 'pending',
    }).eq('id', sessionId)

    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: 'contactinfo21342@gmail.com',
      subject: '⚠️ Dispute Filed — Tutoring Session',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#991b1b">Dispute Filed</h2>
          <p><strong>Student:</strong> ${profile?.display_name} (${profile?.email})</p>
          <p><strong>Session ID:</strong> ${sessionId}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
          <p>Please review the session recording and resolve within 3-5 business days.</p>
          <a href="https://aceforge.app/admin/disputes" style="display:inline-block;background:#991b1b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Review Dispute →</a>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
