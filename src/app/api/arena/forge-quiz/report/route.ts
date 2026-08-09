import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/report — a logged-in user flags a public quiz for
// admin review. Feeds the admin Reports interface (see /admin/reports).
//
// A user can only have one open report per quiz: we upsert on (quiz_id,
// reporter_id) so re-submitting just refreshes the reason/details rather than
// piling up duplicates. The client also disables the button after reporting.
//
// -- CREATE TABLE IF NOT EXISTS forge_quiz_reports (
// --   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
// --   quiz_id uuid REFERENCES forge_quizzes(id),
// --   reporter_id uuid REFERENCES profiles(id),
// --   reason text NOT NULL,
// --   details text,
// --   status text DEFAULT 'pending',
// --   created_at timestamptz DEFAULT now(),
// --   UNIQUE (quiz_id, reporter_id)
// -- );
// -- ALTER TABLE forge_quiz_reports DISABLE ROW LEVEL SECURITY;

const VALID_REASONS = [
  'Inappropriate content',
  'Spam',
  'Incorrect/misleading information',
  'Copyright violation',
  'Other',
]

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId, reason, details } = await request.json()
    if (!quizId || typeof quizId !== 'string') {
      return NextResponse.json({ error: 'Missing quizId' }, { status: 400 })
    }
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
    }

    // Quiz must exist. Reporting your own quiz is pointless but harmless — block
    // it to avoid noise in the admin queue.
    const { data: quiz } = await adminClient.from('forge_quizzes').select('id, creator_id').eq('id', quizId).maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    if (quiz.creator_id === user.id) return NextResponse.json({ error: 'You cannot report your own quiz' }, { status: 400 })

    const { error } = await adminClient
      .from('forge_quiz_reports')
      .upsert(
        {
          quiz_id: quizId,
          reporter_id: user.id,
          reason,
          details: typeof details === 'string' && details.trim() ? details.trim().slice(0, 2000) : null,
          status: 'pending',
        },
        { onConflict: 'quiz_id,reporter_id' },
      )
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forge quiz report error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
