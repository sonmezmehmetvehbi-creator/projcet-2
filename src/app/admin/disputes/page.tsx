import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminNavbar from '../dashboard/AdminNavbar'
import AdminDisputesClient from './AdminDisputesClient'

export default async function AdminDisputesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: disputes } = await supabase
    .from('tutoring_sessions')
    .select('*, tutor_profiles(display_name), profiles!tutoring_sessions_student_id_fkey(display_name, email)')
    .eq('dispute_filed', true)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <AdminNavbar profile={profile} />
      <AdminDisputesClient disputes={disputes ?? []} />
    </div>
  )
}
