import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

// Bonus generations awarded at level up for free users
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

    const {
      correctAnswers,
      totalAnswers,
      frScores, // array of strings like ["4/4", "2/4", "0/4"]
      outputType, // 'questions' or 'worksheet'
      isFirstSessionToday,
    } = await request.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level, streak_count, last_study_date, is_premium, bonus_generations')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // ── Calculate XP earned ──────────────────────────────────────────────

    let xpEarned = 0
    const breakdown: { reason: string; amount: number }[] = []

    if (outputType === 'questions') {
      // +5 per correct MC, +1 per incorrect
      const mcCorrect = correctAnswers ?? 0
      const mcIncorrect = (totalAnswers ?? 0) - mcCorrect - (frScores?.length ?? 0)
      if (mcCorrect > 0) {
        xpEarned += mcCorrect * 5
        breakdown.push({ reason: `${mcCorrect} correct answers`, amount: mcCorrect * 5 })
      }
      if (mcIncorrect > 0) {
        xpEarned += mcIncorrect * 1
        breakdown.push({ reason: `${mcIncorrect} attempted`, amount: mcIncorrect })
      }

      // FR scoring
      if (frScores && frScores.length > 0) {
        for (const score of frScores) {
          xpEarned += 8 // base for submitting
          const numerator = parseInt(score.split('/')[0])
          if (numerator === 4) {
            xpEarned += 15
            breakdown.push({ reason: 'Perfect FR answer (4/4)', amount: 23 })
          } else if (numerator === 3) {
            xpEarned += 8
            breakdown.push({ reason: 'Great FR answer (3/4)', amount: 16 })
          } else if (numerator === 2) {
            breakdown.push({ reason: 'FR answer submitted (2/4)', amount: 8 })
          } else if (numerator === 1) {
            breakdown.push({ reason: 'FR answer submitted (1/4)', amount: 8 })
          } else {
            breakdown.push({ reason: 'FR answer submitted', amount: 8 })
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
          newStreak = 1 // reset
        }
      }

      // Streak bonuses
      if (newStreak === 3) { streakBonus = 15; streakMessage = '3-day streak bonus!' }
      else if (newStreak === 7) { streakBonus = 40; streakMessage = '7-day streak bonus!' }
      else if (newStreak === 30) { streakBonus = 150; streakMessage = '30-day streak!' }
      else if (newStreak > 1) { streakBonus = 10; streakMessage = `${newStreak}-day streak!` }

      if (streakBonus > 0) {
        xpEarned += streakBonus
        breakdown.push({ reason: streakMessage, amount: streakBonus })
      }
    }

    // ── Level up check ───────────────────────────────────────────────────

    const oldXP = profile.xp ?? 0
    const newXP = oldXP + xpEarned
    const oldLevel = getLevelFromXP(oldXP)
    const newLevel = getLevelFromXP(newXP)
    const didLevelUp = newLevel.level > oldLevel.level
    const nextLevel = getNextLevel(newLevel.level)

    // ── Bonus generations for free users ─────────────────────────────────

    let bonusGenerationsAdded = 0
    if (didLevelUp && !profile.is_premium) {
      for (let l = oldLevel.level + 1; l <= newLevel.level; l++) {
        if (FREE_LEVEL_REWARDS[l]) {
          bonusGenerationsAdded += FREE_LEVEL_REWARDS[l]
        }
      }
    }

    // ── Update profile ───────────────────────────────────────────────────

    await supabase
      .from('profiles')
      .update({
        xp: newXP,
        level: newLevel.level,
        streak_count: newStreak,
        last_study_date: isFirstSessionToday ? today : lastStudy,
        bonus_generations: (profile.bonus_generations ?? 0) + bonusGenerationsAdded,
      })
      .eq('id', user.id)

    return NextResponse.json({
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