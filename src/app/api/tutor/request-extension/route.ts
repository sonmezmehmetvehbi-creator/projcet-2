import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Tutor logs that a session ran over by some minutes. Free (<=20 min or chosen
// free) records a 0 charge; paid records a charge for the student to approve.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, extraMinutes, type } = await request.json()
    const minutes = Math.max(0, Math.round(Number(extraMinutes) || 0))
    if (!sessionId || minutes <= 0) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session } = await adminClient
      .from('tutoring_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const { data: tutorProfile } = await adminClient
      .from('tutor_profiles')
      .select('user_id, hourly_rate, display_name')
      .eq('id', session.tutor_id)
      .single()
    if (!tutorProfile || tutorProfile.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // <=20 min is always free; otherwise honor the tutor's choice.
    const isPaid = type === 'paid' && minutes > 20
    const charge = isPaid
      ? Math.round((minutes / 60) * (tutorProfile.hourly_rate ?? 0) * 100) / 100
      : 0

    const { error } = await adminClient
      .from('tutoring_sessions')
      .update({
        extended_minutes: minutes,
        extension_status: 'pending',
        extension_extra_charge: charge,
      })
      .eq('id', sessionId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify the student.
    await adminClient.from('notifications').insert({
      user_id: session.student_id,
      type: 'session_extension',
      title: '⏱ Session ran over',
      message: charge > 0
        ? `Your tutor ran the session ${minutes} extra minutes — +$${charge.toFixed(2)}. Please respond.`
        : `Your tutor ran the session ${minutes} extra minutes — free. Please respond.`,
      link: `/tutoring/session/${sessionId}`,
    })

    return NextResponse.json({ success: true, charge })
  } catch (error: any) {
    console.error('request-extension error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
