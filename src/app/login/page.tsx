'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const GREEN = 'rgb(34,85,14)'
const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'

const FEATURES = [
  'AI-generated questions for any subject',
  'Expert tutors on demand',
  'Track your progress with XP',
]
const FLOAT_SUBJECTS = [
  { label: '📐 Calculus', top: '14%', left: '8%', delay: '0s' },
  { label: '🧬 Biology', top: '30%', left: '58%', delay: '1.2s' },
  { label: '📖 SAT Reading', top: '62%', left: '12%', delay: '2.1s' },
  { label: '🎯 SAT Math', top: '74%', left: '55%', delay: '0.7s' },
]

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
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── DECORATIVE PANEL (left) ── */}
      <div className="auth-deco" style={{ flex: '0 0 40%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgb(20,50,10), rgb(34,85,14))', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem' }}>
        {/* floating subject cards */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {FLOAT_SUBJECTS.map(s => (
            <span key={s.label} style={{ position: 'absolute', top: s.top, left: s.left, padding: '0.5rem 0.875rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', animation: `authFloat 6s ease-in-out ${s.delay} infinite` }}>{s.label}</span>
          ))}
        </div>

        <div style={{ position: 'relative', maxWidth: '22rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem' }}>
            <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen style={{ width: '1.375rem', height: '1.375rem', color: 'white' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.5rem' }}>AceForge</span>
          </div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '2rem' }}>Study smarter.<br />Score higher.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.9)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FORM PANEL (right) ── */}
      <div className="auth-form-panel" style={{ flex: 1, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <div className="auth-form-in" style={{ width: '100%', maxWidth: '400px' }}>

          {/* Mobile logo */}
          <Link href="/" className="auth-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.5rem', justifyContent: 'center' }}>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen style={{ width: '1.125rem', height: '1.125rem', color: 'white' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.25rem', color: GREEN }}>AceForge</span>
          </Link>

          <div className="auth-field" style={{ animationDelay: '0.02s', marginBottom: '1.75rem' }}>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, marginBottom: '0.375rem' }}>Welcome back 👋</h1>
            <p style={{ color: MUTED, fontSize: '0.9375rem' }}>Sign in to continue your learning journey</p>
          </div>

          {error && (
            <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.08)', border: '1px solid rgba(163,45,45,0.25)', color: 'rgb(163,45,45)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              <X style={{ width: '1rem', height: '1rem', flexShrink: 0 }} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div className="auth-field" style={{ animationDelay: '0.07s' }}>
              <label style={authLabel} htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="auth-input" style={authInput} placeholder="you@example.com" required autoComplete="email" />
            </div>

            <div className="auth-field" style={{ animationDelay: '0.12s' }}>
              <label style={authLabel} htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} className="auth-input" style={{ ...authInput, paddingRight: '3rem' }}
                  placeholder="••••••••" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <EyeOff style={{ width: '1.125rem', height: '1.125rem' }} /> : <Eye style={{ width: '1.125rem', height: '1.125rem' }} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <Link href="/forgot-password" style={{ fontSize: '0.8125rem', color: GREEN, textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-field auth-cta" style={{ animationDelay: '0.17s', ...ctaStyle(loading) }}>
              {loading ? 'Signing in...' : <>Sign In <span className="auth-arrow">→</span></>}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-field" style={{ animationDelay: '0.2s', display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(34,85,14,0.12)' }} />
            <span style={{ fontSize: '0.8125rem', color: MUTED }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(34,85,14,0.12)' }} />
          </div>

          <button type="button" onClick={handleGoogleLogin} className="auth-field"
            style={{ animationDelay: '0.24s', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', height: '48px', borderRadius: '0.875rem', border: '1.5px solid rgba(34,85,14,0.2)', background: 'white', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600, color: INK }}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z" />
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
            </svg>
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9375rem', color: MUTED }}>
            Don't have an account? <Link href="/signup" style={{ color: GREEN, fontWeight: 700, textDecoration: 'none' }}>Sign up →</Link>
          </p>
        </div>
      </div>

      <style>{authStyles}</style>
    </div>
  )
}

const authLabel: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgb(26,26,20)', marginBottom: '0.4rem' }
const authInput: React.CSSProperties = { width: '100%', boxSizing: 'border-box', height: '48px', padding: '0 1rem', borderRadius: '0.875rem', border: '1.5px solid rgba(34,85,14,0.18)', outline: 'none', fontSize: '0.9375rem', color: 'rgb(26,26,20)', background: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }
function ctaStyle(loading: boolean): React.CSSProperties {
  return { width: '100%', height: '52px', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '0.875rem', border: 'none', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'wait' : 'pointer', background: 'linear-gradient(135deg, rgb(34,85,14), rgb(59,130,46))' }
}
const authStyles = `
  @keyframes authFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
  @keyframes authFieldIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes authErrIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .auth-field { animation: authFieldIn 0.45s ease both; }
  .auth-error { animation: authErrIn 0.3s ease both; }
  .auth-input:focus { border-color: rgb(34,85,14); box-shadow: 0 0 0 3px rgba(34,85,14,0.12); }
  .auth-cta { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .auth-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(34,85,14,0.3); }
  .auth-cta:hover .auth-arrow { display: inline-block; transform: translateX(3px); transition: transform 0.2s ease; }
  .auth-arrow { display: inline-block; transition: transform 0.2s ease; }
  @media (max-width: 860px) {
    .auth-deco { display: none !important; }
    .auth-mobile-logo { display: inline-flex !important; }
  }
`
