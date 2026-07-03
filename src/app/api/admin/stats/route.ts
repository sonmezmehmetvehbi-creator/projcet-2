import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

type Range = 'today' | '7days' | '30days' | '3months' | 'year' | 'all'

// Returns the ISO cutoff for a given range, or null for "all time".
function cutoffFor(range: Range): string | null {
  const now = new Date()
  switch (range) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    case '7days':
      return new Date(now.getTime() - 7 * 86400000).toISOString()
    case '30days':
      return new Date(now.getTime() - 30 * 86400000).toISOString()
    case '3months': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 3)
      return d.toISOString()
    }
    case 'year':
      return new Date(now.getFullYear(), 0, 1).toISOString()
    default:
      return null
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const rangeParam = (new URL(request.url).searchParams.get('range') ?? 'all') as Range
    const cutoff = cutoffFor(rangeParam)
    const cutoffDate = cutoff ? cutoff.split('T')[0] : null

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Count helper — applies the created_at cutoff when present.
    const countRows = async (
      table: string,
      build?: (q: any) => any,
    ): Promise<number> => {
      let q = adminClient.from(table).select('*', { count: 'exact', head: true })
      if (build) q = build(q)
      if (cutoff) q = q.gte('created_at', cutoff)
      const { count } = await q
      return count ?? 0
    }

    // "Active" rows in daily_usage use the date column, not created_at.
    const countActive = async (): Promise<number> => {
      let q = adminClient.from('daily_usage').select('*', { count: 'exact', head: true })
      if (cutoffDate) q = q.gte('date', cutoffDate)
      const { count } = await q
      return count ?? 0
    }

    const [
      totalUsers,
      premiumUsers,
      totalSessions,
      totalWorksheets,
      totalQuestions,
      totalTutoringSessions,
      activeToday,
    ] = await Promise.all([
      countRows('profiles'),
      countRows('profiles', q => q.eq('is_premium', true)),
      countRows('sessions'),
      countRows('sessions', q => q.eq('output_type', 'worksheet')),
      countRows('sessions', q => q.eq('output_type', 'questions')),
      countRows('tutoring_sessions'),
      countActive(),
    ])

    // Backlog counts reflect the current state and are not time-scaled.
    const { count: pendingTutors } = await adminClient.from('tutor_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    const { count: openTickets } = await adminClient.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')

    return NextResponse.json({
      range: rangeParam,
      stats: {
        totalUsers,
        premiumUsers,
        activeToday,
        totalSessions,
        totalWorksheets,
        totalQuestions,
        totalTutoringSessions,
        pendingTutors: pendingTutors ?? 0,
        openTickets: openTickets ?? 0,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
