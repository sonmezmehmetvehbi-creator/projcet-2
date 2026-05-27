import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { name, email, subjects, education, institution, linkedIn, idUrl, cvUrl, videoUrl, certUrl } = await request.json()

    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: 'contactinfo21342@gmail.com',
      subject: `🎓 New Tutor Application — ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #22550e;">New Tutor Application</h2>
          <div style="background: #f8faf5; border: 1px solid #d1e8c7; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subjects:</strong> ${subjects.join(', ')}</p>
            <p><strong>Education:</strong> ${education} — ${institution}</p>
            ${linkedIn ? `<p><strong>LinkedIn:</strong> <a href="${linkedIn}">${linkedIn}</a></p>` : ''}
          </div>
          <div style="background: #fff8e6; border: 1px solid #f5c842; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3>Uploaded Documents</h3>
            <p>📄 <a href="${idUrl}">Photo ID</a></p>
            <p>📄 <a href="${cvUrl}">CV/Resume</a></p>
            <p>🎥 <a href="${videoUrl}">Intro Video</a></p>
            ${certUrl ? `<p>🏅 <a href="${certUrl}">Certificate</a></p>` : ''}
          </div>
          <p>Review this application at <a href="https://aceforge.app/admin/tutors" style="color: #22550e;">aceforge.app/admin/tutors</a></p>
        </div>
      `,
    })

    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: email,
      subject: '✅ Tutor Application Received — AceForge',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #22550e;">Application Received! 🎓</h2>
          <p>Hi ${name.split(' ')[0]},</p>
          <p>Thanks for applying to become an AceForge tutor! We've received your application and will review it within <strong>2-3 business days</strong>.</p>
          <p>We'll email you at this address with our decision.</p>
          <p style="color: #888; font-size: 13px; margin-top: 24px;">— The AceForge Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Notify error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}