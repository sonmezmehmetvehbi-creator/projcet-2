import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Leaderboard storage for the Arena games. Run once in Supabase:
//
// -- CREATE TABLE IF NOT EXISTS arena_scores (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid REFERENCES profiles(id), game_type text DEFAULT 'speed_round', subject text, topic text, difficulty text, score int, correct int, attempted int, best_streak int, created_at timestamptz DEFAULT now());
// -- ALTER TABLE arena_scores DISABLE ROW LEVEL SECURITY;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const {
      gameType = 'speed_round',
      subject,
      topic,
      difficulty = 'medium',
      score = 0,
      correct = 0,
      attempted = 0,
      bestStreak = 0,
    } = await request.json()

    // Save this run.
    await adminClient.from('arena_scores').insert({
      user_id: user.id,
      game_type: gameType,
      subject,
      topic,
      difficulty,
      score,
      correct,
      attempted,
      best_streak: bestStreak,
    })

    // Top 10 for this subject + difficulty.
    const { data: rows } = await adminClient
      .from('arena_scores')
      .select('user_id, score')
      .eq('game_type', gameType)
      .eq('subject', subject)
      .eq('difficulty', difficulty)
      .order('score', { ascending: false })
      .limit(10)

    // Resolve display names.
    const leaderboard = await Promise.all(
      (rows ?? []).map(async (r) => {
        const { data: p } = await adminClient.from('profiles').select('display_name').eq('id', r.user_id).single()
        return {
          name: p?.display_name || 'Anonymous',
          score: r.score ?? 0,
          isCurrentUser: r.user_id === user.id,
        }
      })
    )

    return NextResponse.json({ leaderboard })
  } catch (error: any) {
    console.error('Arena save-score error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
