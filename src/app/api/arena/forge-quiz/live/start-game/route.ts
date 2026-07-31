import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/live/start-game — host starts the live game.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { sessionId } = await request.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const { data: session } = await adminClient.from('forge_quiz_live_sessions').select('host_id, status, quiz_id').eq('id', sessionId).maybeSingle()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Never start an empty game — require at least one non-kicked player.
    const { count: playerCount } = await adminClient
      .from('forge_quiz_live_players')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('is_kicked', false)
    if ((playerCount ?? 0) < 1) return NextResponse.json({ error: 'Need at least 1 player to start', noPlayers: true }, { status: 400 })

    const { error } = await adminClient
      .from('forge_quiz_live_sessions')
      .update({ status: 'active', current_question_index: 0, question_started_at: new Date().toISOString(), question_state: 'question', countdown_target_at: null })
      .eq('id', sessionId)
    if (error) throw error

    // A live playthrough is beginning — bump the quiz's play_count once per game.
    // -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS play_count int DEFAULT 0;
    if (session.quiz_id) {
      const { data: q } = await adminClient.from('forge_quizzes').select('play_count').eq('id', session.quiz_id).maybeSingle()
      await adminClient.from('forge_quizzes').update({ play_count: (q?.play_count ?? 0) + 1 }).eq('id', session.quiz_id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forge quiz live start-game error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
