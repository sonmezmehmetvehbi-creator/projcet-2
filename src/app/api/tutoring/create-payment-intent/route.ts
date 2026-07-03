import { createServerSupabaseClient } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"
import { getActiveBan } from "@/lib/bans"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" as any })
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Block tutoring-banned users before any charge is created.
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const tutoringBan = await getActiveBan(adminClient, user.id, 'tutoring')
    if (tutoringBan) {
      return NextResponse.json({ error: 'tutoring_banned', reason: tutoringBan.reason }, { status: 403 })
    }

    const { amount, tutorName, subject, sessionLength, tutorId } = await request.json()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: { type: "tutoring", userId: user.id, tutorId, tutorName, subject, sessionLength: String(sessionLength) },
      description: `AceForge Tutoring — ${subject} with ${tutorName} (${sessionLength} min)`,
    })
    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
