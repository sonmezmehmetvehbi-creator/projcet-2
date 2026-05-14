import { createServerSupabaseClient } from './supabase-server'

export async function checkDailyLimit(
  userId: string,
  type: 'questions' | 'worksheets'
): Promise<{ allowed: boolean; used: number }> {
  const supabase = await createServerSupabaseClient()

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('daily_usage')
    .select('questions, worksheets')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const used = data ? data[type] : 0
  return { allowed: used < 2, used }
}

export async function incrementUsage(
  userId: string,
  type: 'questions' | 'worksheets'
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const today = new Date().toISOString().split('T')[0]

  await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_date: today,
    p_type: type,
  })
}