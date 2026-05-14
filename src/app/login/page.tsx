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