import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/live/answer-stats
//
// Host-only. Reads forge_quiz_live_answers for a session + question via the
// SERVICE-ROLE client, which bypasses RLS. The host page previously read this
// table with the anon browser client; if RLS is enabled on
// forge_quiz_live_answers with no permissive SELECT policy, that anon read
// silently returns 0 rows AND Realtime delivers 0 change events — which is why
// the host's "X/Y answered" counter stayed at 0 and the reveal bars showed 0
// even though the answer rows (and the scores derived from them) exist.
//
// Returns: { answered, total, rows: [{ answer }] }
//   answered = number of answers for this question
//   total    = active (non-kicked) player count (the "/ Y" denominator)
//   rows     = raw answer values for option aggregation on the host
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { sessionId, questionIndex } = await request.json()
    if (!sessionId || questionIndex == null) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: session } = await adminClient
      .from('forge_quiz_live_sessions')
      .select('host_id')
      .eq('id', sessionId)
      .maybeSingle()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Answers for THIS session + question (keyed by question_index — the same
    // integer the submit-answer route stores; there is no question_id column).
    const { data: rows, error: rowsError } = await adminClient
      .from('forge_quiz_live_answers')
      .select('answer')
      .eq('session_id', sessionId)
      .eq('question_index', questionIndex)
    if (rowsError) {
      console.error('[Live] answer-stats rows error:', rowsError)
      return NextResponse.json({ error: rowsError.message }, { status: 500 })
    }

    const { count: total } = await adminClient
      .from('forge_quiz_live_players')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('is_kicked', false)

    return NextResponse.json({ answered: rows?.length ?? 0, total: total ?? 0, rows: rows ?? [] })
  } catch (error: any) {
    console.error('Forge quiz live answer-stats error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
