import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tutorProfileId, status, userId, email, name, note } = await request.json()

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update tutor profile status
    await adminClient.from('tutor_profiles').update({ status }).eq('id', tutorProfileId)

    // Update user profile role
    if (status === 'approved') {
      await adminClient.from('profiles').update({
        role: 'tutor',
        tutor_status: 'approved',
      }).eq('id', userId)

      // Send approval email
      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: email,
        subject: '🎉 You\'re approved as an AceForge Tutor!',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">Congratulations, ${name}! 🎉</h2>
            <p>We're thrilled to let you know that your AceForge tutor application has been <strong>approved</strong>!</p>
            ${note ? `<div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:16px;margin:20px 0"><p style="color:#22550e;margin:0"><strong>Note from our team:</strong> ${note}</p></div>` : ''}
            <p>You can now log in to your tutor dashboard to:</p>
            <ul>
              <li>Set up your profile and availability</li>
              <li>Accept tutoring session requests</li>
              <li>Track your earnings and reviews</li>
            </ul>
            <p>Students will start seeing your profile and booking sessions with you soon.</p>
            <a href="https://aceforge.app/login" style="display:inline-block;background:#22550e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">
              Log In to Your Tutor Dashboard →
            </a>
            <p style="color:#888;font-size:13px;margin-top:32px">
              If you have any questions, contact us at contactinfo21342@gmail.com
            </p>
            <p style="color:#888;font-size:13px">— The AceForge Team</p>
          </div>
        `,
      })
    } else {
      await adminClient.from('profiles').update({
        tutor_status: 'rejected',
      }).eq('id', userId)

      // Send rejection email with appeal link
      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: email,
        subject: 'Update on your AceForge Tutor Application',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#1a1a14">Update on Your Application</h2>
            <p>Hi ${name},</p>
            <p>Thank you for your interest in becoming an AceForge tutor. After carefully reviewing your application, we are unable to approve it at this time.</p>
            ${note ? `<div style="background:#faf5f5;border:1px solid #f0d0d0;border-radius:12px;padding:16px;margin:20px 0"><p style="color:#a32d2d;margin:0"><strong>Feedback from our team:</strong> ${note}</p></div>` : ''}
            <p>If you believe this decision was made in error or would like to provide additional information, you can submit an appeal using the button below.</p>
            <a href="https://aceforge.app/tutor/appeal?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}" style="display:inline-block;background:#a32d2d;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">
              Appeal This Decision →
            </a>
            <p style="margin-top:24px">You can also log in to your account at any time:</p>
            <a href="https://aceforge.app/login" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
              Log In →
            </a>
            <p style="color:#888;font-size:13px;margin-top:32px">
              Questions? Contact us at contactinfo21342@gmail.com
            </p>
            <p style="color:#888;font-size:13px">— The AceForge Team</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Tutor decision error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
