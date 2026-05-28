'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, AlertCircle, CheckCircle, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'

function AdminSignupInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setValidToken(false)
        return
      }
      try {
        const res = await fetch(`/api/admin/verify-token?token=${encodeURIComponent(token)}`)
        if (!res.ok) { setValidToken(false); return }
        const data = await res.json()
        setValidToken(data.valid === true)
      } catch {
        setValidToken(false)
      }
    }
    checkToken()
  }, [token])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin/tutors`,
        },
      })
      if (signUpError) throw signUpError
      if (data.user) {
        // Set as admin via API (server-side with service role)
        await fetch('/api/admin/create-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id, token, displayName: fullName.trim(), email: email.trim() }),
        })
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  // Loading token check
  if (validToken === null) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'2rem', height:'2rem', border:'3px solid rgba(34,85,14,0.2)', borderTop:'3px solid rgb(34,85,14)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  // Invalid token
  if (!validToken) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)', padding:'2rem' }}>
      <div className="card" style={{ padding:'3rem', maxWidth:'24rem', width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔒</div>
        <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
          Invalid Invite Link
        </h1>
        <p style={{ color:'rgb(107,107,88)', lineHeight:1.7 }}>
          This link is invalid or has expired. Contact the AceForge team for a valid invite link.
        </p>
      </div>
    </div>
  )

  // Success screen
  if (success) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)', padding:'2rem' }}>
      <div className="card" style={{ padding:'3rem', maxWidth:'26rem', width:'100%', textAlign:'center' }}>
        <div style={{ width:'4rem', height:'4rem', borderRadius:'50%', background:'rgb(234,243,222)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
          <CheckCircle style={{ width:'2rem', height:'2rem', color:'rgb(59,109,17)' }} />
        </div>
        <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
          Check your email! 📬
        </h1>
        <p style={{ color:'rgb(107,107,88)', lineHeight:1.7, marginBottom:'1.5rem' }}>
          We sent a confirmation link to <strong style={{ color:'rgb(26,26,20)' }}>{email}</strong>. Click it to activate your admin account.
        </p>
        <Link href="/login" className="btn-primary" style={{ display:'flex', justifyContent:'center', textDecoration:'none' }}>
          Go to Login →
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem 1.5rem' }}>
      <div style={{ width:'100%', maxWidth:'26rem' }}>

        <Link href="/" style={{ display:'flex', alignItems:'center', gap:'0.5rem', textDecoration:'none', justifyContent:'center', marginBottom:'2rem' }}>
          <div style={{ width:'2.25rem', height:'2.25rem', borderRadius:'0.625rem', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BookOpen style={{ width:'1.125rem', height:'1.125rem', color:'white' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily:'Fraunces, Georgia, serif', fontWeight:700, fontSize:'1.25rem', color:'rgb(34,85,14)' }}>AceForge</span>
        </Link>

        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:'3.5rem', height:'3.5rem', borderRadius:'50%', background:'rgba(34,85,14,0.08)', border:'2px solid rgba(34,85,14,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
            <Shield style={{ width:'1.5rem', height:'1.5rem', color:'rgb(34,85,14)' }} />
          </div>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
            Admin Account Setup
          </h1>
          <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>
            You have been invited to join AceForge as an admin.
          </p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.375rem', marginTop:'0.75rem', padding:'0.375rem 0.875rem', borderRadius:'9999px', background:'rgba(34,85,14,0.08)', border:'1px solid rgba(34,85,14,0.2)' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(34,85,14)', fontFamily:'Syne, sans-serif' }}>🔒 Invite-only access verified</span>
          </div>
        </div>

        <div className="card" style={{ padding:'2rem' }}>
          {error && (
            <div className="alert-error" style={{ marginBottom:'1.25rem' }}>
              <AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label className="label">Full Name *</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className="input" placeholder="Your full name" required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="At least 8 characters" required />
            </div>
            <div>
              <label className="label">Confirm Password *</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" placeholder="Repeat your password" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.875rem', fontSize:'1rem' }}>
              {loading ? 'Creating account...' : 'Create Admin Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem', color:'rgb(107,107,88)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default function AdminSignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>Loading...</div>}>
      <AdminSignupInner />
    </Suspense>
  )
}
