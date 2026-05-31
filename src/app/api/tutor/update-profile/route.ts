import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bio, subjects, languages, hourlyRate, availability, timezone, tutorId, venmo, paypal, zelle } = await request.json()

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if custom rate should be unlocked
    const { data: tutorProfile } = await adminClient
      .from('tutor_profiles')
      .select('rating, total_sessions, custom_rate')
      .eq('id', tutorId)
      .single()

    const completedCount = await adminClient
      .from('tutoring_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutorId)
      .eq('status', 'completed')

    const shouldUnlockCustomRate =
      !tutorProfile?.custom_rate &&
      (completedCount.count ?? 0) >= 10 &&
      (tutorProfile?.rating ?? 0) >= 4.5

    await adminClient.from('tutor_profiles').update({
      bio,
      subjects,
      languages,
      venmo: venmo || null,
      paypal: paypal || null,
      zelle: zelle || null,
      ...(shouldUnlockCustomRate ? { custom_rate: true } : {}),
      ...(shouldUnlockCustomRate ? { hourly_rate: hourlyRate } : {}),
    }).eq('id', tutorId)

    // Update availability
    await adminClient.from('tutor_availability').delete().eq('tutor_id', tutorId)
    if (availability && availability.length > 0) {
      await adminClient.from('tutor_availability').insert(
        availability.map((a: any) => ({
          tutor_id: tutorId,
          day_of_week: a.day_of_week,
          start_time: a.start_time,
          end_time: a.end_time,
          timezone,
        }))
      )
    }

    return NextResponse.json({ success: true, customRateUnlocked: shouldUnlockCustomRate })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
