'use client'

import { useState } from 'react'

interface Props {
  sessionId: string
  tutorId: string
  tutorName: string
  onClose: () => void
  onSubmitted: () => void
}

const GOLD = 'rgb(251,191,36)'
const GREEN = 'rgb(34,85,14)'

export default function ReviewModal({ sessionId, tutorId, tutorName, onClose, onSubmitted }: Props) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const profileLink = `https://aceforge.app/tutoring/tutor/${tutorId}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  async function submit() {
    if (rating === 0) { alert('Please select a star rating first.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/tutoring/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, tutorId, rating, comment, wouldRecommend }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(`Could not submit review: ${data.error ?? res.status}`)
        setSubmitting(false)
        return
      }
      onSubmitted()
    } catch (e: any) {
      alert(`Could not submit review: ${e?.message ?? 'network error'}`)
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ background: 'white', borderRadius: '1.5rem', maxWidth: '30rem', width: '100%', padding: '2rem', boxShadow: '0 25px 80px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Tutor header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.875rem' }}>
            {tutorName?.[0] ?? '?'}
          </div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: 'rgb(26,26,20)' }}>
            How was your session with {tutorName}?
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgb(107,107,88)', marginTop: '0.375rem' }}>
            Your feedback helps other students find great tutors.
          </p>
        </div>

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3, 4, 5].map(n => {
            const active = (hover || rating) >= n
            return (
              <button key={n} type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontSize: '2.5rem', lineHeight: 1, color: active ? GOLD : 'rgb(210,210,200)', transition: 'transform 0.1s, color 0.1s', transform: active ? 'scale(1.1)' : 'scale(1)' }}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}>
                ★
              </button>
            )
          })}
        </div>

        {/* Comment */}
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
          Tell others about your experience (optional)
        </label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
          placeholder="What did you like? What could be better?"
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.875rem', border: '1.5px solid rgba(34,85,14,0.2)', background: 'rgb(250,250,247)', color: 'rgb(26,26,20)', fontSize: '0.9375rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '1.25rem' }} />

        {/* Recommend toggle */}
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgb(26,26,20)', marginBottom: '0.625rem' }}>Would you recommend this tutor?</p>
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            {[
              { label: '👍 Yes', value: true },
              { label: '👎 No', value: false },
            ].map(opt => {
              const selected = wouldRecommend === opt.value
              return (
                <button key={opt.label} type="button" onClick={() => setWouldRecommend(opt.value)}
                  style={{ flex: 1, padding: '0.625rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer',
                    background: selected ? (opt.value ? 'rgba(34,85,14,0.1)' : 'rgba(163,45,45,0.08)') : 'white',
                    border: `1.5px solid ${selected ? (opt.value ? GREEN : 'rgb(163,45,45)') : 'rgba(0,0,0,0.12)'}`,
                    color: selected ? (opt.value ? GREEN : 'rgb(163,45,45)') : 'rgb(107,107,88)' }}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Copy profile link */}
        <button type="button" onClick={copyLink}
          style={{ width: '100%', padding: '0.625rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.06)', border: '1px dashed rgba(34,85,14,0.3)', color: GREEN, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
          {copied ? '✅ Link copied!' : '🔗 Copy tutor profile link'}
        </button>

        {/* Submit */}
        <button type="button" onClick={submit} disabled={submitting}
          style={{ width: '100%', padding: '0.9375rem', borderRadius: '0.875rem', background: GREEN, border: 'none', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>

        {/* Skip */}
        <div style={{ textAlign: 'center', marginTop: '0.875rem' }}>
          <button type="button" onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'rgb(140,140,120)', fontSize: '0.8125rem', cursor: 'pointer', textDecoration: 'underline' }}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
