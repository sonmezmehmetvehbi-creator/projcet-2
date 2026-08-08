import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/rate — record the current user's 1-5 star rating for
// a quiz, then return the AUTHORITATIVE fresh aggregate (average + count) computed
// server-side. The client never does its own optimistic math — it just displays
// what this endpoint returns — which removes the whole class of stale-local-state
// bugs from earlier attempts.
//
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
    if (!quizId || typeof quizId !== 'string') {
      return NextResponse.json({ error: 'Missing quizId' }, { status: 400 })
    }
    const value = Number(rating)
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return NextResponse.json({ error: 'Rating must be an integer from 1 to 5' }, { status: 400 })
    }

    // Record (or update) this user's rating.
    const { error: upsertError } = await adminClient
      .from('forge_quiz_ratings')
      .upsert(
        { quiz_id: quizId, user_id: user.id, rating: value, updated_at: new Date().toISOString() },
        { onConflict: 'quiz_id,user_id' },
      )
    if (upsertError) throw upsertError

    // Re-query the fresh aggregate for this quiz so we return authoritative numbers.
    const { data: rows, error: fetchError } = await adminClient
      .from('forge_quiz_ratings')
      .select('rating')
      .eq('quiz_id', quizId)
    if (fetchError) throw fetchError

    const ratingCount = rows?.length ?? 0
    const avgRating = ratingCount > 0
      ? rows!.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratingCount
      : 0

    return NextResponse.json({ success: true, myRating: value, avgRating, ratingCount })
  } catch (error: any) {
    console.error('Forge quiz rate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
