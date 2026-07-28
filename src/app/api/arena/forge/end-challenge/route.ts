import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Creator-only: end a Forge Challenge early (marks it ended and expires it now).
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { challengeId } = await request.json()
    if (!challengeId) return NextResponse.json({ error: 'Missing challengeId' }, { status: 400 })

    const { data: challenge } = await adminClient
      .from('forge_challenges')
      .select('creator_id')
      .eq('id', challengeId)
      .maybeSingle()
    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    if (challenge.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await adminClient
      .from('forge_challenges')
      .update({ status: 'ended', expires_at: new Date().toISOString() })
      .eq('id', challengeId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forge end-challenge error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
