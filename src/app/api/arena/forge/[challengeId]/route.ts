import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// GET /api/arena/forge/[challengeId]
// Returns public challenge details (never the password hash or questions) plus
// the sorted leaderboard. Used by the lobby for its initial load and after
// realtime events fire.
export async function GET(_request: Request, { params }: { params: { challengeId: string } }) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: challenge } = await adminClient
      .from('forge_challenges')
      .select('id, creator_id, creator_name, title, welcome_message, subject, topic, difficulty, question_count, total_time_seconds, correct_bonus_seconds, wrong_penalty_seconds, max_players, is_password_protected, banner_color, status, expires_at, created_at')
      .eq('id', params.challengeId)
      .maybeSingle()

    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })

    const { data: participants } = await adminClient
      .from('forge_participants')
      .select('user_id, display_name, avatar_emoji, score, correct, attempted, best_streak, completion_time_seconds, completed')
      .eq('challenge_id', params.challengeId)
      .order('score', { ascending: false })

    return NextResponse.json({
      challenge,
      leaderboard: participants ?? [],
      currentUserId: user.id,
    })
  } catch (error: any) {
    console.error('Forge get-challenge error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
