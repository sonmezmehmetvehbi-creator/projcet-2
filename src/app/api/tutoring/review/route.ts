import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, tutorId, rating, comment, wouldRecommend } = await request.json()

    // SQL — add to tutor_reviews (run manually in Supabase):
    //   ALTER TABLE tutor_reviews ADD COLUMN IF NOT EXISTS would_recommend boolean;
    await supabase.from('tutor_reviews').insert({
      session_id: sessionId,
      student_id: user.id,
      tutor_id: tutorId,
      rating,
      comment,
      would_recommend: wouldRecommend ?? null,
    })

    // Update tutor avg rating
    const { data: reviews } = await supabase.from('tutor_reviews').select('rating').eq('tutor_id', tutorId)
    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      await supabase.from('tutor_profiles').update({
        rating: Math.round(avg * 10) / 10,
        total_reviews: reviews.length,
      }).eq('id', tutorId)
    }

    // Award +15 XP for leaving a review
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level, bonus_generations, is_premium')
      .eq('id', user.id)
      .single()

    if (profile) {
      const LEVELS = [
        { level:1, name:'Freshman', emoji:'📚', xpRequired:0 },
        { level:2, name:'Apprentice', emoji:'✏️', xpRequired:150 },
        { level:3, name:'Scholar', emoji:'🎓', xpRequired:400 },
        { level:4, name:'Analyst', emoji:'🔍', xpRequired:800 },
        { level:5, name:'Achiever', emoji:'⭐', xpRequired:1500 },
        { level:6, name:'Expert', emoji:'🧠', xpRequired:2500 },
        { level:7, name:'Master', emoji:'🏆', xpRequired:4000 },
        { level:8, name:'Prodigy', emoji:'⚡', xpRequired:6000 },
        { level:9, name:'Sage', emoji:'🌟', xpRequired:9000 },
        { level:10, name:'Legend', emoji:'👑', xpRequired:13000 },
      ]
      const FREE_LEVEL_REWARDS: Record<number, number> = { 2:1, 3:2, 5:3, 7:5 }
      const getLevelFromXP = (xp: number) => {
        let current = LEVELS[0]
        for (const l of LEVELS) { if (xp >= l.xpRequired) current = l; else break }
        return current
      }

      const oldXP = profile.xp ?? 0
      const newXP = oldXP + 15
      const oldLevel = getLevelFromXP(oldXP)
      const newLevel = getLevelFromXP(newXP)
      const didLevelUp = newLevel.level > oldLevel.level

      let bonusGenerationsAdded = 0
      if (didLevelUp && !profile.is_premium) {
        for (let l = oldLevel.level + 1; l <= newLevel.level; l++) {
          if (FREE_LEVEL_REWARDS[l]) bonusGenerationsAdded += FREE_LEVEL_REWARDS[l]
        }
      }

      await supabase.from('profiles').update({
        xp: newXP,
        level: newLevel.level,
        bonus_generations: (profile.bonus_generations ?? 0) + bonusGenerationsAdded,
      }).eq('id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
