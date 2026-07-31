import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/toggle-star — toggle a quiz's starred flag.
// Requires:
// -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false;
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId, starred } = await request.json()
    if (!quizId) return NextResponse.json({ error: 'Missing quizId' }, { status: 400 })

    const { data: quiz } = await adminClient
      .from('forge_quizzes')
      .select('id, creator_id, is_starred')
      .eq('id', quizId)
      .maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    if (quiz.creator_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Explicit target if provided, otherwise flip the current value.
    const next = typeof starred === 'boolean' ? starred : !quiz.is_starred
    const { error } = await adminClient.from('forge_quizzes').update({ is_starred: next }).eq('id', quizId)
    if (error) throw error

    return NextResponse.json({ success: true, starred: next })
  } catch (error: any) {
    console.error('Forge quiz toggle-star error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
