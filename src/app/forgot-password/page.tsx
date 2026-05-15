'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div style={{ width:'100%', maxWidth:'26rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', textDecoration:'none', marginBottom:'1.5rem' }}>
            <div style={{ width:'2.5rem', height:'2.5rem', borderRadius:'0.75rem', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <BookOpen style={{ width:'1.25rem', height:'1.25rem', color:'white' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily:'Fraunces, Georgia, serif', fontWeight:700, fontSize:'1.25rem', color:'rgb(34,85,14)' }}>AceForge</span>
          </Link>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>Reset your password</h1>
          <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>Enter your email and we'll send you a link</p>
        </div>

        <div className="card" style={{ padding:'2rem' }}>
          {submitted ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:'3.5rem', height:'3.5rem', borderRadius:'50%', background:'rgb(234,243,222)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
                <CheckCircle style={{ width:'1.75rem', height:'1.75rem', color:'rgb(59,109,17)' }} />
              </div>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>Check your inbox</h2>
              <p style={{ fontSize:'0.9375rem', color:'rgb(107,107,88)', lineHeight:1.7 }}>
                If <strong>{email}</strong> is registered, we sent a password reset link. Check your spam folder if you don't see it.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert-error" style={{ marginBottom:'1.25rem' }}>
                  <AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />{error}
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                <div>
                  <label className="label" htmlFor="email">Email address</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="input" placeholder="you@example.com" required autoComplete="email" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
          <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:'0.375rem', fontSize:'0.9375rem', color:'rgb(107,107,88)', textDecoration:'none' }}>
            <ArrowLeft style={{ width:'1rem', height:'1rem' }} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}