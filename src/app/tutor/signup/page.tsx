'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Eye, EyeOff, X, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const INDIGO = 'rgb(99,102,241)'
const PURPLE = 'rgb(139,92,246)'
const BASE_BG = 'linear-gradient(135deg, rgb(10,10,20), rgb(15,15,30), rgb(18,15,35))'
const TEXT2 = 'rgba(255,255,255,0.6)'

const BENEFITS = [
  'Earn $30/hr on your schedule',
  'Teach subjects you love',
  'Students come to you',
]
const FLOAT_PILLS = [
  { label: 'Math', top: '12%', left: '10%', d: '0s' },
  { label: 'Science', top: '26%', left: '58%', d: '1.1s' },
  { label: 'SAT', top: '48%', left: '16%', d: '2s' },
  { label: 'Physics', top: '64%', left: '52%', d: '0.6s' },
  { label: 'Essay', top: '80%', left: '20%', d: '1.6s' },
]

function TutorBadge() {
  return (
    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.08em', color: 'white', background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>TUTOR</span>
  )
}

export default function TutorSignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
          data: { display_name: fullName.trim(), role: 'tutor_pending' },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/tutor/apply`,
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Store role intent in a separate table so callback can pick it up
        await supabase.from('signup_intents').upsert({
          email: email.trim().toLowerCase(),
          role: 'tutor_pending',
          display_name: fullName.trim(),
        })
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  const isPending = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('verified') === 'pending'

  if (isPending || success) return (
    <div style={{ minHeight: '100vh', background: BASE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div className="ts-fade" style={{ width: '100%', maxWidth: '26rem', textAlign: 'center' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: '1.125rem', height: '1.125rem', color: 'white' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.25rem', color: 'white' }}>AceForge</span>
          <TutorBadge />
        </Link>
        <div style={{ padding: '3rem 2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '1.25rem' }}>
          <div className="ts-pop" style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle style={{ width: '2rem', height: '2rem', color: 'rgb(74,222,128)' }} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
            Check your email! 📬
          </h1>
          <p style={{ color: TEXT2, lineHeight: 1.7, marginBottom: '0.5rem' }}>
            We sent a confirmation link to <strong style={{ color: 'white' }}>{email}</strong>.
          </p>
          <p style={{ color: TEXT2, lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Click the link to confirm your account. You will then be directed to complete your tutor application.
          </p>
          <Link href="/login" className="ts-cta" style={{ textDecoration: 'none' }}>Go to Login →</Link>
        </div>
      </div>
      <style>{tsStyles}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: BASE_BG }}>

      {/* ── LEFT: decorative ── */}
      <div className="ts-deco" style={{ flex: '0 0 40%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, rgb(20,16,44), rgb(34,22,60))', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {FLOAT_PILLS.map(p => (
            <span key={p.label} style={{ position: 'absolute', top: p.top, left: p.left, padding: '0.5rem 0.875rem', borderRadius: '9999px', background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', animation: `tsFloat 6s ease-in-out ${p.d} infinite` }}>{p.label}</span>
          ))}
        </div>

        <div style={{ position: 'relative', maxWidth: '24rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem' }}>
            <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.875rem', background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen style={{ width: '1.375rem', height: '1.375rem', color: 'white' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.5rem' }}>AceForge</span>
            <TutorBadge />
          </div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.15, marginBottom: '1.75rem' }}>Join as a Tutor</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {BENEFITS.map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.9)' }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '0.875rem 1.125rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>500+</p>
              <p style={{ fontSize: '0.75rem', color: TEXT2 }}>students waiting</p>
            </div>
            <div style={{ padding: '0.875rem 1.125rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>$2,000+</p>
              <p style={{ fontSize: '0.75rem', color: TEXT2 }}>top tutors earn / mo</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: form ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem' }}>
        <div className="ts-fade" style={{ width: '100%', maxWidth: '420px' }}>

          <Link href="/" className="ts-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.5rem', justifyContent: 'center' }}>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen style={{ width: '1.125rem', height: '1.125rem', color: 'white' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.25rem', color: 'white' }}>AceForge</span>
            <TutorBadge />
          </Link>

          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.875rem', fontWeight: 700, color: 'white', marginBottom: '0.375rem' }}>Create Tutor Account</h1>
          <p style={{ color: TEXT2, fontSize: '0.9375rem', marginBottom: '1.75rem' }}>Start your application after signing up</p>

          {error && (
            <div className="ts-err" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'rgb(248,113,113)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              <X style={{ width: '1rem', height: '1rem', flexShrink: 0 }} /> {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div className="ts-field" style={{ animationDelay: '0.05s' }}>
              <label style={tsLabel}>Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className="ts-input" placeholder="Your full legal name" required />
            </div>
            <div className="ts-field" style={{ animationDelay: '0.1s' }}>
              <label style={tsLabel}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="ts-input" placeholder="you@example.com" required />
            </div>
            <div className="ts-field" style={{ animationDelay: '0.15s' }}>
              <label style={tsLabel}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="ts-input" style={{ paddingRight: '3rem' }} placeholder="At least 8 characters" required />
                <button type="button" onClick={() => setShowPassword(s => !s)} style={tsEye}>
                  {showPassword ? <EyeOff style={{ width: '1.125rem', height: '1.125rem' }} /> : <Eye style={{ width: '1.125rem', height: '1.125rem' }} />}
                </button>
              </div>
            </div>
            <div className="ts-field" style={{ animationDelay: '0.2s' }}>
              <label style={tsLabel}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="ts-input" style={{ paddingRight: '3rem' }} placeholder="Repeat your password" required />
                <button type="button" onClick={() => setShowConfirm(s => !s)} style={tsEye}>
                  {showConfirm ? <EyeOff style={{ width: '1.125rem', height: '1.125rem' }} /> : <Eye style={{ width: '1.125rem', height: '1.125rem' }} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="ts-field ts-cta" style={{ animationDelay: '0.25s' }}>
              {loading ? 'Creating account...' : <>Create Account <span className="ts-arrow">→</span></>}
            </button>
          </form>

          <p style={{ fontSize: '0.8125rem', color: TEXT2, lineHeight: 1.6, marginTop: '1rem', textAlign: 'center' }}>
            After creating your account, you'll complete a brief application. By continuing you agree to AceForge's{' '}
            <Link href="/terms" style={{ color: 'rgb(165,180,252)', fontWeight: 600, textDecoration: 'none' }}>Terms</Link> and{' '}
            <Link href="/tutoring/legal" style={{ color: 'rgb(165,180,252)', fontWeight: 600, textDecoration: 'none' }}>Tutor Policy</Link>.
          </p>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9375rem', color: TEXT2 }}>
            Already have an account? <Link href="/login" style={{ color: 'rgb(165,180,252)', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: '0.625rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
            Want to study instead? <Link href="/signup" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, textDecoration: 'none' }}>Sign up as a student</Link>
          </p>
        </div>
      </div>

      <style>{tsStyles}</style>
    </div>
  )
}

const tsLabel: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }
const tsEye: React.CSSProperties = { position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }

const tsStyles = `
  @keyframes tsFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
  @keyframes tsFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes tsField { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes tsErr { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes tsPop { 0% { opacity: 0; transform: scale(0.6); } 60% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
  .ts-fade { animation: tsFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .ts-field { animation: tsField 0.5s ease both; }
  .ts-err { animation: tsErr 0.3s ease both; }
  .ts-pop { animation: tsPop 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .ts-input {
    width: 100%; box-sizing: border-box; height: 48px; padding: 0 1rem; border-radius: 0.75rem;
    background: rgba(255,255,255,0.06); border: 1.5px solid rgba(99,102,241,0.25); color: white;
    font-size: 0.9375rem; outline: none; transition: border-color 0.15s ease, box-shadow 0.15s ease; color-scheme: dark;
  }
  .ts-input::placeholder { color: rgba(255,255,255,0.35); }
  .ts-input:focus { border-color: rgba(99,102,241,0.6); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
  .ts-cta {
    width: 100%; height: 52px; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    border-radius: 0.75rem; border: none; color: white; font-weight: 700; font-size: 1rem; cursor: pointer;
    background: linear-gradient(135deg, rgb(99,102,241), rgb(139,92,246));
    transition: filter 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }
  .ts-cta:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
  .ts-cta:disabled { cursor: wait; opacity: 0.7; }
  .ts-arrow { display: inline-block; transition: transform 0.2s ease; }
  .ts-cta:hover .ts-arrow { transform: translateX(3px); }
  @media (max-width: 860px) {
    .ts-deco { display: none !important; }
    .ts-mobile-logo { display: inline-flex !important; }
  }
`
