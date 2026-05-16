'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
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
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>Welcome back</h1>
          <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ padding:'2rem' }}>
          {error && (
            <div className="alert-error" style={{ marginBottom:'1.25rem' }}>
              <AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0, marginTop:'0.125rem' }} />
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button type="button" onClick={handleGoogleLogin}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.75rem', padding:'0.75rem 1rem', borderRadius:'0.75rem', border:'1.5px solid rgba(34,85,14,0.2)', background:'white', cursor:'pointer', fontSize:'0.9375rem', fontWeight:500, color:'rgb(26,26,20)', marginBottom:'1.25rem', transition:'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(34,85,14,0.5)')}
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

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
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
                  placeholder="••••••••" required autoComplete="current-password"
                  style={{ paddingRight:'3rem' }} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:'rgb(107,107,88)', display:'flex', alignItems:'center' }}>
                  {showPassword ? <EyeOff style={{ width:'1.125rem', height:'1.125rem' }} /> : <Eye style={{ width:'1.125rem', height:'1.125rem' }} />}
                </button>
              </div>
              <div style={{ textAlign:'right', marginTop:'0.375rem' }}>
                <Link href="/forgot-password" style={{ fontSize:'0.8125rem', color:'rgb(34,85,14)', textDecoration:'none', fontWeight:500 }}>Forgot password?</Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:'0.5rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.9375rem', color:'rgb(107,107,88)' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>Sign up free</Link>
        </p>
      </div>
    </div>
  )
}