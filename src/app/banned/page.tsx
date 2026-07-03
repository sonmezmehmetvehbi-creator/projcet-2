import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export default async function BannedPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let ban: any = null
  try {
    const { data } = await adminClient
      .from('user_bans')
      .select('reason, expires_at, is_permanent')
      .eq('user_id', user.id)
      .eq('ban_type', 'full_account_ban')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    ban = data
  } catch {}

  // No active ban → nothing to see here.
  if (!ban || (!ban.is_permanent && ban.expires_at && new Date(ban.expires_at) <= new Date())) {
    redirect('/dashboard')
  }

  const expiryText = ban.is_permanent || !ban.expires_at
    ? 'permanently'
    : `until ${new Date(ban.expires_at).toLocaleString()}`

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'linear-gradient(135deg, #f7ecec, #f5e3e3)' }}>
      <div style={{ maxWidth: '32rem', width: '100%', background: 'white', borderRadius: '1.25rem', padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(163,45,45,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'rgb(163,45,45)', marginBottom: '0.75rem' }}>
          Your account has been suspended
        </h1>
        <p style={{ color: 'rgb(107,107,88)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Your access to AceForge has been suspended {expiryText}.
        </p>
        <div style={{ padding: '1rem 1.25rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.05)', border: '1px solid rgba(163,45,45,0.15)', textAlign: 'left', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgb(163,45,45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Reason</p>
          <p style={{ fontSize: '0.9375rem', color: 'rgb(26,26,20)', lineHeight: 1.6 }}>{ban.reason}</p>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)' }}>
          If you believe this is a mistake, contact <a href="mailto:support@aceforge.app" style={{ color: 'rgb(34,85,14)', fontWeight: 600 }}>support</a>.
        </p>
      </div>
    </div>
  )
}
