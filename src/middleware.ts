import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/tutor/signup',
  '/tutor/apply',
  '/admin/signup',
  '/forgot-password',
  '/reset-password',
  '/pricing',
  '/auth/callback',
  '/privacy',
  '/terms',
  '/admin',
  '/tutoring/legal',
  '/tutor/appeal',
  '/tutor/meet-guide',
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/ads.txt')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    // Use service role to bypass RLS when reading profile
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    if (profile?.is_admin) {
      url.pathname = '/admin/dashboard'
    } else if (profile?.role === 'tutor_pending') {
      url.pathname = '/tutor/apply'
    } else if (profile?.role === 'tutor') {
      url.pathname = '/tutor/dashboard'
    } else {
      url.pathname = '/dashboard'
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
