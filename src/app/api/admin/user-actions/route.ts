import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Supporting tables for the admin user-management system:
//
// -- CREATE TABLE IF NOT EXISTS user_bans (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid REFERENCES profiles(id), ban_type text NOT NULL, reason text NOT NULL, duration_days int, expires_at timestamptz, is_permanent boolean DEFAULT false, is_active boolean DEFAULT true, created_by uuid, created_at timestamptz DEFAULT now());
// -- ALTER TABLE user_bans DISABLE ROW LEVEL SECURITY;
//
// -- CREATE TABLE IF NOT EXISTS admin_notes (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid, note text, created_by uuid, created_at timestamptz DEFAULT now());
// -- ALTER TABLE admin_notes DISABLE ROW LEVEL SECURITY;
//
// -- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

const LEVELS = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 150 },
  { level: 3, xpRequired: 400 },
  { level: 4, xpRequired: 800 },
  { level: 5, xpRequired: 1500 },
  { level: 6, xpRequired: 2500 },
  { level: 7, xpRequired: 4000 },
  { level: 8, xpRequired: 6000 },
  { level: 9, xpRequired: 9000 },
  { level: 10, xpRequired: 13000 },
]

function getLevelFromXP(xp: number): number {
  let level = 1
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) level = l.level
    else break
  }
  return level
}

// Ban duration keys → days (null = permanent).
const DURATION_DAYS: Record<string, number | null> = {
  '1': 1, '3': 3, '7': 7, '30': 30, permanent: null,
  '1 Day': 1, '3 Days': 3, '7 Days': 7, '30 Days': 30, Permanent: null,
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: caller } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!caller?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { userId, action } = body
    if (!userId || !action) return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    switch (action) {
      case 'grant_premium': {
        await adminClient.from('profiles').update({ is_premium: true }).eq('id', userId)
        return NextResponse.json({ success: true, is_premium: true })
      }

      case 'remove_premium': {
        await adminClient.from('profiles').update({ is_premium: false }).eq('id', userId)
        return NextResponse.json({ success: true, is_premium: false })
      }

      case 'add_generations': {
        const amount = Math.max(1, Math.min(50, Number(body.amount) || 0))
        const { data: p } = await adminClient.from('profiles').select('bonus_generations').eq('id', userId).single()
        const next = (p?.bonus_generations ?? 0) + amount
        await adminClient.from('profiles').update({ bonus_generations: next }).eq('id', userId)
        return NextResponse.json({ success: true, bonus_generations: next })
      }

      case 'reset_daily_usage': {
        const today = new Date().toISOString().split('T')[0]
        await adminClient.from('daily_usage').delete().eq('user_id', userId).eq('date', today)
        return NextResponse.json({ success: true })
      }

      case 'adjust_xp': {
        const amount = Number(body.amount) || 0
        const { data: p } = await adminClient.from('profiles').select('xp').eq('id', userId).single()
        const newXP = Math.max(0, (p?.xp ?? 0) + amount)
        const newLevel = getLevelFromXP(newXP)
        await adminClient.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', userId)
        await adminClient.from('user_xp_history').insert({
          user_id: userId,
          source_type: 'admin_adjustment',
          source_key: 'admin:' + Date.now(),
          xp_earned: amount,
        })
        return NextResponse.json({ success: true, xp: newXP, level: newLevel, reason: body.reason ?? null })
      }

      case 'reset_streak': {
        await adminClient.from('profiles').update({ streak_count: 0 }).eq('id', userId)
        return NextResponse.json({ success: true })
      }

      case 'send_password_reset': {
        const { data: target } = await adminClient.from('profiles').select('email').eq('id', userId).single()
        if (!target?.email) return NextResponse.json({ error: 'User has no email' }, { status: 400 })

        const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: target.email,
          options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/reset-password` },
        })
        if (linkErr) throw linkErr
        const actionLink = linkData?.properties?.action_link

        const resend = new Resend(process.env.RESEND_API_KEY as string)
        await resend.emails.send({
          from: 'AceForge <noreply@aceforge.app>',
          to: target.email,
          subject: 'Reset your AceForge password',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #22550e;">Password reset requested</h2>
              <p>An AceForge admin initiated a password reset for your account. Click below to choose a new password:</p>
              <p><a href="${actionLink}" style="display:inline-block; padding:0.75rem 1.5rem; background:#22550e; color:white; border-radius:0.5rem; text-decoration:none; font-weight:600;">Reset Password</a></p>
              <p style="color:#6b6b58; font-size:0.875rem;">If you didn't expect this, you can safely ignore this email.</p>
            </div>`,
        })
        return NextResponse.json({ success: true })
      }

      case 'ban_user': {
        const banType: string = body.banType
        const durationKey: string = String(body.duration)
        const reason: string = (body.reason ?? '').trim()
        if (!banType || !reason) return NextResponse.json({ error: 'Ban type and reason are required' }, { status: 400 })

        const durationDays = DURATION_DAYS[durationKey] ?? null
        const isPermanent = durationDays === null
        const expiresAt = isPermanent ? null : new Date(Date.now() + durationDays * 86400000).toISOString()

        const { data: ban, error } = await adminClient.from('user_bans').insert({
          user_id: userId,
          ban_type: banType,
          reason,
          duration_days: durationDays,
          expires_at: expiresAt,
          is_permanent: isPermanent,
          is_active: true,
          created_by: user.id,
        }).select().single()
        if (error) throw error

        if (banType === 'full_account_ban') {
          await adminClient.from('profiles').update({ is_banned: true }).eq('id', userId)
        }

        // Notify the banned user by email.
        try {
          const { data: banned } = await adminClient.from('profiles').select('email, display_name').eq('id', userId).single()
          if (banned?.email) {
            const first = banned.display_name?.split(' ')[0] || 'there'
            const durationLabel = isPermanent ? 'Permanent' : `${durationDays} day${durationDays === 1 ? '' : 's'}`
            const resend = new Resend(process.env.RESEND_API_KEY as string)
            await resend.emails.send({
              from: 'AceForge <noreply@aceforge.app>',
              to: banned.email,
              subject: 'Important: Your AceForge account has been restricted',
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
                  <h2 style="color:#a32d2d;font-size:22px">Your AceForge account has been restricted</h2>
                  <p>Hi ${first}, your account has been restricted by our moderation team.</p>
                  <div style="background:#fdf6f6;border:1px solid #f0d7d7;border-radius:12px;padding:20px;margin:20px 0">
                    <p style="margin:0 0 8px"><strong>Restriction type:</strong> ${banType}</p>
                    <p style="margin:0 0 8px"><strong>Reason:</strong> ${reason}</p>
                    <p style="margin:0"><strong>Duration:</strong> ${durationLabel}</p>
                  </div>
                  <p>If you believe this was a mistake, you may appeal this decision. Reply to this notice or reach out to our support team, and include your account email and any relevant details.</p>
                  <div style="text-align:center;margin:28px 0">
                    <a href="mailto:contactinfo21342@gmail.com" style="display:inline-block;background:#22550e;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
                      Contact Support →
                    </a>
                  </div>
                  <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
                </div>`,
            })
          }
        } catch (e: any) {
          console.error('Ban notification email failed:', e?.message)
        }

        return NextResponse.json({ success: true, ban })
      }

      case 'unban_user': {
        const banId: string = body.banId
        if (!banId) return NextResponse.json({ error: 'Missing banId' }, { status: 400 })

        const { data: ban } = await adminClient.from('user_bans').select('ban_type, user_id').eq('id', banId).single()
        await adminClient.from('user_bans').update({ is_active: false }).eq('id', banId)

        if (ban?.ban_type === 'full_account_ban') {
          // Only clear the flag if no other active full-account ban remains.
          const { data: others } = await adminClient.from('user_bans')
            .select('id').eq('user_id', ban.user_id).eq('ban_type', 'full_account_ban').eq('is_active', true)
          if (!others || others.length === 0) {
            await adminClient.from('profiles').update({ is_banned: false }).eq('id', ban.user_id)
          }
        }
        return NextResponse.json({ success: true })
      }

      case 'save_note': {
        const note: string = (body.note ?? '').trim()
        if (!note) return NextResponse.json({ error: 'Note is empty' }, { status: 400 })
        const { data: saved, error } = await adminClient.from('admin_notes').insert({
          user_id: userId,
          note,
          created_by: user.id,
        }).select().single()
        if (error) throw error
        return NextResponse.json({ success: true, note: saved })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
