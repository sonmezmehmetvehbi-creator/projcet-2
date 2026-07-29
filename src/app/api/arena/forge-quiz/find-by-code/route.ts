import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/arena/forge-quiz/find-by-code?code=XXXXXX
// Resolves a join code to a quiz (active, non-expired).
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const code = (new URL(request.url).searchParams.get('code') || '').trim().toUpperCase()
    if (!code) return NextResponse.json({ error: 'Quiz not found or expired' }, { status: 404 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: quiz } = await adminClient
      .from('forge_quizzes')
      .select('id, title, play_mode, status, expires_at')
      .eq('room_code', code)
      .neq('status', 'ended')
      .maybeSingle()

    if (!quiz) return NextResponse.json({ error: 'Quiz not found or expired' }, { status: 404 })

    // Self-paced quizzes can also expire by time.
    if (quiz.expires_at && new Date(quiz.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Quiz not found or expired' }, { status: 404 })
    }

    return NextResponse.json({ quizId: quiz.id, title: quiz.title, mode: quiz.play_mode })
  } catch (error: any) {
    console.error('Forge quiz find-by-code error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
