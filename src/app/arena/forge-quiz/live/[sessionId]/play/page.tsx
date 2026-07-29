import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

// Placeholder — the live player game view is built in the next prompt.
export default async function LivePlayPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'white' }}>
      <div style={{ fontSize: '3rem' }}>⚡</div>
      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 800 }}>Game starting…</p>
      <p style={{ color: 'rgb(148,148,168)', fontSize: '0.9375rem' }}>Get ready!</p>
    </div>
  )
}
