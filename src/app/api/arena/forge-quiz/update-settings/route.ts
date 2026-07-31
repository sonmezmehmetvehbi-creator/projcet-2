import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/update-settings — creator updates quiz-level
// settings (currently just is_public). Creator-only.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId, isPublic } = await request.json()
    if (!quizId) return NextResponse.json({ error: 'Missing quizId' }, { status: 400 })

    const { data: quiz } = await adminClient.from('forge_quizzes').select('id, creator_id').eq('id', quizId).maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    if (quiz.creator_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const patch: Record<string, any> = {}
    if (typeof isPublic === 'boolean') patch.is_public = isPublic
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    const { error } = await adminClient.from('forge_quizzes').update(patch).eq('id', quizId)
    if (error) throw error

    return NextResponse.json({ success: true, ...patch })
  } catch (error: any) {
    console.error('Forge quiz update-settings error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
