import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/toggle-star — star/save a quiz for the current user.
// Backed by the forge_quiz_stars join table (many users can star the same quiz),
// replacing the old single is_starred boolean.
// -- CREATE TABLE IF NOT EXISTS forge_quiz_stars (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   quiz_id uuid REFERENCES forge_quizzes(id),
// --   user_id uuid REFERENCES profiles(id),
// --   created_at timestamptz DEFAULT now(),
// --   UNIQUE (quiz_id, user_id)
// -- );
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId, starred } = await request.json()
    if (!quizId) return NextResponse.json({ error: 'Missing quizId' }, { status: 400 })

    const { data: quiz } = await adminClient.from('forge_quizzes').select('id').eq('id', quizId).maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

    // Determine the target state: explicit if provided, otherwise flip current.
    let next: boolean
    if (typeof starred === 'boolean') {
      next = starred
    } else {
      const { data: existing } = await adminClient
        .from('forge_quiz_stars')
        .select('id')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .maybeSingle()
      next = !existing
    }

    if (next) {
      // Idempotent add (UNIQUE(quiz_id,user_id) guards against duplicates).
      const { error } = await adminClient
        .from('forge_quiz_stars')
        .upsert({ quiz_id: quizId, user_id: user.id }, { onConflict: 'quiz_id,user_id', ignoreDuplicates: true })
      if (error) throw error
    } else {
      const { error } = await adminClient
        .from('forge_quiz_stars')
        .delete()
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
      if (error) throw error
    }

    return NextResponse.json({ success: true, starred: next })
  } catch (error: any) {
    console.error('Forge quiz toggle-star error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
