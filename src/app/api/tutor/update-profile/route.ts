import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bio, subjects, hourlyRate, availability, timezone, tutorId } = await request.json()

    await supabase.from('tutor_profiles').update({ bio, subjects, hourly_rate: hourlyRate }).eq('id', tutorId)

    await supabase.from('tutor_availability').delete().eq('tutor_id', tutorId)
    if (availability.length > 0) {
      await supabase.from('tutor_availability').insert(
        availability.map((a: any) => ({
          tutor_id: tutorId,
          day_of_week: a.day_of_week,
          start_time: a.start_time,
          end_time: a.end_time,
          timezone,
        }))
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}