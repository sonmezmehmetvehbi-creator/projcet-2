import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminNavbar from '../dashboard/AdminNavbar'
import AdminTutorsClient from './AdminTutorsClient'

export default async function AdminTutorsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: applications } = await supabase
    .from('tutor_profiles')
    .select('*, profiles!tutor_profiles_user_id_fkey(email, display_name)')
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <AdminNavbar profile={profile} />
      <AdminTutorsClient applications={applications ?? []} />
    </div>
  )
}