import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/arena/forge-quiz/live/find-session?code=XXXXXX
// Resolves a room code to a joinable (waiting, not full) live session.
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const code = (new URL(request.url).searchParams.get('code') || '').trim().toUpperCase()
    if (!code) return NextResponse.json({ error: 'Game not found or already started' }, { status: 404 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: session } = await adminClient
      .from('forge_quiz_live_sessions')
      .select('id, quiz_id, status, max_players')
      .eq('room_code', code)
      .eq('status', 'waiting')
      .maybeSingle()
    if (!session) return NextResponse.json({ error: 'Game not found or already started' }, { status: 404 })

    if (session.max_players) {
      const { count } = await adminClient
        .from('forge_quiz_live_players')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session.id)
        .eq('is_kicked', false)
      if ((count ?? 0) >= session.max_players) {
        return NextResponse.json({ error: 'This game is full' }, { status: 409 })
      }
    }

    const { data: quiz } = await adminClient
      .from('forge_quizzes')
      .select('title, banner_color')
      .eq('id', session.quiz_id)
      .maybeSingle()

    return NextResponse.json({
      sessionId: session.id,
      quizTitle: quiz?.title ?? 'Quiz',
      bannerColor: quiz?.banner_color ?? '#7c3aed',
      mode: 'live',
    })
  } catch (error: any) {
    console.error('Forge quiz live find-session error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
