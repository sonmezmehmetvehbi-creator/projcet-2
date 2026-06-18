import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Persists a tutor's active/inactive status. Uses the service-role client so
// the update isn't blocked by row-level security, but verifies the tutor
// profile belongs to the authenticated user first.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tutorId, isActive } = await request.json()
    if (!tutorId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Missing tutorId or isActive' }, { status: 400 })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Ensure the tutor profile belongs to the logged-in user.
    const { data: tutorProfile } = await adminClient
      .from('tutor_profiles')
      .select('id, user_id')
      .eq('id', tutorId)
      .single()

    if (!tutorProfile || tutorProfile.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await adminClient
      .from('tutor_profiles')
      .update({ is_active: isActive })
      .eq('id', tutorId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, isActive })
  } catch (error: any) {
    console.error('toggle-active error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
