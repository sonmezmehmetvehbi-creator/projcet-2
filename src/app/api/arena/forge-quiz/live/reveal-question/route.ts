import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/live/reveal-question — host reveals the answer, or
// advances to the round leaderboard. { sessionId, state? } where state is
// 'revealed' (default) or 'leaderboard'.
//
// -- ALTER TABLE forge_quiz_live_sessions ADD COLUMN IF NOT EXISTS question_state text DEFAULT 'question';
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { sessionId, state = 'revealed' } = await request.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    const nextState = state === 'leaderboard' ? 'leaderboard' : 'revealed'

    const { data: session } = await adminClient.from('forge_quiz_live_sessions').select('host_id').eq('id', sessionId).maybeSingle()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await adminClient
      .from('forge_quiz_live_sessions')
      .update({ question_state: nextState })
      .eq('id', sessionId)
    if (error) throw error

    return NextResponse.json({ success: true, questionState: nextState })
  } catch (error: any) {
    console.error('Forge quiz live reveal-question error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
