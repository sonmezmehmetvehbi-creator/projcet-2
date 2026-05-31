'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const [agreed, setAgreed] = useState(false)
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
    if (!agreed) { setError('Please agree to the Terms of Service and Privacy Policy.'); return }
    if (!passwordValid) { setError('Please meet all password requirements.'); return }
    setError(''); setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, display_name: name, role: 'user' } },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (!error && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: name,
        email,
        role: 'user',
      })
    }
    if (error) { setError(error.message); setLoading(false) }
    else { setSuccess(true); setLoading(false) }
  }

  async function handleGoogleSignup() {
    if (!agreed) { setError('Please agree to the Terms of Service and Privacy Policy first.'); return }
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
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
            <span style={{ fontFamily:'Fraunces, Georgia, serif', fontWeight:700, fontSize:'1.25rem', color:'rgb(34,85,14)' }}>AceForge</span>
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

          {/* Terms agreement — shown at top so Google button requires it too */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.03)', border:'1px solid rgba(34,85,14,0.1)', marginBottom:'1.25rem' }}>
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ width:'1.125rem', height:'1.125rem', accentColor:'rgb(34,85,14)', flexShrink:0, marginTop:'0.125rem', cursor:'pointer' }}
            />
            <label htmlFor="agree" style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)', lineHeight:1.6, cursor:'pointer' }}>
              I agree to AceForge's{' '}
              <a href="/terms" target="_blank" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>Privacy Policy</a>.
              {' '}If I am under 13, I confirm my parent or guardian has reviewed and agreed on my behalf.
            </label>
          </div>

          {/* Google Sign Up */}
          <button type="button" onClick={handleGoogleSignup}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.75rem', padding:'0.75rem 1rem', borderRadius:'0.75rem', border:'1.5px solid rgba(34,85,14,0.2)', background:'white', cursor:'pointer', fontSize:'0.9375rem', fontWeight:500, color:'rgb(26,26,20)', marginBottom:'1.25rem', transition:'all 0.2s', opacity: agreed ? 1 : 0.5 }}
            onMouseEnter={e => { if (agreed) e.currentTarget.style.borderColor = 'rgba(34,85,14,0.5)' }}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(34,85,14,0.2)')}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.25rem' }}>
            <div style={{ flex:1, height:'1px', background:'rgba(34,85,14,0.1)' }} />
            <span style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>or</span>
            <div style={{ flex:1, height:'1px', background:'rgba(34,85,14,0.1)' }} />
          </div>

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

            <button type="submit" disabled={loading || !agreed} className="btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:'0.25rem' }}>
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