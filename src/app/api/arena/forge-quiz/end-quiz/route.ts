import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/end-quiz — creator ends a quiz early.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId } = await request.json()
    if (!quizId) return NextResponse.json({ error: 'Missing quizId' }, { status: 400 })

    const { data: quiz } = await adminClient.from('forge_quizzes').select('creator_id, launched_by').eq('id', quizId).maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    // The room host (original creator or the launcher of this instance) can end it.
    if (quiz.creator_id !== user.id && quiz.launched_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await adminClient
      .from('forge_quizzes')
      .update({ status: 'ended', expires_at: new Date().toISOString() })
      .eq('id', quizId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forge quiz end-quiz error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
