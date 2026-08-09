import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// PATCH /api/admin/update-quiz-report — admin actions a Forge Quiz report.
// Mirrors /api/admin/update-report (tutor reports) for status changes, and adds
// two moderation actions that operate on the reported quiz itself:
//   action: 'make_private' → force the public quiz back to private
//   action: 'delete_quiz'  → hard-delete the quiz (FK-safe, same order as the
//                            creator-facing /api/arena/forge-quiz/delete route)
const ALLOWED_STATUS = ['pending', 'reviewed', 'action_taken', 'dismissed']

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { reportId, status, action } = await request.json()
    if (!reportId) return NextResponse.json({ error: 'Missing reportId' }, { status: 400 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: report } = await adminClient.from('forge_quiz_reports').select('id, quiz_id').eq('id', reportId).maybeSingle()
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

    // Moderation action on the underlying quiz, if requested.
    let quizDeleted = false
    if (action === 'make_private') {
      const { error } = await adminClient.from('forge_quizzes').update({ is_public: false }).eq('id', report.quiz_id)
      if (error) throw error
    } else if (action === 'delete_quiz') {
      const quizId = report.quiz_id
      const { data: sessions } = await adminClient.from('forge_quiz_live_sessions').select('id').eq('quiz_id', quizId)
      const sessionIds = (sessions ?? []).map((s: any) => s.id)
      if (sessionIds.length > 0) {
        await adminClient.from('forge_quiz_live_answers').delete().in('session_id', sessionIds)
        await adminClient.from('forge_quiz_live_players').delete().in('session_id', sessionIds)
        await adminClient.from('forge_quiz_live_sessions').delete().eq('quiz_id', quizId)
      }
      await adminClient.from('forge_quiz_players').delete().eq('quiz_id', quizId)
      await adminClient.from('forge_quiz_questions').delete().eq('quiz_id', quizId)
      await adminClient.from('forge_quiz_ratings').delete().eq('quiz_id', quizId)
      await adminClient.from('forge_quiz_stars').delete().eq('quiz_id', quizId)
      const { error } = await adminClient.from('forge_quizzes').delete().eq('id', quizId)
      if (error) throw error
      quizDeleted = true
    } else if (action !== undefined) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Status update. A moderation action implies the report was actioned.
    const nextStatus = status ?? (action ? 'action_taken' : undefined)
    if (nextStatus !== undefined) {
      if (!ALLOWED_STATUS.includes(nextStatus)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      const { error } = await adminClient.from('forge_quiz_reports').update({ status: nextStatus }).eq('id', reportId)
      if (error) throw error
    }

    return NextResponse.json({ success: true, status: nextStatus, quizDeleted })
  } catch (error: any) {
    console.error('Update quiz report error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
