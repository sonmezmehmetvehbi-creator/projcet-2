import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId } = await request.json()

    const { data: session } = await supabase
      .from('tutoring_sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId)
      .select()
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Create payout record — pending for 24hrs
    await supabase.from('tutor_payouts').insert({
      tutor_id: session.tutor_id,
      session_id: sessionId,
      amount: session.tutor_payout,
      status: 'pending',
    })

    // Create notification for student to leave review
    await supabase.from('notifications').insert({
      user_id: session.student_id,
      type: 'review_request',
      title: 'How was your session?',
      message: 'Your tutoring session is complete. Leave a review for your tutor!',
      link: `/tutoring/session/${sessionId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}