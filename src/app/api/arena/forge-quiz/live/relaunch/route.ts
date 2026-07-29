import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/live/relaunch — the host of an ended/podium session
// spins up a fresh waiting-room session for the same quiz. { sessionId }.
function roomCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { sessionId } = await request.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const { data: original } = await adminClient
      .from('forge_quiz_live_sessions')
      .select('host_id, quiz_id, display_mode, max_players')
      .eq('id', sessionId)
      .maybeSingle()
    if (!original) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (original.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: session, error } = await adminClient
      .from('forge_quiz_live_sessions')
      .insert({
        quiz_id: original.quiz_id,
        host_id: user.id,
        room_code: roomCode(),
        status: 'waiting',
        display_mode: original.display_mode ?? 'host_screen',
        max_players: original.max_players ?? null,
      })
      .select('id, room_code')
      .single()
    if (error) throw error

    return NextResponse.json({ newSessionId: session.id, roomCode: session.room_code })
  } catch (error: any) {
    console.error('Forge quiz live relaunch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
