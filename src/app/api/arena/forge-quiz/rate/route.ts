import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/rate — record the current user's 1-5 star rating for
// a quiz. Upserts on the UNIQUE (quiz_id, user_id) constraint so re-rating just
// updates the existing row. (Not yet wired into any UI — used by Browse later.)
// -- CREATE TABLE IF NOT EXISTS forge_quiz_ratings (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   quiz_id uuid REFERENCES forge_quizzes(id),
// --   user_id uuid REFERENCES profiles(id),
// --   rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
// --   created_at timestamptz DEFAULT now(),
// --   updated_at timestamptz DEFAULT now(),
// --   UNIQUE (quiz_id, user_id)
// -- );
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId, rating } = await request.json()
    const value = Math.round(Number(rating))
    if (!quizId) return NextResponse.json({ error: 'Missing quizId' }, { status: 400 })
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      return NextResponse.json({ error: 'Rating must be an integer from 1 to 5' }, { status: 400 })
    }

    const { data: quiz } = await adminClient.from('forge_quizzes').select('id').eq('id', quizId).maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

    const { error } = await adminClient
      .from('forge_quiz_ratings')
      .upsert(
        { quiz_id: quizId, user_id: user.id, rating: value, updated_at: new Date().toISOString() },
        { onConflict: 'quiz_id,user_id' },
      )
    if (error) throw error

    return NextResponse.json({ success: true, rating: value })
  } catch (error: any) {
    console.error('Forge quiz rate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
