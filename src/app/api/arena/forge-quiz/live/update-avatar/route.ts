import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// PATCH /api/arena/forge-quiz/live/update-avatar — player re-picks their avatar
// while waiting. { sessionId, avatarEmoji }
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { sessionId, avatarEmoji } = await request.json()
    if (!sessionId || !avatarEmoji) return NextResponse.json({ error: 'Missing sessionId or avatarEmoji' }, { status: 400 })

    const { error } = await adminClient
      .from('forge_quiz_live_players')
      .update({ avatar_emoji: String(avatarEmoji).slice(0, 8) })
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forge quiz live update-avatar error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
