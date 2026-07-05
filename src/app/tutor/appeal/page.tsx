'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, X, CheckCircle } from 'lucide-react'

const INDIGO = 'rgb(99,102,241)'
const PURPLE = 'rgb(139,92,246)'
const BASE_BG = 'linear-gradient(135deg, rgb(10,10,20), rgb(15,15,30), rgb(18,15,35))'
const TEXT2 = 'rgba(255,255,255,0.6)'

function TutorBadge() {
  return (
    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.08em', color: 'white', background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>TUTOR</span>
  )
}

const apLabel: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }

function AppealInner() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') ?? ''
  const nameParam = searchParams.get('name') ?? ''

  const [name, setName] = useState(nameParam)
  const [email, setEmail] = useState(emailParam)
  const [reason, setReason] = useState('')
  const [additional, setAdditional] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) { setError('Please explain your appeal.'); return }
    setLoading(true)
    setError('')
    try {
      await fetch('/api/tutor/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, reason, additional }),
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (success) return (
    <div style={{ minHeight: '100vh', background: BASE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="ap-fade" style={{ padding: '3rem 2rem', maxWidth: '32rem', width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '1.25rem' }}>
        <div className="ap-pop" style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <CheckCircle style={{ width: '2rem', height: '2rem', color: 'rgb(74,222,128)' }} strokeWidth={2.5} />
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
          Appeal Submitted
        </h1>
        <p style={{ color: TEXT2, lineHeight: 1.7, marginBottom: '1.5rem' }}>
          We've received your appeal and will review it within 3-5 business days. You'll receive an email with our decision.
        </p>
        <Link href="/login" className="ap-cta" style={{ textDecoration: 'none' }}>Go to Login →</Link>
      </div>
      <style>{apStyles}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BASE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div className="ap-fade" style={{ width: '100%', maxWidth: '32rem' }}>

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: '1.125rem', height: '1.125rem', color: 'white' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.25rem', color: 'white' }}>AceForge</span>
          <TutorBadge />
        </Link>

        <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '1.25rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>
            Appeal Your Application
          </h1>
          <p style={{ color: TEXT2, marginBottom: '1.5rem', lineHeight: 1.6 }}>
            If you believe our decision was incorrect, please explain your case below. We review all appeals within 3-5 business days.
          </p>

          {error && (
            <div className="ap-err" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'rgb(248,113,113)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              <X style={{ width: '1rem', height: '1rem', flexShrink: 0 }} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={apLabel}>Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="ap-input" required />
            </div>
            <div>
              <label style={apLabel}>Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="ap-input" required />
            </div>
            <div>
              <label style={apLabel}>Why should we reconsider your application? *</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} className="ap-input" rows={5} style={{ height: 'auto', resize: 'vertical', paddingTop: '0.7rem' }}
                placeholder="Explain why you believe the decision was incorrect and why you would be a great AceForge tutor..." required />
            </div>
            <div>
              <label style={apLabel}>Additional information <span style={{ fontWeight: 400, color: TEXT2 }}>(optional)</span></label>
              <textarea value={additional} onChange={e => setAdditional(e.target.value)} className="ap-input" rows={3} style={{ height: 'auto', resize: 'vertical', paddingTop: '0.7rem' }}
                placeholder="Any additional context, certifications, or experience you'd like us to consider..." />
            </div>
            <button type="submit" disabled={loading} className="ap-cta">
              {loading ? 'Submitting...' : <>Submit Appeal <span className="ap-arrow">→</span></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: TEXT2 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'rgb(165,180,252)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>
      <style>{apStyles}</style>
    </div>
  )
}

const apStyles = `
  @keyframes apFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes apErr { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes apPop { 0% { opacity: 0; transform: scale(0.6); } 60% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
  .ap-fade { animation: apFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .ap-err { animation: apErr 0.3s ease both; }
  .ap-pop { animation: apPop 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .ap-input {
    width: 100%; box-sizing: border-box; height: 48px; padding: 0 1rem; border-radius: 0.75rem;
    background: rgba(255,255,255,0.06); border: 1.5px solid rgba(99,102,241,0.25); color: white;
    font-size: 0.9375rem; outline: none; transition: border-color 0.15s ease, box-shadow 0.15s ease; color-scheme: dark; font-family: inherit;
  }
  .ap-input::placeholder { color: rgba(255,255,255,0.35); }
  .ap-input:focus { border-color: rgba(99,102,241,0.6); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
  .ap-cta {
    width: 100%; height: 52px; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    border-radius: 0.75rem; border: none; color: white; font-weight: 700; font-size: 1rem; cursor: pointer;
    background: linear-gradient(135deg, rgb(99,102,241), rgb(139,92,246));
    transition: filter 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }
  .ap-cta:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
  .ap-cta:disabled { cursor: wait; opacity: 0.7; }
  .ap-arrow { display: inline-block; transition: transform 0.2s ease; }
  .ap-cta:hover .ap-arrow { transform: translateX(3px); }
`

export default function TutorAppealPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(15,15,30)', color: 'white' }}>Loading...</div>}>
      <AppealInner />
    </Suspense>
  )
}
