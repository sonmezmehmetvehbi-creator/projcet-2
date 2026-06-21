import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Recomputes the "Top Tutor" flag for every tutor: avg rating >= 4.8 over at
// least 10 reviews. Safe to call repeatedly (fire-and-forget from dashboard).
export async function GET() {
  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: tutors } = await adminClient
      .from('tutor_profiles')
      .select('id, is_top_tutor')

    let updated = 0

    for (const tutor of (tutors ?? [])) {
      const { data: reviews } = await adminClient
        .from('tutor_reviews')
        .select('rating')
        .eq('tutor_id', tutor.id)

      const count = reviews?.length ?? 0
      const avg = count > 0 ? reviews!.reduce((sum, r) => sum + r.rating, 0) / count : 0
      const isTop = avg >= 4.8 && count >= 10

      if (isTop !== !!tutor.is_top_tutor) {
        await adminClient.from('tutor_profiles').update({ is_top_tutor: isTop }).eq('id', tutor.id)
        updated++
      }
    }

    return NextResponse.json({ success: true, updated })
  } catch (error: any) {
    console.error('top-tutor-sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
