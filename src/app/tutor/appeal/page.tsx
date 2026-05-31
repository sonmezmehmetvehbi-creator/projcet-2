'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react'

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ padding: '3rem', maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgb(234,243,222)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <CheckCircle style={{ width: '2rem', height: '2rem', color: 'rgb(59,109,17)' }} />
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.75rem' }}>
          Appeal Submitted
        </h1>
        <p style={{ color: 'rgb(107,107,88)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          We've received your appeal and will review it within 3-5 business days. You'll receive an email with our decision.
        </p>
        <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center', textDecoration: 'none' }}>
          Go to Login →
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '32rem' }}>

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: '1.125rem', height: '1.125rem', color: 'white' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.25rem', color: 'rgb(34,85,14)' }}>AceForge</span>
        </Link>

        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.5rem' }}>
            Appeal Your Application
          </h1>
          <p style={{ color: 'rgb(107,107,88)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            If you believe our decision was incorrect, please explain your case below. We review all appeals within 3-5 business days.
          </p>

          {error && (
            <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Why should we reconsider your application? *</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} className="input" rows={5} style={{ resize: 'vertical' }}
                placeholder="Explain why you believe the decision was incorrect and why you would be a great AceForge tutor..." required />
            </div>
            <div>
              <label className="label">Additional information <span style={{ fontWeight: 400, color: 'rgb(107,107,88)' }}>(optional)</span></label>
              <textarea value={additional} onChange={e => setAdditional(e.target.value)} className="input" rows={3} style={{ resize: 'vertical' }}
                placeholder="Any additional context, certifications, or experience you'd like us to consider..." />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
              {loading ? 'Submitting...' : 'Submit Appeal →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'rgb(107,107,88)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'rgb(34,85,14)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default function TutorAppealPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <AppealInner />
    </Suspense>
  )
}
