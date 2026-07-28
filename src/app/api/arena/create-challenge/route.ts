import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Arena "Challenge a Friend" storage. Run once in Supabase:
//
// -- CREATE TABLE IF NOT EXISTS arena_challenges (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, challenger_id uuid REFERENCES profiles(id), challenger_name text, subject text, topic text, difficulty text, challenger_score int, created_at timestamptz DEFAULT now());
// -- ALTER TABLE arena_challenges DISABLE ROW LEVEL SECURITY;
// -- ALTER TABLE arena_challenges ADD COLUMN IF NOT EXISTS questions jsonb;
// -- ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS arena_games int DEFAULT 0;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const {
      challengerName,
      subject,
      topic,
      difficulty = 'medium',
      challengerScore = 0,
      questions,
    } = await request.json()

    if (!subject || !topic) {
      return NextResponse.json({ error: 'Missing subject or topic' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('arena_challenges')
      .insert({
        challenger_id: user.id,
        challenger_name: challengerName || 'A friend',
        subject,
        topic,
        difficulty,
        challenger_score: challengerScore,
        // Store the exact questions from this game so the challenger faces the
        // same set (just reshuffled), rather than a freshly generated deck.
        questions: Array.isArray(questions) ? questions : null,
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ challengeId: data.id })
  } catch (error: any) {
    console.error('Arena create-challenge error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/arena/create-challenge?id=<challengeId>
// Returns a challenge (including its stored questions) so the challenger's game
// can reuse the same questions instead of regenerating.
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: challenge } = await adminClient
      .from('arena_challenges')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })

    return NextResponse.json({
      id: challenge.id,
      challengerName: challenge.challenger_name,
      challengerScore: challenge.challenger_score,
      subject: challenge.subject,
      topic: challenge.topic,
      difficulty: challenge.difficulty,
      questions: challenge.questions ?? null,
    })
  } catch (error: any) {
    console.error('Arena get-challenge error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
