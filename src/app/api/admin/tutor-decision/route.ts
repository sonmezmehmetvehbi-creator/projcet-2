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

    const { tutorProfileId, status, userId, email, name, note } = await request.json()

    await supabase.from('tutor_profiles').update({ status }).eq('id', tutorProfileId)
    await supabase.from('profiles').update({
      tutor_status: status,
      role: status === 'approved' ? 'tutor' : 'student',
    }).eq('id', userId)

    const isApproved = status === 'approved'

    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: email,
      subject: isApproved ? '🎉 You\'re approved as an AceForge Tutor!' : 'AceForge Tutor Application Update',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: ${isApproved ? '#22550e' : '#991b1b'};">
            ${isApproved ? '🎉 Congratulations! You\'re an AceForge Tutor!' : 'Application Update'}
          </h2>
          <p>Hi ${name.split(' ')[0]},</p>
          ${isApproved ? `
            <p>We're excited to welcome you to the AceForge tutor team! Your application has been approved.</p>
            <p>You can now log in and access your tutor dashboard to:</p>
            <ul>
              <li>Set up your profile</li>
              <li>Manage your availability</li>
              <li>Accept student sessions</li>
              <li>Track your earnings</li>
            </ul>
            <a href="https://aceforge.app/tutor/dashboard" style="display:inline-block; background:#22550e; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin-top:16px;">
              Go to Tutor Dashboard →
            </a>
          ` : `
            <p>Thank you for applying to become an AceForge tutor. After reviewing your application, we are unable to approve it at this time.</p>
            ${note ? `<p><strong>Note from our team:</strong> ${note}</p>` : ''}
            <p>You're welcome to reapply in the future with updated qualifications.</p>
          `}
          ${note && isApproved ? `<p><strong>Note from our team:</strong> ${note}</p>` : ''}
          <p style="color:#888; font-size:13px; margin-top:24px;">— The AceForge Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Decision error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}