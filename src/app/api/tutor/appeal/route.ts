import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { name, email, reason, additional } = await request.json()

    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: 'contactinfo21342@gmail.com',
      subject: `⚖️ Tutor Appeal: ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#a32d2d">Tutor Application Appeal</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <h3>Reason for Appeal:</h3>
          <p style="background:#faf5f5;border:1px solid #f0d0d0;border-radius:8px;padding:16px">${reason}</p>
          ${additional ? `<h3>Additional Information:</h3><p style="background:#f8f8f8;border:1px solid #ddd;border-radius:8px;padding:16px">${additional}</p>` : ''}
        </div>
      `,
    })

    // Confirm to applicant
    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: email,
      subject: 'We received your appeal — AceForge',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#22550e">Appeal Received</h2>
          <p>Hi ${name},</p>
          <p>We've received your appeal and will review it carefully within 3-5 business days. You'll receive an email with our decision.</p>
          <p>In the meantime, you can log in to your account:</p>
          <a href="https://aceforge.app/login" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
            Log In →
          </a>
          <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
