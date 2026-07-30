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
// Body: { sessionId, questionId }  (questionId is the question's uuid)
// Returns: { answered, total, rows: [{ answer }], counts: { "0": n, ... } }
//   answered = number of answers for this question
//   total    = active (non-kicked) player count (the "/ Y" denominator)
//   rows     = raw answer values for option aggregation on the host
//   counts   = answers grouped by the `answer` column value
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { sessionId, questionId } = await request.json()
    if (!sessionId || !questionId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: session } = await adminClient
      .from('forge_quiz_live_sessions')
      .select('host_id')
      .eq('id', sessionId)
      .maybeSingle()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Answers for THIS session + question, keyed by question_id (uuid → the
    // question's forge_quiz_questions.id). There is NO question_index column.
    console.error('[answer-stats] querying with:', { sessionId, questionId })
    const { data: rows, error: rowsError } = await adminClient
      .from('forge_quiz_live_answers')
      .select('answer')
      .eq('session_id', sessionId)
      .eq('question_id', questionId)
    if (rowsError) {
      console.error('[answer-stats] rows error:', rowsError)
      return NextResponse.json({ error: rowsError.message }, { status: 500 })
    }

    const { count: total } = await adminClient
      .from('forge_quiz_live_players')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('is_kicked', false)

    // Group by the stored `answer` value (option index in string form: "0".."3").
    const counts: Record<string, number> = {}
    for (const r of rows ?? []) {
      const key = r.answer == null ? 'null' : String(r.answer)
      counts[key] = (counts[key] ?? 0) + 1
    }

    const data = { answered: rows?.length ?? 0, total: total ?? 0, rows: rows ?? [], counts }
    console.error('[answer-stats] success:', data)
    console.error('[answer-stats] final counts:', counts, 'total:', total ?? 0)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[answer-stats] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
