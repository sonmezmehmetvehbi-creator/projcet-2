import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Returns weekly (last 7 days) and monthly (last 6 months) earnings buckets for
// the logged-in tutor, for the dashboard chart.
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: tutorProfile } = await adminClient
      .from('tutor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!tutorProfile) return NextResponse.json({ weekly: [], monthly: [] })

    const { data: payouts } = await adminClient
      .from('tutor_payouts')
      .select('amount, created_at')
      .eq('tutor_id', tutorProfile.id)

    const rows = payouts ?? []
    const now = new Date()

    // Weekly — last 7 days
    const weekly: { label: string; amount: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const label = d.toLocaleDateString('en-US', { weekday: 'short' })
      const amount = rows
        .filter(r => r.created_at && new Date(r.created_at).toDateString() === d.toDateString())
        .reduce((sum, r) => sum + (r.amount ?? 0), 0)
      weekly.push({ label, amount: Math.round(amount * 100) / 100 })
    }

    // Monthly — last 6 months
    const monthly: { label: string; amount: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('en-US', { month: 'short' })
      const amount = rows
        .filter(r => {
          if (!r.created_at) return false
          const rd = new Date(r.created_at)
          return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth()
        })
        .reduce((sum, r) => sum + (r.amount ?? 0), 0)
      monthly.push({ label, amount: Math.round(amount * 100) / 100 })
    }

    return NextResponse.json({ weekly, monthly })
  } catch (error: any) {
    console.error('earnings error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
