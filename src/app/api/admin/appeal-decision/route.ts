import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'



export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { appealId, decision, email, name, note } = await request.json()

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await adminClient.from('tutor_appeals').update({ status: decision }).eq('id', appealId)

    if (decision === 'approved') {
      // Find tutor profile and approve it
      const { data: tutorProfile } = await adminClient
        .from('tutor_profiles')
        .select('id, user_id')
        .eq('status', 'rejected')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (tutorProfile) {
        await adminClient.from('tutor_profiles').update({ status: 'approved' }).eq('id', tutorProfile.id)
        await adminClient.from('profiles').update({ role: 'tutor', tutor_status: 'approved' }).eq('id', tutorProfile.user_id)
      }

      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: email,
        subject: '🎉 Your Appeal Was Approved — Welcome to AceForge!',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">Appeal Approved! 🎉</h2>
            <p>Hi ${name},</p>
            <p>Great news — we've reviewed your appeal and decided to <strong>approve your tutor application</strong>!</p>
            ${note ? `<div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:16px;margin:20px 0"><p style="color:#22550e;margin:0"><strong>Note from our team:</strong> ${note}</p></div>` : ''}
            <p>You can now log in to access your tutor dashboard.</p>
            <a href="https://aceforge.app/login" style="display:inline-block;background:#22550e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">
              Log In to Tutor Dashboard →
            </a>
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `,
      })
    } else {
      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: email,
        subject: 'Final Decision on Your AceForge Tutor Appeal',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#1a1a14">Final Decision on Your Appeal</h2>
            <p>Hi ${name},</p>
            <p>We have carefully reviewed your appeal and, after thorough consideration, we are unable to approve your tutor application at this time.</p>
            ${note ? `<div style="background:#faf5f5;border:1px solid #f0d0d0;border-radius:12px;padding:16px;margin:20px 0"><p style="color:#a32d2d;margin:0"><strong>Feedback from our team:</strong> ${note}</p></div>` : ''}
            <div style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:12px;padding:20px;margin:20px 0">
              <p style="color:#555;margin:0;line-height:1.7">
                <strong>This is our final decision</strong> and we are unable to consider further appeals for this application. 
                However, you are welcome to <strong>reapply in 6 months</strong> (after ${new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}) with an updated application that addresses the feedback provided.
              </p>
            </div>
            <p>We appreciate your interest in AceForge and wish you the best in your tutoring journey.</p>
            <a href="https://aceforge.app/login" style="display:inline-block;background:#555;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
              Log In →
            </a>
            <p style="color:#888;font-size:13px;margin-top:24px">
              Questions? Contact us at contactinfo21342@gmail.com
            </p>
            <p style="color:#888;font-size:13px">— The AceForge Team</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
