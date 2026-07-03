import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ALLOWED_STATUS = ['pending', 'reviewed', 'action_taken', 'dismissed']

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { reportId, status, adminNotes } = await request.json()
    if (!reportId) return NextResponse.json({ error: 'Missing reportId' }, { status: 400 })

    const update: Record<string, any> = {}
    if (status !== undefined) {
      if (!ALLOWED_STATUS.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      update.status = status
    }
    if (adminNotes !== undefined) update.admin_notes = adminNotes

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await adminClient.from('tutor_reports').update(update).eq('id', reportId).select().single()
    if (error) throw error

    return NextResponse.json({ success: true, report: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
