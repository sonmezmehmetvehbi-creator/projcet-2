import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

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

      // Upsert profile
      await adminClient.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        display_name: intent?.display_name ?? data.user.user_metadata?.display_name ?? data.user.user_metadata?.full_name ?? '',
        role,
        is_admin: role === 'admin',
      }, { onConflict: 'id', ignoreDuplicates: false })

      // Clean up intent
      if (intent) {
        await adminClient.from('signup_intents').delete().eq('email', data.user.email?.toLowerCase() ?? '')
      }

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
