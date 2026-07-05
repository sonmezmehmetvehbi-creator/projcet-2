'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, KeyRound, Eye, EyeOff, CheckCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const GREEN = 'rgb(34,85,14)'
const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'At least one number', pass: /\d/.test(password) },
    { label: 'At least one special character', pass: /[^a-zA-Z0-9]/.test(password) },
  ]

  // Strength score (0-4) for the visual bars.
  const strengthCriteria = [password.length >= 8, /\d/.test(password), /[^a-zA-Z0-9]/.test(password), password.length >= 12]
  const strength = strengthCriteria.filter(Boolean).length
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = strength <= 1 ? 'rgb(220,38,38)' : strength === 2 ? 'rgb(234,88,12)' : strength === 3 ? 'rgb(202,138,4)' : GREEN

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (!checks.every(c => c.pass)) { setError('Please meet all password requirements.'); return }
    setError(''); setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else { setSuccess(true); setLoading(false); setTimeout(() => router.push('/login'), 2000) }
  }

  // ── Success state ──
  if (success) return (
    <div style={pageWrap}>
      <div className="rp-card" style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div className="rp-check" style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgb(234,243,222)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle style={{ width: '2rem', height: '2rem', color: 'rgb(59,109,17)' }} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: INK, marginBottom: '0.625rem' }}>Password updated!</h1>
          <p style={{ color: MUTED, fontSize: '0.9375rem', marginBottom: '1.75rem' }}>You can now sign in with your new password.</p>
          <Link href="/login" className="rp-cta" style={{ textDecoration: 'none' }}>Go to Login <span className="rp-arrow">→</span></Link>
        </div>
      </div>
      <style>{rpStyles}</style>
    </div>
  )

  // ── Invalid/expired link state ──
  if (!ready) return (
    <div style={pageWrap}>
      <div className="rp-card" style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(163,45,45,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <X style={{ width: '1.5rem', height: '1.5rem', color: 'rgb(163,45,45)' }} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: INK, marginBottom: '0.5rem' }}>Invalid or expired link</h1>
          <p style={{ color: MUTED, marginBottom: '1.5rem', fontSize: '0.9375rem' }}>This link has expired or already been used.</p>
          <Link href="/forgot-password" className="rp-cta" style={{ textDecoration: 'none' }}>Request a new link</Link>
        </div>
      </div>
      <style>{rpStyles}</style>
    </div>
  )

  // ── Form state ──
  return (
    <div style={pageWrap}>
      <div className="rp-card" style={{ width: '100%', maxWidth: '440px' }}>

        <Link href="/" className="rp-item" style={{ animationDelay: '0.02s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: '1.125rem', height: '1.125rem', color: 'white' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.25rem', color: GREEN }}>AceForge</span>
        </Link>

        <div className="rp-item" style={{ animationDelay: '0.06s', ...cardStyle }}>
          <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(34,85,14,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <KeyRound style={{ width: '1.375rem', height: '1.375rem', color: GREEN }} strokeWidth={2.25} />
          </div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: INK, textAlign: 'center', marginBottom: '0.5rem' }}>Set new password</h1>
          <p style={{ color: MUTED, fontSize: '0.9375rem', textAlign: 'center', marginBottom: '1.75rem' }}>Choose a strong password for your account</p>

          {error && (
            <div className="rp-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.08)', border: '1px solid rgba(163,45,45,0.25)', color: 'rgb(163,45,45)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              <X style={{ width: '1rem', height: '1rem', flexShrink: 0 }} /> {error}
            </div>
          )}

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={rpLabel}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="rp-input" style={{ ...rpInput, paddingRight: '3rem' }} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(s => !s)} style={eyeBtn}>
                  {showPassword ? <EyeOff style={{ width: '1.125rem', height: '1.125rem' }} /> : <Eye style={{ width: '1.125rem', height: '1.125rem' }} />}
                </button>
              </div>

              {password.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  {/* strength bars */}
                  <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem' }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: '5px', borderRadius: '9999px', background: i < strength ? strengthColor : 'rgba(34,85,14,0.12)', transition: 'background 0.3s ease' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: strengthColor, marginBottom: '0.625rem' }}>{strengthLabel}</p>
                  {/* requirements checklist */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {checks.map(c => (
                      <li key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: c.pass ? 'rgb(59,109,17)' : MUTED }}>
                        <CheckCircle style={{ width: '0.8125rem', height: '0.8125rem', flexShrink: 0 }} />{c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label style={rpLabel}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="rp-input" style={{ ...rpInput, paddingRight: '3rem', ...(confirm.length > 0 && confirm !== password ? { borderColor: 'rgb(163,45,45)' } : {}) }}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowConfirm(s => !s)} style={eyeBtn}>
                  {showConfirm ? <EyeOff style={{ width: '1.125rem', height: '1.125rem' }} /> : <Eye style={{ width: '1.125rem', height: '1.125rem' }} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="rp-cta">
              {loading ? 'Updating...' : <>Update Password <span className="rp-arrow">→</span></>}
            </button>
          </form>
        </div>
      </div>

      <style>{rpStyles}</style>
    </div>
  )
}

const pageWrap: React.CSSProperties = { minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }
const cardStyle: React.CSSProperties = { background: 'white', borderRadius: '1.25rem', boxShadow: '0 12px 40px rgba(34,85,14,0.1)', border: '1px solid rgba(34,85,14,0.06)', padding: '2.5rem 2rem' }
const rpLabel: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'rgb(26,26,20)', marginBottom: '0.4rem' }
const rpInput: React.CSSProperties = { width: '100%', boxSizing: 'border-box', height: '48px', padding: '0 1rem', borderRadius: '0.875rem', border: '1.5px solid rgba(34,85,14,0.18)', outline: 'none', fontSize: '0.9375rem', color: 'rgb(26,26,20)', background: 'white', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }
const eyeBtn: React.CSSProperties = { position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgb(107,107,88)', display: 'flex', alignItems: 'center' }

const rpStyles = `
  @keyframes rpFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rpItem { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rpErr { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rpPop { 0% { opacity: 0; transform: scale(0.6); } 60% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
  .rp-card { animation: rpFade 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .rp-item { animation: rpItem 0.5s ease both; }
  .rp-error { animation: rpErr 0.3s ease both; }
  .rp-check { animation: rpPop 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .rp-input:focus { border-color: rgb(34,85,14); box-shadow: 0 0 0 3px rgba(34,85,14,0.12); }
  .rp-cta {
    width: 100%; height: 52px; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    border-radius: 0.875rem; border: none; color: white; font-weight: 700; font-size: 1rem; cursor: pointer;
    background: linear-gradient(135deg, rgb(34,85,14), rgb(59,130,46));
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .rp-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(34,85,14,0.3); }
  .rp-cta:disabled { cursor: wait; }
  .rp-arrow { display: inline-block; transition: transform 0.2s ease; }
  .rp-cta:hover .rp-arrow { transform: translateX(3px); }
`
