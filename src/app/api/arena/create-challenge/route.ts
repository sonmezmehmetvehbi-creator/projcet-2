import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Arena "Challenge a Friend" storage. Run once in Supabase:
//
// -- CREATE TABLE IF NOT EXISTS arena_challenges (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, challenger_id uuid REFERENCES profiles(id), challenger_name text, subject text, topic text, difficulty text, challenger_score int, created_at timestamptz DEFAULT now());
// -- ALTER TABLE arena_challenges DISABLE ROW LEVEL SECURITY;
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
