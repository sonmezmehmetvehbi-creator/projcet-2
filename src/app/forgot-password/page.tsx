'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Lock, CheckCircle, ArrowLeft, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const GREEN = 'rgb(34,85,14)'
const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')

  async function sendReset() {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    await sendReset()
    setLoading(false)
    setSubmitted(true)
  }

  async function handleResend() {
    setResending(true)
    await sendReset()
    setResending(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="fp-card" style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <Link href="/" className="fp-item" style={{ animationDelay: '0.02s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: '1.125rem', height: '1.125rem', color: 'white' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.25rem', color: GREEN }}>AceForge</span>
        </Link>

        <div className="fp-item" style={{ animationDelay: '0.06s', background: 'white', borderRadius: '1.25rem', boxShadow: '0 12px 40px rgba(34,85,14,0.1)', border: '1px solid rgba(34,85,14,0.06)', padding: '2.5rem 2rem' }}>

          {submitted ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center' }}>
              <div className="fp-check" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgb(234,243,222)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <CheckCircle style={{ width: '1.875rem', height: '1.875rem', color: 'rgb(59,109,17)' }} strokeWidth={2.5} />
              </div>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: INK, marginBottom: '0.625rem' }}>Check your email!</h1>
              <p style={{ fontSize: '0.9375rem', color: MUTED, lineHeight: 1.7, marginBottom: '1.75rem' }}>
                We sent a reset link to <strong style={{ color: INK }}>{email}</strong>. Check your spam folder if you don't see it.
              </p>
              <p style={{ fontSize: '0.875rem', color: MUTED, marginBottom: '1.25rem' }}>
                Didn't receive it?{' '}
                <button onClick={handleResend} disabled={resending} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: GREEN, fontWeight: 700, fontSize: '0.875rem' }}>
                  {resending ? 'Resending...' : 'Resend'}
                </button>
              </p>
              <Link href="/login" className="fp-cta" style={{ textDecoration: 'none' }}>Back to login</Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(34,85,14,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Lock style={{ width: '1.375rem', height: '1.375rem', color: GREEN }} strokeWidth={2.25} />
              </div>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: INK, textAlign: 'center', marginBottom: '0.5rem' }}>Forgot your password?</h1>
              <p style={{ color: MUTED, fontSize: '0.9375rem', textAlign: 'center', marginBottom: '1.75rem' }}>Enter your email and we'll send you a reset link</p>

              {error && (
                <div className="fp-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.08)', border: '1px solid rgba(163,45,45,0.25)', color: 'rgb(163,45,45)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                  <X style={{ width: '1rem', height: '1rem', flexShrink: 0 }} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={fpLabel} htmlFor="email">Email address</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="fp-input" style={fpInput} placeholder="you@example.com" required autoComplete="email" />
                </div>
                <button type="submit" disabled={loading} className="fp-cta">
                  {loading ? 'Sending...' : <>Send Reset Link <span className="fp-arrow">→</span></>}
                </button>
              </form>
            </>
          )}
        </div>

        {!submitted && (
          <div className="fp-item" style={{ animationDelay: '0.1s', textAlign: 'center', marginTop: '1.5rem' }}>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.9375rem', color: MUTED, textDecoration: 'none' }}>
              <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> Back to login
            </Link>
          </div>
        )}
      </div>

      <style>{fpStyles}</style>
    </div>
  )
}

const fpLabel: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgb(26,26,20)', marginBottom: '0.4rem' }
const fpInput: React.CSSProperties = { width: '100%', boxSizing: 'border-box', height: '48px', padding: '0 1rem', borderRadius: '0.875rem', border: '1.5px solid rgba(34,85,14,0.18)', outline: 'none', fontSize: '0.9375rem', color: 'rgb(26,26,20)', background: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }

const fpStyles = `
  @keyframes fpFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fpItem { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fpErr { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fpPop { 0% { opacity: 0; transform: scale(0.6); } 60% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
  .fp-card { animation: fpFade 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .fp-item { animation: fpItem 0.5s ease both; }
  .fp-error { animation: fpErr 0.3s ease both; }
  .fp-check { animation: fpPop 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .fp-input:focus { border-color: rgb(34,85,14); box-shadow: 0 0 0 3px rgba(34,85,14,0.12); }
  .fp-cta {
    width: 100%; height: 52px; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    border-radius: 0.875rem; border: none; color: white; font-weight: 700; font-size: 1rem; cursor: pointer;
    background: linear-gradient(135deg, rgb(34,85,14), rgb(59,130,46));
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .fp-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(34,85,14,0.3); }
  .fp-cta:disabled { cursor: wait; }
  .fp-arrow { display: inline-block; transition: transform 0.2s ease; }
  .fp-cta:hover .fp-arrow { transform: translateX(3px); }
`
