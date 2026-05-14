'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const passwordChecks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'At least one number', pass: /\d/.test(password) },
    { label: 'At least one special character', pass: /[^a-zA-Z0-9]/.test(password) },
  ]
  const passwordValid = passwordChecks.every(c => c.pass)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordValid) { setError('Please meet all password requirements.'); return }
    setError(''); setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSuccess(true); setLoading(false) }
  }

  if (success) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div style={{ width:'100%', maxWidth:'26rem', textAlign:'center' }}>
        <div style={{ width:'4rem', height:'4rem', borderRadius:'50%', background:'rgb(234,243,222)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}>
          <CheckCircle style={{ width:'2rem', height:'2rem', color:'rgb(59,109,17)' }} />
        </div>
        <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>Check your inbox!</h1>
        <p style={{ color:'rgb(107,107,88)', lineHeight:1.7, marginBottom:'2rem' }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back to sign in.
        </p>
        <Link href="/login" className="btn-primary" style={{ display:'inline-flex', justifyContent:'center' }}>Go to Sign In</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div style={{ width:'100%', maxWidth:'26rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <Link href="/" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', textDecoration:'none', marginBottom:'1.5rem' }}>
            <div style={{ width:'2.5rem', height:'2.5rem', borderRadius:'0.75rem', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <BookOpen style={{ width:'1.25rem', height:'1.25rem', color:'white' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily:'Fraunces, Georgia, serif', fontWeight:700, fontSize:'1.25rem', color:'rgb(34,85,14)' }}>StudySpark</span>
          </Link>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>Create your account</h1>
          <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>Start studying smarter today — free</p>
        </div>

        <div className="card" style={{ padding:'2rem' }}>
          {error && (
            <div className="alert-error" style={{ marginBottom:'1.25rem' }}>
              <AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0, marginTop:'0.125rem' }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
                className="input" placeholder="Jane Smith" required />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div style={{ position:'relative' }}>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} className="input"
                  placeholder="••••••••" required style={{ paddingRight:'3rem' }} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:'rgb(107,107,88)' }}>
                  {showPassword ? <EyeOff style={{ width:'1.125rem', height:'1.125rem' }} /> : <Eye style={{ width:'1.125rem', height:'1.125rem' }} />}
                </button>
              </div>
              {password.length > 0 && (
                <ul style={{ listStyle:'none', padding:0, margin:'0.625rem 0 0', display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                  {passwordChecks.map(c => (
                    <li key={c.label} style={{ display:'flex', alignItems:'center', gap:'0.375rem', fontSize:'0.75rem', color: c.pass ? 'rgb(59,109,17)' : 'rgb(107,107,88)' }}>
                      <CheckCircle style={{ width:'0.75rem', height:'0.75rem' }} />{c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:'0.5rem' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.9375rem', color:'rgb(107,107,88)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}