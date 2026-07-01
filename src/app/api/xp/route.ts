import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// XP is awarded only the first time a user completes a given subject+topic+type,
// preventing XP farming by re-running the same content. Completed combinations
// are recorded in user_xp_history, keyed by a normalized source_key.
//
// -- CREATE TABLE IF NOT EXISTS user_xp_history (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   user_id uuid REFERENCES profiles(id),
// --   source_type text,
// --   source_key text,
// --   xp_earned int,
// --   created_at timestamptz DEFAULT now(),
// --   UNIQUE(user_id, source_key)
// -- );
// -- ALTER TABLE user_xp_history DISABLE ROW LEVEL SECURITY;

const LEVELS = [
  { level: 1, name: 'Freshman', emoji: '📚', xpRequired: 0 },
  { level: 2, name: 'Apprentice', emoji: '✏️', xpRequired: 150 },
  { level: 3, name: 'Scholar', emoji: '🎓', xpRequired: 400 },
  { level: 4, name: 'Analyst', emoji: '🔍', xpRequired: 800 },
  { level: 5, name: 'Achiever', emoji: '⭐', xpRequired: 1500 },
  { level: 6, name: 'Expert', emoji: '🧠', xpRequired: 2500 },
  { level: 7, name: 'Master', emoji: '🏆', xpRequired: 4000 },
  { level: 8, name: 'Prodigy', emoji: '⚡', xpRequired: 6000 },
  { level: 9, name: 'Sage', emoji: '🌟', xpRequired: 9000 },
  { level: 10, name: 'Legend', emoji: '👑', xpRequired: 13000 },
]

const FREE_LEVEL_REWARDS: Record<number, number> = {
  2: 1,
  3: 2,
  5: 3,
  7: 5,
}

function getLevelFromXP(xp: number) {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) current = l
    else break
  }
  return current
}

function getNextLevel(currentLevel: number) {
  return LEVELS.find(l => l.level === currentLevel + 1) ?? null
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Use the service-role client for all DB reads/writes to avoid RLS issues.
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const {
      correctAnswers,
      totalAnswers,
      frScores,
      outputType,
      isFirstSessionToday,
      subject,
      topic,
    } = await request.json()

    const { data: profile } = await adminClient
      .from('profiles')
      .select('xp, level, streak_count, last_study_date, is_premium, bonus_generations')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // ── First-time-per-topic XP gating ────────────────────────────────────
    // Build a unique source_key from the request's subject + topic + type.
    const sourceType: string = outputType === 'questions' ? 'questions' : 'worksheet'
    const sourceKey = `${sourceType}:${(subject ?? '').toLowerCase().trim()}:${(topic ?? '').toLowerCase().trim()}`

    // If XP was already earned for this exact content, award nothing.
    {
      const { data: existing } = await adminClient
        .from('user_xp_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_key', sourceKey)
        .single()
      if (existing) {
        const currentLevel = getLevelFromXP(profile.xp ?? 0)
        return NextResponse.json({
          success: true,
          alreadyEarned: true,
          message: 'XP already earned for this topic',
          xpEarned: 0,
          breakdown: [{ reason: 'XP already earned for this topic', amount: 0 }],
          oldXP: profile.xp ?? 0,
          newXP: profile.xp ?? 0,
          oldLevel: currentLevel,
          newLevel: currentLevel,
          nextLevel: getNextLevel(currentLevel.level),
          didLevelUp: false,
          newStreak: profile.streak_count ?? 0,
          streakBonus: 0,
          streakMessage: '',
          bonusGenerationsAdded: 0,
          isPremium: profile.is_premium,
        })
      }
    }

    // ── Streak multiplier ────────────────────────────────────────────────
    const streakCount = profile.streak_count ?? 0
    const getMultiplierTier = (streak: number) => {
      if (streak >= 30) return 5
      if (streak >= 14) return 4
      if (streak >= 7) return 3
      if (streak >= 3) return 2
      return 1
    }
    const multiplierTier = getMultiplierTier(streakCount)
    const mcCorrectBonus  = [5, 6, 7, 8, 10][multiplierTier - 1]
    const fr4Bonus        = [8, 9, 10, 12, 14][multiplierTier - 1]
    const fr3Bonus        = [5,  6,  7,  8,  9][multiplierTier - 1]
    const fr2Bonus        = [3,  3,  4,  4,  5][multiplierTier - 1]

    // ── Calculate XP earned ──────────────────────────────────────────────
    let xpEarned = 0
    const breakdown: { reason: string; amount: number }[] = []

    if (outputType === 'questions') {
      const mcCorrect   = correctAnswers ?? 0
      const mcIncorrect = (totalAnswers ?? 0) - mcCorrect - (frScores?.length ?? 0)

      if (mcCorrect > 0) {
        const amount = mcCorrect * mcCorrectBonus
        xpEarned += amount
        const streakLabel = streakCount >= 3 ? ' 🔥' : ''
        breakdown.push({ reason: `${mcCorrect} correct answers (+${mcCorrectBonus} each${streakLabel})`, amount })
      }
      if (mcIncorrect > 0) {
        xpEarned += mcIncorrect * 1
        breakdown.push({ reason: `${mcIncorrect} attempted`, amount: mcIncorrect })
      }

      // FR scoring
      if (frScores && frScores.length > 0) {
        for (const score of frScores) {
          const numerator = parseInt(score.split('/')[0])
          if (numerator === 4) {
            xpEarned += fr4Bonus
            breakdown.push({ reason: `Perfect FR answer (4/4)${streakCount >= 3 ? ' 🔥' : ''}`, amount: fr4Bonus })
          } else if (numerator === 3) {
            xpEarned += fr3Bonus
            breakdown.push({ reason: `Great FR answer (3/4)${streakCount >= 3 ? ' 🔥' : ''}`, amount: fr3Bonus })
          } else if (numerator === 2) {
            xpEarned += fr2Bonus
            breakdown.push({ reason: 'Good FR answer (2/4)', amount: fr2Bonus })
          } else if (numerator === 1) {
            xpEarned += 2
            breakdown.push({ reason: 'FR answer attempted (1/4)', amount: 3 })
          } else {
            xpEarned += 1
            breakdown.push({ reason: 'FR answer attempted (0/4)', amount: 1 })
          }
        }
      }

      // Session completion bonus
      xpEarned += 20
      breakdown.push({ reason: 'Session completed', amount: 20 })

      // High score bonus
      const pct = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
      if (pct >= 90) {
        xpEarned += 25
        breakdown.push({ reason: '90%+ score bonus 🔥', amount: 25 })
      }
    } else {
      // Worksheet created
      xpEarned += 15
      breakdown.push({ reason: 'Worksheet created', amount: 15 })
    }

    // ── Streak calculation ───────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]
    const lastStudy = profile.last_study_date
    let newStreak = profile.streak_count ?? 0
    let streakBonus = 0
    let streakMessage = ''

    if (isFirstSessionToday) {
      if (!lastStudy) {
        newStreak = 1
      } else {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (lastStudy === yesterdayStr) {
          newStreak = (profile.streak_count ?? 0) + 1
        } else if (lastStudy === today) {
          newStreak = profile.streak_count ?? 1
        } else {
          newStreak = 1
        }
      }

      // Streak bonuses
      if (newStreak === 3)       { streakBonus = 15;  streakMessage = '3-day streak bonus!' }
      else if (newStreak === 7)  { streakBonus = 40;  streakMessage = '7-day streak bonus!' }
      else if (newStreak === 14) { streakBonus = 75;  streakMessage = '14-day streak bonus!' }
      else if (newStreak === 30) { streakBonus = 150; streakMessage = '30-day streak!' }
      else if (newStreak > 1)    { streakBonus = 10;  streakMessage = `${newStreak}-day streak!` }

      if (streakBonus > 0) {
        xpEarned += streakBonus
        breakdown.push({ reason: `🔥 ${streakMessage}`, amount: streakBonus })
      }
    }

    // ── Level up check ───────────────────────────────────────────────────
    const oldXP    = profile.xp ?? 0
    const newXP    = oldXP + xpEarned
    const oldLevel = getLevelFromXP(oldXP)
    const newLevel = getLevelFromXP(newXP)
    const didLevelUp = newLevel.level > oldLevel.level
    const nextLevel  = getNextLevel(newLevel.level)

    // ── Bonus generations for free users on level up ──────────────────────
    let bonusGenerationsAdded = 0
    if (didLevelUp && !profile.is_premium) {
      for (let l = oldLevel.level + 1; l <= newLevel.level; l++) {
        if (FREE_LEVEL_REWARDS[l]) {
          bonusGenerationsAdded += FREE_LEVEL_REWARDS[l]
        }
      }
    }

    // ── Update profile ───────────────────────────────────────────────────
    await adminClient
      .from('profiles')
      .update({
        xp: newXP,
        level: newLevel.level,
        streak_count: newStreak,
        last_study_date: isFirstSessionToday ? today : lastStudy,
        bonus_generations: (profile.bonus_generations ?? 0) + bonusGenerationsAdded,
      })
      .eq('id', user.id)

    // Mark this subject+topic+type as completed so XP isn't awarded again.
    await adminClient
      .from('user_xp_history')
      .insert({ user_id: user.id, source_type: sourceType, source_key: sourceKey, xp_earned: xpEarned })

    return NextResponse.json({
      success: true,
      alreadyEarned: false,
      xpEarned,
      breakdown,
      oldXP,
      newXP,
      oldLevel,
      newLevel,
      nextLevel,
      didLevelUp,
      newStreak,
      streakBonus,
      streakMessage,
      bonusGenerationsAdded,
      isPremium: profile.is_premium,
    })
  } catch (error: any) {
    console.error('XP error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}