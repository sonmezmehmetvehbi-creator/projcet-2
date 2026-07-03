import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getUserBans } from '@/lib/bans'
import { NextResponse } from 'next/server'

// Returns the current user's active feature-ban flags, for client components
// (e.g. the generate page) that render the Navbar but can't run service-role
// queries themselves.
export async function GET() {
  const empty = { generation: false, tutoring: false, support: false }
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(empty)

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const bans = await getUserBans(user.id, adminClient)
    return NextResponse.json(bans)
  } catch {
    return NextResponse.json(empty)
  }
}
