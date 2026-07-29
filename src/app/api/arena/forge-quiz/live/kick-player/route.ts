import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/live/kick-player — host removes a live player.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { sessionId, playerId } = await request.json()
    if (!sessionId || !playerId) return NextResponse.json({ error: 'Missing sessionId or playerId' }, { status: 400 })

    const { data: session } = await adminClient.from('forge_quiz_live_sessions').select('host_id').eq('id', sessionId).maybeSingle()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await adminClient
      .from('forge_quiz_live_players')
      .update({ is_kicked: true })
      .eq('id', playerId)
      .eq('session_id', sessionId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forge quiz live kick-player error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
