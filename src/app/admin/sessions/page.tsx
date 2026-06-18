import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import AdminNavbar from '../dashboard/AdminNavbar'
import AdminSessionsClient from './AdminSessionsClient'

export const dynamic = 'force-dynamic'

export default async function AdminSessionsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all sessions, then resolve student + tutor profiles via manual
  // lookups (the embedded FK joins were unreliable on this table).
  const { data: sessionsRaw } = await adminClient
    .from('tutoring_sessions')
    .select('*')
    .order('scheduled_at', { ascending: false })

  const sessions = sessionsRaw ?? []

  const studentIds = Array.from(new Set(sessions.map(s => s.student_id).filter(Boolean)))
  const tutorIds = Array.from(new Set(sessions.map(s => s.tutor_id).filter(Boolean)))

  const { data: students } = studentIds.length
    ? await adminClient.from('profiles').select('id, display_name, email').in('id', studentIds)
    : { data: [] as any[] }

  // tutor_id on a session points at tutor_profiles.id
  const { data: tutorProfiles } = tutorIds.length
    ? await adminClient.from('tutor_profiles').select('id, display_name, user_id').in('id', tutorIds)
    : { data: [] as any[] }

  const tutorUserIds = Array.from(new Set((tutorProfiles ?? []).map(t => t.user_id).filter(Boolean)))
  const { data: tutorUsers } = tutorUserIds.length
    ? await adminClient.from('profiles').select('id, email').in('id', tutorUserIds)
    : { data: [] as any[] }

  const studentMap = new Map((students ?? []).map(s => [s.id, s]))
  const tutorUserMap = new Map((tutorUsers ?? []).map(t => [t.id, t]))
  const tutorMap = new Map((tutorProfiles ?? []).map(t => [t.id, {
    display_name: t.display_name,
    email: tutorUserMap.get(t.user_id)?.email ?? null,
  }]))

  const enriched = sessions.map(s => ({
    ...s,
    student: studentMap.get(s.student_id) ?? null,
    tutor: tutorMap.get(s.tutor_id) ?? null,
  }))

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(250,250,247)' }}>
      <AdminNavbar profile={profile} />
      <AdminSessionsClient sessions={enriched} />
    </div>
  )
}
