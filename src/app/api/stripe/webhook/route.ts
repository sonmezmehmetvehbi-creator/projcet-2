import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aceforge.app'

function premiumWelcomeHtml(name: string) {
  const first = name?.split(' ')[0] || 'there'
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#22550e;font-size:24px">⚡ Welcome to AceForge Premium!</h2>
      <p>Congrats ${first}, you're now <strong>Premium</strong>! 🎉</p>
      <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 12px;font-weight:700;color:#22550e">Benefits unlocked:</p>
        <p style="margin:0 0 8px">✅ <strong>Unlimited generations</strong></p>
        <p style="margin:0 0 8px">✅ <strong>No wait time</strong></p>
        <p style="margin:0">✅ <strong>Premium tutor rate</strong> — $34.99/hr</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#22550e;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
          Start Studying →
        </a>
      </div>
      <p style="color:#6b6b58;font-size:13px">
        Billing: <strong>$5.99/month</strong>. Cancel anytime from your settings.
      </p>
      <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
    </div>
  `
}

function premiumEndedHtml(name: string) {
  const first = name?.split(' ')[0] || 'there'
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#22550e;font-size:24px">Your AceForge Premium has ended</h2>
      <p>Hi ${first}, your Premium subscription has ended and you've been moved to the <strong>Free plan</strong> (2 questions/day).</p>
      <div style="background:#fdf6f6;border:1px solid #f0d7d7;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 12px;font-weight:700;color:#a32d2d">What you'll miss:</p>
        <p style="margin:0 0 8px">• Unlimited generations</p>
        <p style="margin:0">• No wait time</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="${APP_URL}/pricing" style="display:inline-block;background:#22550e;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
          Reactivate Premium →
        </a>
      </div>
      <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
    </div>
  `
}

async function sendMail(subject: string, to: string, html: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY as string)
    await resend.emails.send({ from: 'AceForge <noreply@aceforge.app>', to, subject, html })
  } catch (e: any) {
    console.error('Stripe webhook email failed:', e?.message)
  }
}

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

        const { data: profile } = await supabase
          .from('profiles')
          .select('email, display_name')
          .eq('id', userId)
          .single()
        if (profile?.email) {
          await sendMail('⚡ Welcome to AceForge Premium!', profile.email, premiumWelcomeHtml(profile.display_name))
        }
      }
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id
      let targetId = userId
      if (!targetId) {
        // Look up by subscription id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()
        targetId = profile?.id
      }
      if (targetId) {
        await supabase.from('profiles').update({
          is_premium: false,
          stripe_subscription_id: null,
        }).eq('id', targetId)

        const { data: profile } = await supabase
          .from('profiles')
          .select('email, display_name')
          .eq('id', targetId)
          .single()
        if (profile?.email) {
          await sendMail('Your AceForge Premium has ended', profile.email, premiumEndedHtml(profile.display_name))
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