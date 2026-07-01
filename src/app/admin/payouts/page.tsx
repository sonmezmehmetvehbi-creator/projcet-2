import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AdminNavbar from '../dashboard/AdminNavbar'
import AdminPayoutsClient from './AdminPayoutsClient'

export const revalidate = 0

export default async function AdminPayoutsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Pull everything in bulk, then join in memory (no RLS-friendly FK joins).
  const [
    { data: payoutsRaw },
    { data: tutorsRaw },
    { data: sessionsRaw },
    { data: reportsRaw },
    { data: taxInfoRaw },
  ] = await Promise.all([
    adminClient.from('tutor_payouts').select('*').order('created_at', { ascending: false }),
    adminClient.from('tutor_profiles').select('id, user_id, display_name, venmo, paypal, zelle, w9_collected, status'),
    adminClient.from('tutoring_sessions').select('id, subject, scheduled_at, student_price, tutor_payout, status, created_at'),
    adminClient.from('platform_reports').select('*').order('year', { ascending: true }),
    adminClient.from('tutor_tax_info').select('*'),
  ])

  // Tutor user_id → email lookup
  const tutorUserIds = (tutorsRaw ?? []).map(t => t.user_id).filter(Boolean)
  const emailById = new Map<string, string>()
  const nameById = new Map<string, string>()
  if (tutorUserIds.length > 0) {
    const { data: tutorProfiles } = await adminClient
      .from('profiles')
      .select('id, email, display_name')
      .in('id', tutorUserIds)
    for (const p of (tutorProfiles ?? [])) {
      emailById.set(p.id, p.email)
      if (p.display_name) nameById.set(p.id, p.display_name)
    }
  }

  const tutorById = new Map((tutorsRaw ?? []).map(t => [t.id, t]))
  const sessionById = new Map((sessionsRaw ?? []).map(s => [s.id, s]))

  const paymentHandle = (t: any) =>
    t?.venmo ? `Venmo: ${t.venmo}`
      : t?.paypal ? `PayPal: ${t.paypal}`
        : t?.zelle ? `Zelle: ${t.zelle}` : 'Not set'

  // Enrich payouts with tutor + session info
  const payouts = (payoutsRaw ?? []).map((p) => {
    const t = tutorById.get(p.tutor_id)
    const s = p.session_id ? sessionById.get(p.session_id) : null
    return {
      id: p.id,
      tutor_id: p.tutor_id,
      amount: Number(p.amount ?? 0),
      status: p.status ?? 'pending',
      request_status: p.request_status ?? 'pending',
      requested_at: p.requested_at ?? null,
      paid_at: p.paid_at ?? null,
      created_at: p.created_at ?? null,
      paid_via: p.paid_via ?? null,
      reference_id: p.reference_id ?? null,
      receipt_url: p.receipt_url ?? null,
      notes: p.notes ?? null,
      tutor_name: t?.display_name ?? (t?.user_id && nameById.get(t.user_id)) ?? 'Tutor',
      tutor_email: (t?.user_id && emailById.get(t.user_id)) || '',
      payment_handle: paymentHandle(t),
      venmo: t?.venmo ?? null,
      paypal: t?.paypal ?? null,
      zelle: t?.zelle ?? null,
      session_subject: s?.subject ?? '—',
      session_date: s?.scheduled_at ?? null,
    }
  })

  // Pending payouts via explicit manual joins (status = 'pending').
  const { data: pendingRaw } = await adminClient
    .from('tutor_payouts')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const pendingPayouts = await Promise.all((pendingRaw ?? []).map(async (p) => {
    const { data: tutorProfile } = await adminClient.from('tutor_profiles').select('*').eq('id', p.tutor_id).single()
    const { data: userProfile } = tutorProfile?.user_id
      ? await adminClient.from('profiles').select('email, display_name').eq('id', tutorProfile.user_id).single()
      : { data: null }
    const { data: session } = p.session_id
      ? await adminClient.from('tutoring_sessions').select('subject, scheduled_at').eq('id', p.session_id).single()
      : { data: null }
    return {
      id: p.id,
      tutor_id: p.tutor_id,
      amount: Number(p.amount ?? 0),
      status: p.status ?? 'pending',
      request_status: p.request_status ?? 'pending',
      requested_at: p.requested_at ?? null,
      paid_at: p.paid_at ?? null,
      created_at: p.created_at ?? null,
      paid_via: null,
      reference_id: null,
      receipt_url: null,
      notes: null,
      tutor_name: userProfile?.display_name ?? tutorProfile?.display_name ?? 'Tutor',
      tutor_email: userProfile?.email ?? '',
      payment_handle: paymentHandle(tutorProfile),
      venmo: tutorProfile?.venmo ?? null,
      paypal: tutorProfile?.paypal ?? null,
      zelle: tutorProfile?.zelle ?? null,
      session_subject: session?.subject ?? '—',
      session_date: session?.scheduled_at ?? null,
    }
  }))

  const thisYear = new Date().getFullYear()

  // Per-tutor aggregates
  const tutors = (tutorsRaw ?? []).map((t) => {
    const tp = payouts.filter(p => p.tutor_id === t.id)
    const totalPaid = tp.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
    const totalPending = tp.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
    const earnedThisYear = tp
      .filter(p => p.status === 'paid' && (
        !p.paid_at || new Date(p.paid_at).getFullYear() === thisYear
      ))
      .reduce((sum, p) => sum + p.amount, 0)
    const sessionCount = tp.length
    return {
      id: t.id,
      name: t.display_name ?? 'Tutor',
      email: (t.user_id && emailById.get(t.user_id)) || '',
      status: t.status ?? 'approved',
      venmo: t.venmo ?? null,
      paypal: t.paypal ?? null,
      zelle: t.zelle ?? null,
      payment_handle: paymentHandle(t),
      w9_collected: !!t.w9_collected,
      total_paid: totalPaid,
      total_pending: totalPending,
      earned_this_year: earnedThisYear,
      session_count: sessionCount,
    }
  })

  // Tax info keyed by tutor_id, plus YTD paid earnings per tutor (current calendar year).
  const taxInfoMap: Record<string, any> = {}
  for (const row of (taxInfoRaw ?? [])) taxInfoMap[row.tutor_id] = row

  const ytdEarningsMap: Record<string, number> = {}
  for (const t of tutors) ytdEarningsMap[t.id] = t.earned_this_year

  // Revenue = student payments on sessions that were actually delivered/paid.
  const revenueSessions = (sessionsRaw ?? []).filter(s => ['completed', 'confirmed'].includes(s.status))
  const sessions = revenueSessions.map(s => ({
    id: s.id,
    student_price: Number(s.student_price ?? 0),
    created_at: s.created_at ?? s.scheduled_at ?? null,
    status: s.status,
  }))

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(250,250,247)' }}>
      <AdminNavbar profile={profile} />
      <AdminPayoutsClient
        payouts={payouts}
        pendingPayouts={pendingPayouts}
        tutors={tutors}
        sessions={sessions}
        reports={reportsRaw ?? []}
        thisYear={thisYear}
        taxInfoMap={taxInfoMap}
        ytdEarningsMap={ytdEarningsMap}
      />
    </div>
  )
}
