import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getActiveBan } from '@/lib/bans'
import { NextResponse } from 'next/server'

// Creates a support ticket (and its first message). Enforces the Support Ban:
// a banned user cannot open new tickets.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const supportBan = await getActiveBan(adminClient, user.id, 'support')
    if (supportBan) {
      return NextResponse.json({ error: 'support_banned', reason: supportBan.reason }, { status: 403 })
    }

    const { subject, message } = await request.json()
    if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })

    const { data: ticket, error } = await adminClient
      .from('support_tickets')
      .insert({ user_id: user.id, subject: subject.trim(), status: 'open' })
      .select()
      .single()
    if (error) throw error

    if (message?.trim()) {
      await adminClient.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        message: message.trim(),
        is_admin: false,
      })
    }

    return NextResponse.json({ ticket })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
