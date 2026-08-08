import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/kick-player — host removes a player from a quiz.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId, playerId } = await request.json()
    if (!quizId || !playerId) return NextResponse.json({ error: 'Missing quizId or playerId' }, { status: 400 })

    const { data: quiz } = await adminClient
      .from('forge_quizzes')
      .select('creator_id, launched_by')
      .eq('id', quizId)
      .maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    // The room host is either the original creator or whoever launched this
    // instance (relaunch stamps launched_by).
    if (quiz.creator_id !== user.id && quiz.launched_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // `.neq('user_id', user.id)` keeps the host from kicking themselves.
    const { error } = await adminClient
      .from('forge_quiz_players')
      .update({ is_kicked: true })
      .eq('id', playerId)
      .eq('quiz_id', quizId)
      .neq('user_id', user.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forge quiz kick-player error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
