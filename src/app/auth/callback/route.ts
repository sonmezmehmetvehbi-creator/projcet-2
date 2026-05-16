import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // Redirect to client-side handler with the code
    return NextResponse.redirect(
      `https://aceforge.app/auth/confirm?code=${code}&next=${next}`
    )
  }

  return NextResponse.redirect('https://aceforge.app/login?error=no_code')
}