import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/live/join — a player joins a waiting live session.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { sessionId, displayName, avatarEmoji = '🎓' } = await request.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const { data: session } = await adminClient
      .from('forge_quiz_live_sessions')
      .select('id, status, max_players')
      .eq('id', sessionId)
      .maybeSingle()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.status !== 'waiting') return NextResponse.json({ error: 'Game already started' }, { status: 403 })

    // Names are capped at 15 characters (client + server).
    const name = (String(displayName ?? '').trim().slice(0, 15)) || 'Player'

    const { data: existing } = await adminClient
      .from('forge_quiz_live_players')
      .select('id, is_kicked')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing?.is_kicked) return NextResponse.json({ error: 'kicked', kicked: true }, { status: 403 })

    if (existing) {
      await adminClient
        .from('forge_quiz_live_players')
        .update({ display_name: name, avatar_emoji: avatarEmoji })
        .eq('id', existing.id)
      return NextResponse.json({ playerId: existing.id })
    }

    // Enforce max players for new joiners.
    if (session.max_players) {
      const { count } = await adminClient
        .from('forge_quiz_live_players')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('is_kicked', false)
      if ((count ?? 0) >= session.max_players) return NextResponse.json({ error: 'This game is full', full: true }, { status: 403 })
    }

    const { data: player, error } = await adminClient
      .from('forge_quiz_live_players')
      .insert({ session_id: sessionId, user_id: user.id, display_name: name, avatar_emoji: avatarEmoji })
      .select('id')
      .single()
    if (error) throw error

    return NextResponse.json({ playerId: player.id })
  } catch (error: any) {
    console.error('Forge quiz live join error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
