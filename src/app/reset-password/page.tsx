'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    { label:'At least 8 characters', pass: password.length >= 8 },
    { label:'At least one number', pass: /\d/.test(password) },
    { label:'At least one special character', pass: /[^a-zA-Z0-9]/.test(password) },
  ]

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

  if (success) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div style={{ textAlign:'center', maxWidth:'24rem' }}>
        <div style={{ width:'4rem', height:'4rem', borderRadius:'50%', background:'rgb(234,243,222)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}>
          <CheckCircle style={{ width:'2rem', height:'2rem', color:'rgb(59,109,17)' }} />
        </div>
        <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>Password updated!</h1>
        <p style={{ color:'rgb(107,107,88)' }}>Redirecting you to sign in...</p>
      </div>
    </div>
  )

  if (!ready) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div style={{ textAlign:'center', maxWidth:'24rem' }}>
        <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>Invalid or expired link</h1>
        <p style={{ color:'rgb(107,107,88)', marginBottom:'1.5rem' }}>This link has expired or already been used.</p>
        <Link href="/forgot-password" className="btn-primary" style={{ display:'inline-flex' }}>Request a new link</Link>
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
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>Set new password</h1>
        </div>

        <div className="card" style={{ padding:'2rem' }}>
          {error && <div className="alert-error" style={{ marginBottom:'1.25rem' }}><AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />{error}</div>}
          <form onSubmit={handleReset} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div>
              <label className="label">New Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input" placeholder="••••••••" required style={{ paddingRight:'3rem' }} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:'rgb(107,107,88)' }}>
                  {showPassword ? <EyeOff style={{ width:'1.125rem', height:'1.125rem' }} /> : <Eye style={{ width:'1.125rem', height:'1.125rem' }} />}
                </button>
              </div>
              {password.length > 0 && (
                <ul style={{ listStyle:'none', padding:0, margin:'0.5rem 0 0', display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                  {checks.map(c => (
                    <li key={c.label} style={{ display:'flex', alignItems:'center', gap:'0.375rem', fontSize:'0.75rem', color: c.pass ? 'rgb(59,109,17)' : 'rgb(107,107,88)' }}>
                      <CheckCircle style={{ width:'0.75rem', height:'0.75rem' }} />{c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className={`input${confirm.length > 0 && confirm !== password ? ' input-error' : ''}`}
                placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}