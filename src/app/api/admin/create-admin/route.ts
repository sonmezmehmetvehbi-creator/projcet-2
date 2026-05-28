
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { userId, token, displayName, email } = await request.json()

    // Verify token
    if (token !== process.env.ADMIN_INVITE_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    // Use service role to set admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase.from('profiles').upsert({
      id: userId,
      display_name: displayName,
      email,
      is_admin: true,
      role: 'admin',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
