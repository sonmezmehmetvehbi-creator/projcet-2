import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST /api/arena/forge-quiz/join — register the current user as a quiz player.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { quizId, displayName, avatarEmoji = '🎓' } = await request.json()
    if (!quizId) return NextResponse.json({ error: 'Missing quizId' }, { status: 400 })

    const { data: quiz } = await adminClient.from('forge_quizzes').select('id, max_players, play_count').eq('id', quizId).maybeSingle()
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

    // Already joined?
    const { data: existing } = await adminClient
      .from('forge_quiz_players')
      .select('id, is_kicked')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing?.is_kicked) return NextResponse.json({ error: 'kicked', kicked: true }, { status: 403 })

    if (existing) {
      await adminClient
        .from('forge_quiz_players')
        .update({ display_name: displayName || 'Player', avatar_emoji: avatarEmoji })
        .eq('id', existing.id)
      return NextResponse.json({ playerId: existing.id })
    }

    // Enforce max players for new joiners.
    if (quiz.max_players) {
      const { count } = await adminClient
        .from('forge_quiz_players')
        .select('id', { count: 'exact', head: true })
        .eq('quiz_id', quizId)
        .eq('is_kicked', false)
      if ((count ?? 0) >= quiz.max_players) return NextResponse.json({ error: 'quiz_full', full: true }, { status: 403 })
    }

    const { data: player, error } = await adminClient
      .from('forge_quiz_players')
      .insert({ quiz_id: quizId, user_id: user.id, display_name: displayName || 'Player', avatar_emoji: avatarEmoji })
      .select('id')
      .single()
    if (error) throw error

    // A new self-paced playthrough is beginning — bump play_count once (only on
    // first join; re-joins by the same user take the update path above).
    // -- ALTER TABLE forge_quizzes ADD COLUMN IF NOT EXISTS play_count int DEFAULT 0;
    await adminClient.from('forge_quizzes').update({ play_count: (quiz.play_count ?? 0) + 1 }).eq('id', quizId)

    return NextResponse.json({ playerId: player.id })
  } catch (error: any) {
    console.error('Forge quiz join error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
