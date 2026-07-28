'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, X, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const GREEN = 'rgb(34,85,14)'
const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'

const TESTIMONIALS = [
  { quote: 'AceForge helped me go from a 1200 to 1450 on the SAT!', name: 'Sarah K.', initial: 'S' },
  { quote: 'The AI questions are incredibly accurate to real exams.', name: 'Marcus T.', initial: 'M' },
  { quote: 'Found an amazing calculus tutor in minutes.', name: 'Priya S.', initial: 'P' },
]

export default function SignupPage() {
  // Consent is captured passively via the terms note under the button.
  const [agreed] = useState(true)
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

  // Strength score (0-4) for the visual bars.
  const strengthCriteria = [password.length >= 8, /\d/.test(password), /[^a-zA-Z0-9]/.test(password), password.length >= 12]
  const strength = strengthCriteria.filter(Boolean).length
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = strength <= 1 ? 'rgb(220,38,38)' : strength === 2 ? 'rgb(217,119,6)' : strength === 3 ? 'rgb(202,138,4)' : GREEN

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setError('Please agree to the Terms of Service and Privacy Policy.'); return }
    if (!passwordValid) { setError('Password must be 8+ characters with a number and a symbol.'); return }
    setError(''); setLoading(true)
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const rawNext = params.get('next')
    const next = (rawNext && rawNext.startsWith('/'))
      ? rawNext
      : (params.get('challenge') ? `/arena/challenge/${params.get('challenge')}` : '/dashboard')
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, display_name: name, role: 'user' }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (!error && data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, display_name: name, email, role: 'user' })
    }
    if (error) { setError(error.message); setLoading(false) }
    else if (data.session) {
      // Auto-confirm enabled — session is live, go straight to the challenge.
      router.push(next); router.refresh()
    }
    else { setSuccess(true); setLoading(false) }
  }

  async function handleGoogleSignup() {
    if (!agreed) { setError('Please agree to the Terms of Service and Privacy Policy first.'); return }
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const rawNext = params.get('next')
    const next = (rawNext && rawNext.startsWith('/'))
      ? rawNext
      : (params.get('challenge') ? `/arena/challenge/${params.get('challenge')}` : '/dashboard')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }

  if (success) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '26rem', textAlign: 'center' }}>
        <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgb(234,243,222)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle style={{ width: '2rem', height: '2rem', color: 'rgb(59,109,17)' }} />
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.875rem', fontWeight: 700, color: INK, marginBottom: '0.75rem' }}>Check your inbox!</h1>
        <p style={{ color: MUTED, lineHeight: 1.7, marginBottom: '2rem' }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back to sign in.
        </p>
        <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>Go to Sign In</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── FORM PANEL (left) ── */}
      <div className="auth-form-panel" style={{ flex: 1, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <Link href="/" className="auth-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.5rem', justifyContent: 'center' }}>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen style={{ width: '1.125rem', height: '1.125rem', color: 'white' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.25rem', color: GREEN }}>AceForge</span>
          </Link>

          <div className="auth-field" style={{ animationDelay: '0.02s', marginBottom: '1.75rem' }}>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, marginBottom: '0.375rem' }}>Create your account</h1>
            <p style={{ color: MUTED, fontSize: '0.9375rem' }}>Join thousands of students acing their exams</p>
          </div>

          {error && (
            <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.08)', border: '1px solid rgba(163,45,45,0.25)', color: 'rgb(163,45,45)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              <X style={{ width: '1rem', height: '1rem', flexShrink: 0 }} /> {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div className="auth-field" style={{ animationDelay: '0.06s' }}>
              <label style={authLabel} htmlFor="name">Full name</label>
              <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="auth-input" style={authInput} placeholder="Jane Smith" required />
            </div>
            <div className="auth-field" style={{ animationDelay: '0.11s' }}>
              <label style={authLabel} htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" style={authInput} placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="auth-field" style={{ animationDelay: '0.16s' }}>
              <label style={authLabel} htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} className="auth-input" style={{ ...authInput, paddingRight: '3rem' }}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <EyeOff style={{ width: '1.125rem', height: '1.125rem' }} /> : <Eye style={{ width: '1.125rem', height: '1.125rem' }} />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: '0.625rem' }}>
                  <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem' }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: '5px', borderRadius: '9999px', background: i < strength ? strengthColor : 'rgba(34,85,14,0.12)', transition: 'background 0.3s ease' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: strengthColor }}>
                    {strengthLabel}<span style={{ fontWeight: 400, color: MUTED }}> — use 8+ characters, a number, and a symbol</span>
                  </p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="auth-field auth-cta" style={{ animationDelay: '0.21s', ...ctaStyle(loading) }}>
              {loading ? 'Creating account...' : <>Create Account <span className="auth-arrow">→</span></>}
            </button>
          </form>

          <p className="auth-field" style={{ animationDelay: '0.24s', fontSize: '0.75rem', color: MUTED, lineHeight: 1.6, marginTop: '0.875rem', textAlign: 'center' }}>
            By signing up you agree to our{' '}
            <a href="/terms" target="_blank" style={{ color: GREEN, fontWeight: 600, textDecoration: 'none' }}>Terms of Service</a> and{' '}
            <a href="/privacy" target="_blank" style={{ color: GREEN, fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>.
          </p>

          {/* Divider */}
          <div className="auth-field" style={{ animationDelay: '0.27s', display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(34,85,14,0.12)' }} />
            <span style={{ fontSize: '0.8125rem', color: MUTED }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(34,85,14,0.12)' }} />
          </div>

          <button type="button" onClick={handleGoogleSignup} className="auth-field"
            style={{ animationDelay: '0.3s', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', height: '48px', borderRadius: '0.875rem', border: '1.5px solid rgba(34,85,14,0.2)', background: 'white', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600, color: INK }}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z" />
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
            </svg>
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9375rem', color: MUTED }}>
            Already have an account? <Link href="/login" style={{ color: GREEN, fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
      </div>

      {/* ── DECORATIVE PANEL (right) ── */}
      <div className="auth-deco" style={{ flex: '0 0 40%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgb(20,50,10), rgb(34,85,14))', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ maxWidth: '24rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.375rem' }}>AceForge</span>
          </div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '1.75rem' }}>Join 10,000+ students</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="auth-testimonial" style={{ animationDelay: `${0.15 + i * 0.12}s`, padding: '1.125rem 1.25rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>{t.initial}</div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{t.name}</span>
                </div>
              </div>
            ))}
          </div>
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
  @keyframes authFieldIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes authErrIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes authSlideRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
  .auth-field { animation: authFieldIn 0.45s ease both; }
  .auth-error { animation: authErrIn 0.3s ease both; }
  .auth-testimonial { animation: authSlideRight 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .auth-input:focus { border-color: rgb(34,85,14); box-shadow: 0 0 0 3px rgba(34,85,14,0.12); }
  .auth-cta { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .auth-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(34,85,14,0.3); }
  .auth-cta:hover .auth-arrow { transform: translateX(3px); }
  .auth-arrow { display: inline-block; transition: transform 0.2s ease; }
  @media (max-width: 860px) {
    .auth-deco { display: none !important; }
    .auth-mobile-logo { display: inline-flex !important; }
  }
`
