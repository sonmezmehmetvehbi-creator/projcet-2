import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AdminNavbar from '../dashboard/AdminNavbar'
import AdminAppealsClient from './AdminAppealsClient'

export default async function AdminAppealsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: appeals } = await adminClient
    .from('tutor_appeals')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(250,250,247)' }}>
      <AdminNavbar profile={profile} />
      <AdminAppealsClient appeals={appeals ?? []} />
    </div>
  )
}
