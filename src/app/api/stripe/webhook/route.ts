import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Use service role for webhook (bypasses RLS)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const subscriptionId = session.subscription as string
      if (userId) {
        await supabase.from('profiles').update({
          is_premium: true,
          stripe_subscription_id: subscriptionId,
          premium_since: new Date().toISOString(),
        }).eq('id', userId)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      if (userId) {
        await supabase.from('profiles').update({
          is_premium: false,
          stripe_subscription_id: null,
        }).eq('id', userId)
      } else {
        // Look up by subscription id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()
        if (profile) {
          await supabase.from('profiles').update({
            is_premium: false,
            stripe_subscription_id: null,
          }).eq('id', profile.id)
        }
      }
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (profile) {
        await supabase.from('profiles').update({ is_premium: false }).eq('id', profile.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}