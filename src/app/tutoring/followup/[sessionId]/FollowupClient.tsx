'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Props {
  session: any
  tutorProfile: any
}

function FollowupForm({ session, tutorProfile }: Props) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const alreadyPaid = session.status !== 'proposed'
  const whenStr = new Date(session.scheduled_at).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  async function handlePay() {
    if (!stripe || !elements) return
    setError('')
    setLoading(true)
    try {
      const piRes = await fetch('/api/tutoring/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: session.student_price,
          tutorName: tutorProfile?.display_name,
          subject: session.subject,
          sessionLength: session.session_length,
          tutorId: session.tutor_id,
        }),
      })
      const piData = await piRes.json()
      if (piData.error) throw new Error(piData.error)

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(piData.clientSecret, {
        payment_method: { card: cardElement },
      })
      if (stripeError) throw new Error(stripeError.message)
      if (paymentIntent?.status !== 'succeeded') throw new Error('Payment failed')

      const res = await fetch('/api/tutoring/confirm-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, stripePaymentIntentId: paymentIntent.id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setSuccess(true)
      setTimeout(() => router.push('/tutoring/sessions'), 2000)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (success) return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 3rem' }}>
      <div className="card" style={{ padding: '3rem', maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgb(234,243,222)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <CheckCircle style={{ width: '2rem', height: '2rem', color: 'rgb(59,109,17)' }} />
        </div>
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.75rem' }}>
          Follow-up Booked & Paid! 🎓
        </h2>
        <p style={{ color: 'rgb(107,107,88)', lineHeight: 1.7 }}>
          Payment successful! Your tutor will confirm and send a Google Meet link shortly.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '36rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '1.5rem' }}>
          Confirm Your Follow-up Session
        </h1>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.125rem', fontWeight: 700, flexShrink: 0 }}>
              {tutorProfile?.display_name?.[0] ?? '?'}
            </div>
            <div>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.0625rem', color: 'rgb(26,26,20)' }}>{tutorProfile?.display_name}</p>
              {tutorProfile?.rating > 0 && <p style={{ fontSize: '0.875rem', color: 'rgb(180,120,10)' }}>⭐ {tutorProfile.rating}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { label: 'Subject', value: session.subject },
              { label: 'When', value: whenStr },
              { label: 'Duration', value: `${session.session_length} minutes` },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'rgb(107,107,88)' }}>{item.label}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgb(26,26,20)' }}>{item.value}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(34,85,14,0.1)', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: 'rgb(26,26,20)' }}>Total</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: 'rgb(34,85,14)' }}>${session.student_price}</span>
            </div>
          </div>
        </div>

        {alreadyPaid ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'rgb(107,107,88)', lineHeight: 1.7 }}>
              This follow-up has already been confirmed. Check <a href="/tutoring/sessions" style={{ color: 'rgb(34,85,14)', fontWeight: 600 }}>My Sessions</a>.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: '2rem' }}>
            {error && (
              <div className="alert-error" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />{error}
              </div>
            )}
            <label className="label">Card Details *</label>
            <div style={{ padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1.5px solid rgba(34,85,14,0.2)', background: 'white', marginBottom: '1.25rem' }}>
              <CardElement options={{
                style: {
                  base: { fontSize: '16px', color: 'rgb(26,26,20)', '::placeholder': { color: 'rgb(107,107,88)' } },
                  invalid: { color: 'rgb(163,45,45)' },
                },
              }} />
            </div>
            <div style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)', lineHeight: 1.6 }}>
                🔒 Secured by Stripe. Full refund if the tutor doesn't show.
              </p>
            </div>
            <button onClick={handlePay} disabled={loading || !stripe}
              style={{ width: '100%', padding: '1rem', borderRadius: '0.875rem', background: 'rgb(34,85,14)', border: 'none', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? 'Processing payment...' : `💳 Pay $${session.student_price} & Confirm`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FollowupClient({ session, tutorProfile }: Props) {
  return (
    <Elements stripe={stripePromise}>
      <FollowupForm session={session} tutorProfile={tutorProfile} />
    </Elements>
  )
}
