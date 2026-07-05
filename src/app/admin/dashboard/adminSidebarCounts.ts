import { createClient } from '@supabase/supabase-js'

export interface SidebarCounts {
  applications: number
  disputes: number
  support: number
}

// Small badge counts shown on the admin sidebar. Uses the service-role client
// so counts are accurate regardless of the requesting admin's RLS scope.
export async function getSidebarCounts(): Promise<SidebarCounts> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const [apps, disputes, support] = await Promise.all([
    admin.from('tutor_profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('tutoring_sessions').select('*', { count: 'exact', head: true }).eq('dispute_filed', true),
    admin.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])
  return {
    applications: apps.count ?? 0,
    disputes: disputes.count ?? 0,
    support: support.count ?? 0,
  }
}
