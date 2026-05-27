import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, display_name, email')
      .eq('id', user.id)
      .single()

    if (!profile?.is_premium) {
      return NextResponse.json({ error: 'Premium required' }, { status: 403 })
    }

    const { subject, topic, slot1, slot2, slot3, message } = await request.json()

    if (!subject || !topic || !slot1) {
      return NextResponse.json({ error: 'Please fill in all required fields.' }, { status: 400 })
    }

    // Email to you
    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: 'contactinfo21342@gmail.com',
      subject: `📚 New Tutoring Request — ${subject}: ${topic}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #22550e; margin-bottom: 4px;">New Tutoring Request</h2>
          <p style="color: #666; margin-bottom: 24px;">A Premium user has requested a tutoring session.</p>

          <div style="background: #f8faf5; border: 1px solid #d1e8c7; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 16px; color: #0a1a06;">Student Info</h3>
            <p style="margin: 4px 0;"><strong>Name:</strong> ${profile.display_name ?? 'Not set'}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${profile.email ?? user.email}</p>
            <p style="margin: 4px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 4px 0;"><strong>Topic:</strong> ${topic}</p>
          </div>

          <div style="background: #fff8e6; border: 1px solid #f5c842; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 16px; color: #0a1a06;">Preferred Time Slots</h3>
            <p style="margin: 4px 0;">🕐 <strong>Slot 1:</strong> ${slot1}</p>
            ${slot2 ? `<p style="margin: 4px 0;">🕑 <strong>Slot 2:</strong> ${slot2}</p>` : ''}
            ${slot3 ? `<p style="margin: 4px 0;">🕒 <strong>Slot 3:</strong> ${slot3}</p>` : ''}
          </div>

          ${message ? `
          <div style="background: #f0f0f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px; color: #0a1a06;">Message</h3>
            <p style="margin: 0; color: #333;">${message}</p>
          </div>` : ''}

          <p style="color: #666; font-size: 14px;">
            Reply directly to this email or create a Google Meet at
            <a href="https://meet.google.com/new" style="color: #22550e;">meet.google.com/new</a>
            and send the link to the student.
          </p>
        </div>
      `,
      replyTo: profile.email ?? user.email,
    })

    // Confirmation email to student
    await resend.emails.send({
      from: 'AceForge <onboarding@resend.dev>',
      to: profile.email ?? user.email ?? '',
      subject: '✅ Tutoring Request Received — AceForge',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #22550e;">Your tutoring request was received! 🎓</h2>
          <p style="color: #444;">Hi ${profile.display_name?.split(' ')[0] ?? 'there'},</p>
          <p style="color: #444;">We received your request for a tutoring session on <strong>${subject} — ${topic}</strong>.</p>

          <div style="background: #f8faf5; border: 1px solid #d1e8c7; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px; color: #0a1a06;">Your availability:</h3>
            <p style="margin: 4px 0;">🕐 ${slot1}</p>
            ${slot2 ? `<p style="margin: 4px 0;">🕑 ${slot2}</p>` : ''}
            ${slot3 ? `<p style="margin: 4px 0;">🕒 ${slot3}</p>` : ''}
          </div>

          <p style="color: #444;">We'll review your request and send you a Google Meet link within <strong>24-48 hours</strong>.</p>
          <p style="color: #444;">In the meantime, keep studying on <a href="https://aceforge.app" style="color: #22550e;">aceforge.app</a>!</p>

          <p style="color: #888; font-size: 13px; margin-top: 24px;">— The AceForge Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Tutoring request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}