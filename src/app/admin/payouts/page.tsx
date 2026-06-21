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

  const { data: payoutsRaw } = await adminClient
    .from('tutor_payouts')
    .select('*')
    .eq('request_status', 'processing')
    .order('requested_at', { ascending: false })

  // Two-query lookup for tutor name + payout method (no RLS joins).
  const payouts = await Promise.all((payoutsRaw ?? []).map(async (p) => {
    const { data: tutor } = await adminClient
      .from('tutor_profiles')
      .select('display_name, venmo, paypal, zelle')
      .eq('id', p.tutor_id)
      .single()
    const method = tutor?.venmo ? `Venmo: ${tutor.venmo}`
      : tutor?.paypal ? `PayPal: ${tutor.paypal}`
        : tutor?.zelle ? `Zelle: ${tutor.zelle}` : 'Not set'
    return { ...p, tutor_name: tutor?.display_name ?? 'Tutor', method }
  }))

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(250,250,247)' }}>
      <AdminNavbar profile={profile} />
      <AdminPayoutsClient payouts={payouts} />
    </div>
  )
}
