import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Leaderboard / personal-best storage for the Arena games. Run once in Supabase:
//
// -- CREATE TABLE IF NOT EXISTS arena_scores (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid REFERENCES profiles(id), game_type text DEFAULT 'speed_round', subject text, topic text, difficulty text, score int, correct int, attempted int, best_streak int, created_at timestamptz DEFAULT now());
// -- ALTER TABLE arena_scores DISABLE ROW LEVEL SECURITY;

// GET /api/arena/save-score?subject=...&difficulty=...
// Returns the current user's personal best {score, created_at} for the given
// subject + difficulty (speed_round), so the Arena landing can show "Your Best".
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')
    const difficulty = searchParams.get('difficulty') ?? 'medium'
    const gameType = searchParams.get('gameType') ?? 'speed_round'
    if (!subject) return NextResponse.json({ best: null })

    const { data: best } = await adminClient
      .from('arena_scores')
      .select('score, created_at')
      .eq('user_id', user.id)
      .eq('game_type', gameType)
      .eq('subject', subject)
      .eq('difficulty', difficulty)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ best: best ?? null })
  } catch (error: any) {
    console.error('Arena best GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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

    // Read the user's previous best for this subject+difficulty BEFORE inserting,
    // so the client can decide whether this run is a new personal best.
    const { data: previousBest } = await adminClient
      .from('arena_scores')
      .select('score, created_at')
      .eq('user_id', user.id)
      .eq('game_type', gameType)
      .eq('subject', subject)
      .eq('difficulty', difficulty)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle()

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

    // Best score after this run (max of previous best and this run).
    const best = Math.max(previousBest?.score ?? 0, score)
    const isNewBest = !previousBest || score > (previousBest.score ?? 0)

    return NextResponse.json({
      previousBest: previousBest ?? null,
      best,
      isNewBest,
    })
  } catch (error: any) {
    console.error('Arena save-score error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
