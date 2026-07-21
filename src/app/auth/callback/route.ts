import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { Resend } from 'resend'

function welcomeHtml(name: string, dashboardUrl: string) {
  const first = name?.split(' ')[0] || 'there'
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#22550e;font-size:24px">Welcome to AceForge, ${first}! 🎓</h2>
      <p>You've just joined an <strong>AI-powered study platform</strong> built to help you learn faster and ace your exams.</p>
      <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 12px;font-weight:700;color:#22550e">Quick start tips:</p>
        <p style="margin:0 0 8px">1️⃣ <strong>Generate your first questions</strong> — pick a subject and let the AI build a practice set.</p>
        <p style="margin:0 0 8px">2️⃣ <strong>Try SAT prep</strong> — realistic questions modeled on the real exam.</p>
        <p style="margin:0">3️⃣ <strong>Find a tutor</strong> — book a session when you want a helping hand.</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="${dashboardUrl}" style="display:inline-block;background:#22550e;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
          Get Started →
        </a>
      </div>
      <p style="color:#6b6b58;font-size:13px">
        You're on the <strong>Free plan</strong> — 2 questions per day. Upgrade to Premium anytime for unlimited generations.
      </p>
      <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
    </div>
  `
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Look up signup intent by email
      const { data: intent } = await adminClient
        .from('signup_intents')
        .select('role, display_name')
        .eq('email', data.user.email?.toLowerCase() ?? '')
        .single()

      // Determine role — intent takes priority, then next param, then default
      let role = 'user'
      let redirectTo = next
      if (intent?.role) {
        role = intent.role
        if (role === 'tutor_pending') redirectTo = '/tutor/apply'
        if (role === 'admin') redirectTo = '/admin/dashboard'
      } else if (next.includes('/tutor/apply')) {
        role = 'tutor_pending'
      } else if (next.includes('/admin')) {
        role = 'admin'
      }

      // Detect first-time profile creation so the welcome email only sends once.
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()
      const isNewUser = !existingProfile

      const displayName = intent?.display_name ?? data.user.user_metadata?.display_name ?? data.user.user_metadata?.full_name ?? ''

      // Upsert profile
      await adminClient.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        display_name: displayName,
        role,
        is_admin: role === 'admin',
      }, { onConflict: 'id', ignoreDuplicates: false })

      // Welcome email — only for brand-new regular users.
      if (isNewUser && role === 'user' && data.user.email) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY as string)
          await resend.emails.send({
            from: 'AceForge <noreply@aceforge.app>',
            to: data.user.email,
            subject: 'Welcome to AceForge! 🎓',
            html: welcomeHtml(displayName, `${origin}/dashboard`),
          })
        } catch (e: any) {
          console.error('Welcome email failed:', e?.message)
        }
      }

      // Clean up intent
      if (intent) {
        await adminClient.from('signup_intents').delete().eq('email', data.user.email?.toLowerCase() ?? '')
      }

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
