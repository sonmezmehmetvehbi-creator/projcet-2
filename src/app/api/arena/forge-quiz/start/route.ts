import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Players who join a Forge Quiz. Run once in Supabase:
//
// -- CREATE TABLE IF NOT EXISTS forge_quiz_players (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   quiz_id uuid REFERENCES forge_quizzes(id),
// --   user_id uuid REFERENCES profiles(id),
// --   display_name text NOT NULL,
// --   avatar_emoji text DEFAULT '🎓',
// --   score int DEFAULT 0,
// --   completed boolean DEFAULT false,
// --   is_kicked boolean DEFAULT false,
// --   joined_at timestamptz DEFAULT now(),
// --   completed_at timestamptz
// -- );
// -- ALTER TABLE forge_quiz_players DISABLE ROW LEVEL SECURITY;
// -- ALTER PUBLICATION supabase_realtime ADD TABLE forge_quiz_players;

// POST /api/arena/forge-quiz/start — host starts a live room.
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
      .select('creator_id, launched_by')
      .eq('id', quizId)
      .maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    // The room host (original creator or the launcher of this instance) can start it.
    if (quiz.creator_id !== user.id && quiz.launched_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await adminClient
      .from('forge_quizzes')
      .update({ status: 'playing' })
      .eq('id', quizId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forge quiz start error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
