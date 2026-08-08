import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Live Room sessions. Run once in Supabase:
//
// -- CREATE TABLE IF NOT EXISTS forge_quiz_live_sessions (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   quiz_id uuid REFERENCES forge_quizzes(id),
// --   host_id uuid REFERENCES profiles(id),
// --   room_code text,
// --   status text DEFAULT 'waiting',            -- 'waiting' | 'active' | 'ended'
// --   display_mode text DEFAULT 'host_screen',
// --   max_players int,
// --   current_question_index int DEFAULT 0,
// --   question_started_at timestamptz,
// --   countdown_target_at timestamptz,
// --   created_at timestamptz DEFAULT now()
// -- );
// -- ALTER TABLE forge_quiz_live_sessions DISABLE ROW LEVEL SECURITY;
// --
// -- CREATE TABLE IF NOT EXISTS forge_quiz_live_players (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   session_id uuid REFERENCES forge_quiz_live_sessions(id),
// --   user_id uuid REFERENCES profiles(id),
// --   display_name text NOT NULL,
// --   avatar_emoji text DEFAULT '🎓',
// --   score int DEFAULT 0,
// --   is_kicked boolean DEFAULT false,
// --   joined_at timestamptz DEFAULT now()
// -- );
// -- ALTER TABLE forge_quiz_live_players DISABLE ROW LEVEL SECURITY;
// -- ALTER PUBLICATION supabase_realtime ADD TABLE forge_quiz_live_players;
// -- ALTER PUBLICATION supabase_realtime ADD TABLE forge_quiz_live_sessions;

// Ambiguous characters (0/O, 1/I) are excluded for readability on a projector.
function roomCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId, displayMode = 'host_screen', maxPlayers = null } = await request.json()
    if (!quizId) return NextResponse.json({ error: 'Missing quizId' }, { status: 400 })

    const { data: quiz } = await adminClient
      .from('forge_quizzes')
      .select('creator_id, launched_by, max_players')
      .eq('id', quizId)
      .maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    // The original creator can always host; a non-creator can host a live instance
    // THEY launched (relaunch stamps launched_by). Both are legitimate hosts.
    if (quiz.creator_id !== user.id && quiz.launched_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: session, error } = await adminClient
      .from('forge_quiz_live_sessions')
      .insert({
        quiz_id: quizId,
        host_id: user.id,
        room_code: roomCode(),
        status: 'waiting',
        display_mode: displayMode,
        max_players: maxPlayers != null ? Number(maxPlayers) : (quiz.max_players ?? null),
      })
      .select('id, room_code')
      .single()
    if (error) throw error

    return NextResponse.json({ sessionId: session.id, roomCode: session.room_code })
  } catch (error: any) {
    console.error('Forge quiz live start-session error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
