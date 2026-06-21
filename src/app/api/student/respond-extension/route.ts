import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Student accepts or declines a tutor's session-extension request. Paid
// extensions need a card payment: the first accept call returns a clientSecret;
// after the client confirms the card, it calls again with { confirmed: true }.
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, accept, confirmed } = await request.json()
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session } = await adminClient
      .from('tutoring_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.student_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (session.extension_status !== 'pending') {
      return NextResponse.json({ error: 'No pending extension to respond to' }, { status: 409 })
    }

    if (!accept) {
      await adminClient.from('tutoring_sessions').update({ extension_status: 'declined' }).eq('id', sessionId)
      return NextResponse.json({ success: true, status: 'declined' })
    }

    const charge = Number(session.extension_extra_charge) || 0

    // Free extension — accept immediately.
    if (charge <= 0) {
      await adminClient.from('tutoring_sessions').update({ extension_status: 'accepted_free' }).eq('id', sessionId)
      return NextResponse.json({ success: true, status: 'accepted_free' })
    }

    // Paid extension.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' as any })

    if (!confirmed) {
      // Phase 1: create the PaymentIntent for the client to confirm with a card.
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(charge * 100),
        currency: 'usd',
        metadata: { type: 'extension', sessionId, userId: user.id },
        description: `AceForge session extension (${session.extended_minutes} min) — ${session.subject}`,
      })
      return NextResponse.json({ requiresPayment: true, clientSecret: paymentIntent.client_secret })
    }

    // Phase 2: card confirmed client-side — finalize.
    await adminClient.from('tutoring_sessions').update({ extension_status: 'accepted_paid' }).eq('id', sessionId)
    return NextResponse.json({ success: true, status: 'accepted_paid' })
  } catch (error: any) {
    console.error('respond-extension error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
