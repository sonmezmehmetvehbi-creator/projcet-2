import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getClientIp, allowGuestJoin, isNicknameClean } from '@/lib/forgeAbuse'

// POST /api/arena/forge-quiz/live/join — a player joins a waiting live session.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { sessionId, displayName, avatarEmoji = '🎓', guestId } = await request.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    // Either an authenticated user (unchanged) OR a guest identified by guestId.
    const guest = String(guestId ?? '').trim()
    if (!user && !guest) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Match a player row by whichever identity is present.
    const matchPlayer = (q: any) => (user ? q.eq('user_id', user.id) : q.eq('guest_id', guest))

    const { data: session } = await adminClient
      .from('forge_quiz_live_sessions')
      .select('id, status, max_players')
      .eq('id', sessionId)
      .maybeSingle()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.status !== 'waiting') return NextResponse.json({ error: 'Game already started' }, { status: 403 })

    // Names are capped at 15 characters (client + server).
    const name = (String(displayName ?? '').trim().slice(0, 15)) || 'Player'
    // Reject clearly-inappropriate names (applies to guests AND authed users,
    // who can freely rename themselves per session on each join).
    if (!isNicknameClean(name)) {
      return NextResponse.json({ error: 'Please choose an appropriate name', badName: true }, { status: 400 })
    }

    const { data: existing } = await matchPlayer(adminClient
      .from('forge_quiz_live_players')
      .select('id, is_kicked')
      .eq('session_id', sessionId))
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

    // Spam guard: a brand-new guest joining. Cap distinct guest joins per IP per
    // room in a short window so one device can't flood a room with fake players.
    // (Rejoins took the `existing` path above and never reach here.)
    if (!user && !allowGuestJoin(getClientIp(request), sessionId)) {
      return NextResponse.json({ error: 'Too many join attempts, please wait a moment', rateLimited: true }, { status: 429 })
    }

    const { data: player, error } = await adminClient
      .from('forge_quiz_live_players')
      .insert({ session_id: sessionId, user_id: user?.id ?? null, guest_id: user ? null : guest, display_name: name, avatar_emoji: avatarEmoji })
      .select('id')
      .single()
    if (error) throw error

    return NextResponse.json({ playerId: player.id })
  } catch (error: any) {
    console.error('Forge quiz live join error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
