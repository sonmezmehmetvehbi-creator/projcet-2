
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, tutorId, rating, comment } = await request.json()

    await supabase.from('tutor_reviews').insert({
      session_id: sessionId,
      student_id: user.id,
      tutor_id: tutorId,
      rating,
      comment,
    })

    // Update tutor rating
    const { data: reviews } = await supabase.from('tutor_reviews').select('rating').eq('tutor_id', tutorId)
    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      await supabase.from('tutor_profiles').update({ rating: Math.round(avg * 10) / 10, total_reviews: reviews.length }).eq('id', tutorId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}