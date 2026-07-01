import { createServerSupabaseClient } from './supabase-server'

// The daily_usage table already exists in Supabase. For reference, its schema is:
//
// -- CREATE TABLE IF NOT EXISTS daily_usage (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   user_id uuid REFERENCES profiles(id),
// --   date date DEFAULT CURRENT_DATE,
// --   questions int DEFAULT 0,
// --   worksheets int DEFAULT 0,
// --   sat int DEFAULT 0,
// --   created_at timestamptz DEFAULT now(),
// --   UNIQUE(user_id, date)
// -- );
// -- ALTER TABLE daily_usage DISABLE ROW LEVEL SECURITY;
//
// Leveling-up bonus generations are stored on profiles.bonus_generations and are
// consumed here once a free user has exhausted their daily allowance.

type ServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

export type GenType = 'questions' | 'worksheets' | 'sat'

// Free-plan daily allowances. Premium users are unlimited.
export const DAILY_LIMITS: Record<GenType, number> = {
  questions: 2,
  worksheets: 2,
  sat: 1,
}

export interface GenCheck {
  isPremium: boolean
  allowed: boolean
  used: number
  limit: number
  bonus: number
  usedBonus: boolean
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Determine whether a user may generate content of the given type.
 * Premium users are always allowed. Free users are allowed while they are
 * under the daily limit; once exhausted, a leveling-up bonus generation is
 * used if one is available. usedBonus signals that commitGeneration should
 * decrement profiles.bonus_generations.
 */
export async function checkGenerationAllowed(
  supabase: ServerClient,
  userId: string,
  type: GenType
): Promise<GenCheck> {
  const limit = DAILY_LIMITS[type]

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, bonus_generations')
    .eq('id', userId)
    .single()

  const isPremium = !!profile?.is_premium
  const bonus = (profile?.bonus_generations as number) ?? 0

  if (isPremium) {
    return { isPremium, allowed: true, used: 0, limit, bonus, usedBonus: false }
  }

  const { data: usage } = await supabase
    .from('daily_usage')
    .select('questions, worksheets, sat')
    .eq('user_id', userId)
    .eq('date', today())
    .single()

  const used = ((usage as any)?.[type] as number) ?? 0

  if (used < limit) {
    return { isPremium, allowed: true, used, limit, bonus, usedBonus: false }
  }
  // Daily allowance exhausted — fall back to leveling-up bonus generations.
  if (bonus > 0) {
    return { isPremium, allowed: true, used, limit, bonus, usedBonus: true }
  }
  return { isPremium, allowed: false, used, limit, bonus, usedBonus: false }
}

/**
 * Record a successful generation for a free user: increment today's usage
 * counter and, if a bonus generation was consumed, decrement it on the profile.
 * Should not be called for premium users (they are untracked/unlimited).
 */
export async function commitGeneration(
  supabase: ServerClient,
  userId: string,
  type: GenType,
  usedBonus: boolean
): Promise<void> {
  const { data: existing } = await supabase
    .from('daily_usage')
    .select('id, questions, worksheets, sat')
    .eq('user_id', userId)
    .eq('date', today())
    .single()

  if (existing) {
    const current = ((existing as any)[type] as number) ?? 0
    await supabase
      .from('daily_usage')
      .update({ [type]: current + 1 })
      .eq('id', (existing as any).id)
  } else {
    await supabase
      .from('daily_usage')
      .insert({ user_id: userId, date: today(), [type]: 1 })
  }

  if (usedBonus) {
    const { data: p } = await supabase
      .from('profiles')
      .select('bonus_generations')
      .eq('id', userId)
      .single()
    const remaining = Math.max(0, ((p?.bonus_generations as number) ?? 0) - 1)
    await supabase.from('profiles').update({ bonus_generations: remaining }).eq('id', userId)
  }
}
