'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function TutorSignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
          data: { display_name: fullName.trim() },
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
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem 1.5rem' }}>
      <div style={{ width:'100%', maxWidth:'26rem', textAlign:'center' }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:'0.5rem', textDecoration:'none', justifyContent:'center', marginBottom:'2rem' }}>
          <div style={{ width:'2.25rem', height:'2.25rem', borderRadius:'0.625rem', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BookOpen style={{ width:'1.125rem', height:'1.125rem', color:'white' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily:'Fraunces, Georgia, serif', fontWeight:700, fontSize:'1.25rem', color:'rgb(34,85,14)' }}>AceForge</span>
        </Link>
        <div className="card" style={{ padding:'3rem' }}>
          <div style={{ width:'4rem', height:'4rem', borderRadius:'50%', background:'rgb(234,243,222)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
            <CheckCircle style={{ width:'2rem', height:'2rem', color:'rgb(59,109,17)' }} />
          </div>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
            Check your email! 📬
          </h1>
          <p style={{ color:'rgb(107,107,88)', lineHeight:1.7, marginBottom:'0.5rem' }}>
            We sent a confirmation link to <strong style={{ color:'rgb(26,26,20)' }}>{email}</strong>.
          </p>
          <p style={{ color:'rgb(107,107,88)', lineHeight:1.7, marginBottom:'1.5rem' }}>
            Click the link to confirm your account. You will then be directed to complete your tutor application.
          </p>
          <Link href="/login" className="btn-primary" style={{ display:'flex', justifyContent:'center', textDecoration:'none' }}>
            Go to Login →
          </Link>
        </div>
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
          <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🎓</div>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
            Join as a Tutor
          </h1>
          <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem', lineHeight:1.6 }}>
            Create your tutor account and start earning $30/hr on your own schedule.
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1.5rem' }}>
          {[
            '💰 Earn $30/hr — paid within 24hrs',
            '📅 Set your own availability',
            '🎓 Help students ace their exams',
            '🔒 All sessions on secure platform',
          ].map(b => (
            <div key={b} style={{ padding:'0.5rem 0.75rem', borderRadius:'0.625rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.08)' }}>
              <p style={{ fontSize:'0.875rem', color:'rgb(26,26,20)' }}>{b}</p>
            </div>
          ))}
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
              <input value={fullName} onChange={e => setFullName(e.target.value)} className="input" placeholder="Your full legal name" required />
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
            <div style={{ padding:'0.875rem 1rem', borderRadius:'0.875rem', background:'rgba(37,99,235,0.04)', border:'1px solid rgba(37,99,235,0.12)' }}>
              <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)', lineHeight:1.6 }}>
                By creating an account you agree to AceForge's{' '}
                <Link href="/terms" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/tutoring/legal" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>Tutor Policy</Link>.
              </p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.875rem', fontSize:'1rem' }}>
              {loading ? 'Creating account...' : 'Create Tutor Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem', color:'rgb(107,107,88)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>Log in</Link>
        </p>
        <p style={{ textAlign:'center', marginTop:'0.75rem', fontSize:'0.875rem', color:'rgb(107,107,88)' }}>
          Want to study instead?{' '}
          <Link href="/signup" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>Sign up as a student</Link>
        </p>
      </div>
    </div>
  )
}
