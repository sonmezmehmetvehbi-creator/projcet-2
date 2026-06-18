import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'



export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { sessionId } = await request.json()

    // Update the session, then fetch the student profile separately — the
    // embedded FK join was failing with "Could not find a relationship".
    const { data: session } = await adminClient
      .from('tutoring_sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId)
      .select('*')
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const { data: studentProfile } = await adminClient
      .from('profiles')
      .select('email, display_name, xp, level, streak_count, last_study_date, is_premium, bonus_generations')
      .eq('id', session.student_id)
      .single()

    // Create payout record
    await adminClient.from('tutor_payouts').insert({
      tutor_id: session.tutor_id,
      session_id: sessionId,
      amount: session.tutor_payout,
      status: 'pending',
    })

    // Award XP to student based on session length
    const xpByLength: Record<number, number> = { 30: 50, 60: 100, 90: 150 }
    const sessionXP = xpByLength[session.session_length] ?? 100

    // Check if this is student's first tutoring session
    const { data: prevSessions } = await adminClient
      .from('tutoring_sessions')
      .select('id')
      .eq('student_id', session.student_id)
      .eq('status', 'completed')
      .neq('id', sessionId)

    const isFirstSession = !prevSessions || prevSessions.length === 0
    const bonusXP = isFirstSession ? 25 : 0

    if (studentProfile) {
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

      const totalXP = sessionXP + bonusXP
      const oldXP = studentProfile.xp ?? 0
      const newXP = oldXP + totalXP

      const getLevelFromXP = (xp: number) => {
        let current = LEVELS[0]
        for (const l of LEVELS) { if (xp >= l.xpRequired) current = l; else break }
        return current
      }

      const oldLevel = getLevelFromXP(oldXP)
      const newLevel = getLevelFromXP(newXP)
      const didLevelUp = newLevel.level > oldLevel.level

      let bonusGenerationsAdded = 0
      if (didLevelUp && !studentProfile.is_premium) {
        for (let l = oldLevel.level + 1; l <= newLevel.level; l++) {
          if (FREE_LEVEL_REWARDS[l]) bonusGenerationsAdded += FREE_LEVEL_REWARDS[l]
        }
      }

      await adminClient.from('profiles').update({
        xp: newXP,
        level: newLevel.level,
        bonus_generations: (studentProfile.bonus_generations ?? 0) + bonusGenerationsAdded,
      }).eq('id', session.student_id)

      // In-app notification for student with XP info — wrapped so a missing
      // notifications table doesn't break the whole completion request.
      try {
        await adminClient.from('notifications').insert({
          user_id: session.student_id,
          type: 'session_complete',
          title: `Session complete! +${totalXP} XP earned 🎓`,
          message: `Your tutoring session is complete.${isFirstSession ? ' First session bonus: +25 XP!' : ''} Leave a review to earn +15 more XP.`,
          link: `/tutoring/session/${sessionId}`,
        })
      } catch (e: any) {
        console.error('Notification insert error:', e?.message)
      }

      // Email student
      await resend.emails.send({
        from: 'AceForge <onboarding@resend.dev>',
        to: studentProfile.email,
        subject: `🎓 Session Complete! You earned +${totalXP} XP`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">Session Complete! 🎓</h2>
            <p>Hi ${studentProfile.display_name?.split(' ')[0] ?? 'there'},</p>
            <p>Your tutoring session has been marked as complete.</p>
            <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
              <p style="font-size:1.25rem;font-weight:700;color:#22550e;margin:0">+${totalXP} XP earned! ${didLevelUp ? '🎉 Level Up!' : ''}</p>
              ${isFirstSession ? '<p style="color:#666;margin:8px 0 0">+25 XP first session bonus included!</p>' : ''}
              ${didLevelUp ? `<p style="color:#666;margin:8px 0 0">You reached Level ${newLevel.level} — ${newLevel.name} ${newLevel.emoji}</p>` : ''}
            </div>
            <p>Leave a review for your tutor to earn an additional <strong>+15 XP</strong>!</p>
            <a href="https://aceforge.app/tutoring/session/${sessionId}" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
              Leave a Review →
            </a>
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Complete session error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
