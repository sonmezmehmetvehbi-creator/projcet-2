import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Toggle a tutor's W-9 collection status (Tax Center).
// ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS w9_collected boolean DEFAULT false;
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { tutorId, collected } = await request.json()
    if (!tutorId) return NextResponse.json({ error: 'Missing tutorId' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await adminClient
      .from('tutor_profiles')
      .update({ w9_collected: !!collected })
      .eq('id', tutorId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, collected: !!collected })
  } catch (error: any) {
    console.error('toggle-w9 error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
