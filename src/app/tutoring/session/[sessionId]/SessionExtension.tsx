'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Theme {
  accent: string
  cardBg: string
  cardBorder: string
  text1: string
  text2: string
  modalBg: string
}

interface Props {
  session: any
  isTutor: boolean
  tutorHourlyRate: number
  theme: Theme
}

// Whether the tutor can still log an extension: between the scheduled start and
// 30 minutes after the scheduled end.
function withinExtensionWindow(session: any): boolean {
  const start = new Date(session.scheduled_at).getTime()
  const end = start + (session.session_length ?? 0) * 60 * 1000 + 30 * 60 * 1000
  const now = Date.now()
  return now >= start && now <= end
}

export default function SessionExtension({ session, isTutor, tutorHourlyRate, theme }: Props) {
  return (
    <Elements stripe={stripePromise}>
      <Inner session={session} isTutor={isTutor} tutorHourlyRate={tutorHourlyRate} theme={theme} />
    </Elements>
  )
}

function Inner({ session, isTutor, tutorHourlyRate, theme }: Props) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  const [showModal, setShowModal] = useState(false)
  const [extraMinutes, setExtraMinutes] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [responding, setResponding] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  const status = session.extension_status as string | null
  const charge = Number(session.extension_extra_charge) || 0

  const { accent, cardBg, cardBorder, text1, text2, modalBg } = theme

  const computedCost = Math.round((extraMinutes / 60) * (tutorHourlyRate || 0) * 100) / 100

  async function submitExtension(type: 'free' | 'paid') {
    if (extraMinutes <= 0) { alert('Enter the extra minutes you ran over.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/tutor/request-extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, extraMinutes, type }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert(`Could not send extension: ${data.error ?? res.status}`); setSubmitting(false); return }
      setShowModal(false)
      router.refresh()
    } catch (err: any) {
      alert(`Could not send extension: ${err?.message ?? 'network error'}`)
    }
    setSubmitting(false)
  }

  async function respond(accept: boolean) {
    setResponding(true)
    try {
      // Paid + accept needs a card payment.
      if (accept && charge > 0) {
        const res = await fetch('/api/student/respond-extension', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id, accept: true }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) { alert(`Could not accept: ${data.error ?? res.status}`); setResponding(false); return }
        if (data.requiresPayment && data.clientSecret) {
          if (!stripe || !elements) { alert('Payment not ready, try again.'); setResponding(false); return }
          const card = elements.getElement(CardElement)
          if (!card) { setPayOpen(true); setResponding(false); return }
          const result = await stripe.confirmCardPayment(data.clientSecret, { payment_method: { card } })
          if (result.error) { alert(result.error.message ?? 'Payment failed'); setResponding(false); return }
          // Finalize.
          await fetch('/api/student/respond-extension', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: session.id, accept: true, confirmed: true }),
          })
        }
      } else {
        const res = await fetch('/api/student/respond-extension', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id, accept }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) { alert(`Could not respond: ${data.error ?? res.status}`); setResponding(false); return }
      }
      router.refresh()
    } catch (err: any) {
      alert(`Could not respond: ${err?.message ?? 'network error'}`)
    }
    setResponding(false)
  }

  // ---- Resolved status (both sides) ----
  const resolvedLabel =
    status === 'accepted_free' ? '✅ Extension accepted (free)' :
    status === 'accepted_paid' ? '✅ Extension accepted & paid' :
    status === 'declined' ? '❌ Extension declined by student' : null

  if (resolvedLabel) {
    return (
      <div style={{ padding: '0.875rem 1.25rem', borderRadius: '0.875rem', marginBottom: '1rem', background: cardBg, border: `1px solid ${cardBorder}` }}>
        <p style={{ fontSize: '0.875rem', color: text2, fontWeight: 600 }}>
          {resolvedLabel}{session.extended_minutes ? ` — ${session.extended_minutes} extra minutes` : ''}
        </p>
      </div>
    )
  }

  // ---- Student: pending response ----
  if (!isTutor && status === 'pending') {
    return (
      <div style={{ padding: '1rem 1.25rem', borderRadius: '0.875rem', marginBottom: '1rem', background: 'rgba(37,99,235,0.06)', border: '1.5px solid rgba(37,99,235,0.25)' }}>
        <p style={{ fontSize: '0.9375rem', color: text1, fontWeight: 600, marginBottom: '0.25rem' }}>
          ⏱ Your tutor ran {session.extended_minutes} extra minutes {charge > 0 ? `— +$${charge.toFixed(2)}` : '— Free'}
        </p>
        <p style={{ fontSize: '0.8125rem', color: text2, marginBottom: '0.875rem' }}>
          {charge > 0 ? 'Accept to be charged for the extra time, or decline.' : 'Please accept or decline this time log.'}
        </p>
        {charge > 0 && payOpen && (
          <div style={{ padding: '0.75rem', borderRadius: '0.625rem', background: 'white', border: '1px solid rgba(0,0,0,0.12)', marginBottom: '0.75rem' }}>
            <CardElement options={{ style: { base: { fontSize: '15px' } } }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => { if (charge > 0) setPayOpen(true); respond(true) }} disabled={responding}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: 'rgb(34,85,14)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
            {responding ? 'Processing…' : charge > 0 ? `Accept & Pay $${charge.toFixed(2)}` : 'Accept'}
          </button>
          <button onClick={() => respond(false)} disabled={responding}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: 'transparent', border: '1px solid rgba(163,45,45,0.4)', color: 'rgb(163,45,45)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
            Decline
          </button>
        </div>
      </div>
    )
  }

  // ---- Tutor: pending (already requested) ----
  if (isTutor && status === 'pending') {
    return (
      <div style={{ padding: '0.875rem 1.25rem', borderRadius: '0.875rem', marginBottom: '1rem', background: cardBg, border: `1px solid ${cardBorder}` }}>
        <p style={{ fontSize: '0.875rem', color: text2, fontWeight: 600 }}>
          ⏳ Extension request sent ({session.extended_minutes} min{charge > 0 ? `, +$${charge.toFixed(2)}` : ', free'}) — awaiting student response
        </p>
      </div>
    )
  }

  // ---- Tutor: can request an extension ----
  if (isTutor && !status && withinExtensionWindow(session)) {
    return (
      <>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setShowModal(true)}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: accent, border: 'none', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
            ⏱ Extend Session
          </button>
        </div>

        {showModal && (
          <div onClick={() => !submitting && setShowModal(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: modalBg, borderRadius: '1.25rem', maxWidth: '30rem', width: '100%', padding: '1.75rem', border: `1px solid ${cardBorder}`, boxShadow: '0 25px 80px rgba(0,0,0,0.5)' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: text1, marginBottom: '0.5rem' }}>Log Extra Time</h2>
              <p style={{ fontSize: '0.8125rem', color: text2, marginBottom: '1rem' }}>
                Sessions run on Google Meet — this is just for billing and time logging.
              </p>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: text2, display: 'block', marginBottom: '0.375rem' }}>
                How many extra minutes did you run over?
              </label>
              <input type="number" min={0} value={extraMinutes || ''} onChange={e => setExtraMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: `1px solid ${cardBorder}`, background: 'transparent', color: text1, fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box', marginBottom: '1rem' }} />

              {extraMinutes > 0 && extraMinutes <= 20 && (
                <>
                  <p style={{ fontSize: '0.875rem', color: text2, marginBottom: '1rem' }}>This will be free for the student.</p>
                  <button onClick={() => submitExtension('free')} disabled={submitting}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.875rem', background: accent, border: 'none', color: 'white', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>
                    {submitting ? 'Sending…' : 'Send Free Extension Request'}
                  </button>
                </>
              )}

              {extraMinutes > 20 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <button onClick={() => submitExtension('paid')} disabled={submitting}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.875rem', background: accent, border: 'none', color: 'white', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', textAlign: 'left' }}>
                    Charge student for extra time — ${computedCost.toFixed(2)}
                  </button>
                  <button onClick={() => submitExtension('free')} disabled={submitting}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.875rem', background: 'transparent', border: `1px solid ${cardBorder}`, color: text1, fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', textAlign: 'left' }}>
                    Continue for free
                  </button>
                </div>
              )}

              <button onClick={() => setShowModal(false)} disabled={submitting}
                style={{ width: '100%', marginTop: '0.875rem', background: 'transparent', border: 'none', color: text2, fontSize: '0.8125rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return null
}
