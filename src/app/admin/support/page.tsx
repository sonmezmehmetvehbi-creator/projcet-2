import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminNavbar from '../dashboard/AdminNavbar'
import AdminSupportClient from './AdminSupportClient'

export default async function AdminSupportPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*, profiles!support_tickets_user_id_fkey(display_name, email, avatar_url)')
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <AdminNavbar profile={profile} />
      <AdminSupportClient tickets={tickets ?? []} currentUserId={user.id} />
    </div>
  )
}
