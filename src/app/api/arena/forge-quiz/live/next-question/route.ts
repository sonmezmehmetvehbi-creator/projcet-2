import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/live/next-question — host advances the session.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { sessionId } = await request.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const { data: session } = await adminClient
      .from('forge_quiz_live_sessions')
      .select('host_id, quiz_id, current_question_index')
      .eq('id', sessionId)
      .maybeSingle()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { count: total } = await adminClient
      .from('forge_quiz_questions')
      .select('id', { count: 'exact', head: true })
      .eq('quiz_id', session.quiz_id)

    const nextIndex = (session.current_question_index ?? 0) + 1

    if (nextIndex >= (total ?? 0)) {
      await adminClient.from('forge_quiz_live_sessions').update({ status: 'podium', question_state: 'leaderboard' }).eq('id', sessionId)
      return NextResponse.json({ success: true, podium: true })
    }

    await adminClient
      .from('forge_quiz_live_sessions')
      .update({ current_question_index: nextIndex, question_started_at: new Date().toISOString(), question_state: 'question', status: 'active' })
      .eq('id', sessionId)

    return NextResponse.json({ success: true, questionIndex: nextIndex, podium: false })
  } catch (error: any) {
    console.error('Forge quiz live next-question error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
