import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import StudentThemeShell from '@/app/contexts/StudentThemeShell'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (profile?.is_admin) redirect('/admin/dashboard')
  if (profile?.role === 'tutor_pending') redirect('/tutor/apply')
  if (profile?.role === 'tutor') redirect('/tutor/dashboard')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const today = new Date().toISOString().split('T')[0]
  const { data: usage } = await supabase
    .from('daily_usage')
    .select('questions, worksheets, sat')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  return (
    <StudentThemeShell>
      <Navbar profile={profile} />
      <DashboardClient
        profile={profile}
        sessions={sessions ?? []}
        usage={{ questions: usage?.questions ?? 0, worksheets: usage?.worksheets ?? 0, sat: usage?.sat ?? 0 }}
      />
    </StudentThemeShell>
  )
}