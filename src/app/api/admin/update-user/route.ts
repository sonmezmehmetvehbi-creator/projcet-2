import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { userId, action } = await request.json()
    if (!userId || !action) return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let update: Record<string, any>
    if (action === 'make_admin') {
      update = { is_admin: true }
    } else if (action === 'remove_premium') {
      update = { is_premium: false }
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    const { error } = await adminClient.from('profiles').update(update).eq('id', userId)
    if (error) throw error

    return NextResponse.json({ success: true, update })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
