import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/delete — hard-delete a quiz the caller created,
// along with everything that references it. The FKs are declared without
// ON DELETE CASCADE, so children must be removed first, in FK-safe order.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId } = await request.json()
    if (!quizId) return NextResponse.json({ error: 'Missing quizId' }, { status: 400 })

    const { data: quiz } = await adminClient
      .from('forge_quizzes')
      .select('id, creator_id')
      .eq('id', quizId)
      .maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    if (quiz.creator_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Live sessions of this quiz (needed to clear their players + answers first).
    const { data: sessions } = await adminClient
      .from('forge_quiz_live_sessions')
      .select('id')
      .eq('quiz_id', quizId)
    const sessionIds = (sessions ?? []).map((s: any) => s.id)

    if (sessionIds.length > 0) {
      await adminClient.from('forge_quiz_live_answers').delete().in('session_id', sessionIds)
      await adminClient.from('forge_quiz_live_players').delete().in('session_id', sessionIds)
      await adminClient.from('forge_quiz_live_sessions').delete().eq('quiz_id', quizId)
    }

    // Self-paced players + the question set, then the quiz row itself.
    await adminClient.from('forge_quiz_players').delete().eq('quiz_id', quizId)
    await adminClient.from('forge_quiz_questions').delete().eq('quiz_id', quizId)

    const { error } = await adminClient.from('forge_quizzes').delete().eq('id', quizId).eq('creator_id', user.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forge quiz delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
