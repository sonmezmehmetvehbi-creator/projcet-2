import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Creator-only moderation: remove a participant from a Forge Challenge.
// Run once in Supabase:
// -- ALTER TABLE forge_participants ADD COLUMN IF NOT EXISTS is_kicked boolean DEFAULT false;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { challengeId, participantId } = await request.json()
    if (!challengeId || !participantId) {
      return NextResponse.json({ error: 'Missing challengeId or participantId' }, { status: 400 })
    }

    // Only the challenge creator may kick.
    const { data: challenge } = await adminClient
      .from('forge_challenges')
      .select('creator_id')
      .eq('id', challengeId)
      .maybeSingle()
    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    if (challenge.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark as kicked. `.neq('user_id', user.id)` prevents the creator from
    // kicking themselves.
    const { error } = await adminClient
      .from('forge_participants')
      .update({ is_kicked: true })
      .eq('id', participantId)
      .eq('challenge_id', challengeId)
      .neq('user_id', user.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forge kick-participant error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
