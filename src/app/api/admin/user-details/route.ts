import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Aggregates everything the admin user-detail panel needs (bans, notes, and
// the History tab). Each query is isolated so a not-yet-created table
// (user_bans / admin_notes) degrades to an empty list instead of failing.
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: caller } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!caller?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const userId = new URL(request.url).searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const safe = async <T>(p: PromiseLike<{ data: T | null }>): Promise<T | []> => {
      try {
        const { data } = await p
        return (data ?? []) as T | []
      } catch {
        return []
      }
    }

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

    const [profileRes, bans, notes, tickets, disputes, generations] = await Promise.all([
      (async () => {
        try {
          const { data } = await adminClient.from('profiles').select('streak_count, bonus_generations, is_banned, xp, level, is_premium').eq('id', userId).single()
          return data
        } catch { return null }
      })(),
      safe(adminClient.from('user_bans').select('*').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false })),
      safe(adminClient.from('admin_notes').select('*').eq('user_id', userId).order('created_at', { ascending: false })),
      safe(adminClient.from('support_tickets').select('id, subject, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)),
      safe(adminClient.from('tutoring_sessions').select('id, subject, dispute_status, created_at').eq('student_id', userId).not('dispute_status', 'is', null).order('created_at', { ascending: false })),
      safe(adminClient.from('daily_usage').select('date, questions, worksheets, sat').eq('user_id', userId).gte('date', weekAgo).order('date', { ascending: false })),
    ])

    return NextResponse.json({
      profile: profileRes,
      bans,
      notes,
      tickets,
      disputes,
      generations,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
