import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Returns the challenge's participants sorted for the leaderboard.
async function leaderboard(adminClient: any, challengeId: string) {
  const { data } = await adminClient
    .from('forge_participants')
    .select('user_id, display_name, avatar_emoji, score, correct, attempted, best_streak, completion_time_seconds, completed')
    .eq('challenge_id', challengeId)
    .order('score', { ascending: false })
  return data ?? []
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const {
      challengeId,
      phase = 'final', // 'join' | 'final'
      displayName,
      avatarEmoji = '🎓',
      score = 0,
      correct = 0,
      attempted = 0,
      bestStreak = 0,
      completionTimeSeconds = null,
    } = await request.json()

    if (!challengeId) return NextResponse.json({ error: 'Missing challengeId' }, { status: 400 })

    const { data: challenge } = await adminClient
      .from('forge_challenges')
      .select('*')
      .eq('id', challengeId)
      .maybeSingle()
    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })

    // Existing participant row for this user (if any).
    const { data: existing } = await adminClient
      .from('forge_participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .maybeSingle()

    // ── JOIN phase: mark the player as present ("Playing…") ──
    if (phase === 'join') {
      // Enforce max players (new joiners only).
      if (challenge.max_players && !existing) {
        const { count } = await adminClient
          .from('forge_participants')
          .select('id', { count: 'exact', head: true })
          .eq('challenge_id', challengeId)
        if ((count ?? 0) >= challenge.max_players) {
          return NextResponse.json({ error: 'challenge_full', full: true }, { status: 403 })
        }
      }
      if (existing) {
        await adminClient
          .from('forge_participants')
          .update({ display_name: displayName || existing.display_name, avatar_emoji: avatarEmoji })
          .eq('id', existing.id)
      } else {
        await adminClient.from('forge_participants').insert({
          challenge_id: challengeId,
          user_id: user.id,
          display_name: displayName || 'Player',
          avatar_emoji: avatarEmoji,
          completed: false,
        })
      }
      return NextResponse.json({ leaderboard: await leaderboard(adminClient, challengeId) })
    }

    // ── FINAL phase: record the result (once) ──
    if (existing?.completed) {
      return NextResponse.json({ leaderboard: await leaderboard(adminClient, challengeId), alreadySubmitted: true })
    }

    const row = {
      challenge_id: challengeId,
      user_id: user.id,
      display_name: displayName || existing?.display_name || 'Player',
      avatar_emoji: avatarEmoji || existing?.avatar_emoji || '🎓',
      score, correct, attempted, best_streak: bestStreak,
      completion_time_seconds: completionTimeSeconds,
      completed: true,
      completed_at: new Date().toISOString(),
    }

    if (existing) {
      await adminClient.from('forge_participants').update(row).eq('id', existing.id)
    } else {
      await adminClient.from('forge_participants').insert(row)
    }

    // Award XP: correct × 5 + bestStreak × 10. Applied directly to the profile
    // (awarded once, since the FINAL phase only runs on first completion).
    try {
      const gained = correct * 5 + bestStreak * 10
      if (gained > 0) {
        const { data: prof } = await adminClient.from('profiles').select('xp').eq('id', user.id).single()
        await adminClient.from('profiles').update({ xp: (prof?.xp ?? 0) + gained }).eq('id', user.id)
      }
    } catch {}

    return NextResponse.json({ leaderboard: await leaderboard(adminClient, challengeId) })
  } catch (error: any) {
    console.error('Forge submit-score error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
