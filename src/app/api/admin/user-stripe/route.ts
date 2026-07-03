import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: caller } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!caller?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const userId = new URL(request.url).searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: target } = await adminClient.from('profiles').select('email, stripe_customer_id').eq('id', userId).single()
    if (!target?.email) return NextResponse.json({ noSubscription: true })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })

    // Prefer the stored customer id; fall back to searching by email.
    let customer: Stripe.Customer | null = null
    if (target.stripe_customer_id) {
      try {
        const c = await stripe.customers.retrieve(target.stripe_customer_id)
        if (!(c as any).deleted) customer = c as Stripe.Customer
      } catch {}
    }
    if (!customer) {
      const search = await stripe.customers.search({ query: `email:'${target.email.replace(/'/g, "")}'` })
      customer = search.data[0] ?? null
    }
    if (!customer) return NextResponse.json({ noSubscription: true })

    const customerId = customer.id
    const stripeCustomerUrl = 'https://dashboard.stripe.com/customers/' + customerId

    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 })
    const sub = subs.data[0]
    if (!sub) return NextResponse.json({ noSubscription: true, customerId, stripeCustomerUrl })

    const item = sub.items.data[0]
    const amount = item?.price?.unit_amount != null ? item.price.unit_amount / 100 : null

    return NextResponse.json({
      customerId,
      subscriptionStatus: sub.status,
      currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      amount,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      stripeCustomerUrl,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
