import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import StudentThemeShell from '@/app/contexts/StudentThemeShell'
import WorksheetClient from './WorksheetClient'

export default async function WorksheetPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: session } = await supabase.from('sessions').select('*').eq('id', params.sessionId).eq('user_id', user.id).single()

  if (!session) redirect('/dashboard')

  return (
    <StudentThemeShell>
      <Navbar profile={profile} />
      <WorksheetClient session={session} />
    </StudentThemeShell>
  )
}