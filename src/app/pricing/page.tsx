import { createServerSupabaseClient } from '@/lib/supabase-server'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { CheckCircle, Zap } from 'lucide-react'
import type { Profile } from '@/types'
import UpgradeButton from '@/components/premium/UpgradeButton'

export default async function PricingPage() {
  let profile: Profile | null = null
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      profile = data
    }
  } catch {}

  const FREE = [
    'Up to 12 questions per set'
    '2 question sets per day',
    '2 worksheets per day',
    'All subjects & grade levels',
    'Session history',
    'PDF download',
    '30-second generation wait',
  ]

  const PREMIUM = [
    'Up to 30 questions per set'
    'Unlimited question sets',
    'Unlimited worksheets',
    'All subjects & grade levels',
    'Session history',
    'PDF download',
    '~15 second generation',
    'Priority support',
    'Early access to new features',
  ]

  const COMPARISON = [
     { feature: 'Max Questions / sheet', free: '12', premium: '30' },
    { feature: 'Questions / day', free: '2', premium: 'Unlimited' },
    { feature: 'Worksheets / day', free: '2', premium: 'Unlimited' },
    { feature: 'Generation wait', free: '30 seconds ⏱', premium: '~15 seconds ⚡' },
    { feature: 'Session history', free: '✓', premium: '✓' },
    { feature: 'PDF download', free: '✓', premium: '✓' },
    { feature: 'All subjects & grades', free: '✓', premium: '✓' },
    { feature: 'Custom profile picture', free: '✓', premium: '✓' },
    { feature: 'Priority support', free: '✗', premium: '✓' },
    { feature: 'Early access to features', free: '✗', premium: '✓' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} />

      <div style={{ paddingTop:'6rem', paddingBottom:'5rem', padding:'6rem 1.5rem 5rem' }}>
        <div className="container-base" style={{ maxWidth:'56rem' }}>

          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'4rem' }}>
            <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(34,85,14)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.75rem' }}>Pricing</p>
            <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'clamp(2rem,5vw,3rem)', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1rem' }}>
              Simple, honest pricing
            </h1>
            <p style={{ color:'rgb(107,107,88)', fontSize:'1.0625rem', maxWidth:'32rem', margin:'0 auto' }}>
              Start free, upgrade when you need more. No hidden fees, cancel anytime.
            </p>
          </div>

          {/* Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'1.5rem', marginBottom:'3rem' }}>

            {/* Free */}
            <div className="card" style={{ padding:'2.5rem' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>Free</h2>
              <div style={{ fontSize:'2.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'2rem' }}>
                $0
                <span style={{ fontSize:'1rem', fontWeight:400, color:'rgb(107,107,88)' }}> / month</span>
              </div>
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 2rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                {FREE.map(f => (
                  <li key={f} style={{ display:'flex', alignItems:'center', gap:'0.625rem', fontSize:'0.9375rem', color:'rgb(107,107,88)' }}>
                    <CheckCircle style={{ width:'1rem', height:'1rem', color:'rgb(59,109,17)', flexShrink:0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              {profile ? (
                profile.is_premium ? (
                  <div style={{ textAlign:'center', padding:'0.875rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.05)', color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>
                    You're on Premium
                  </div>
                ) : (
                  <div style={{ textAlign:'center', padding:'0.875rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.05)', color:'rgb(34,85,14)', fontWeight:600, fontSize:'0.9375rem' }}>
                    Your current plan ✓
                  </div>
                )
              ) : (
                <Link href="/signup" className="btn-secondary" style={{ width:'100%', justifyContent:'center' }}>
                  Get started free
                </Link>
              )}
            </div>

            {/* Premium */}
            <div className="card" style={{ padding:'2.5rem', border:'2px solid rgb(34,85,14)', position:'relative', boxShadow:'0 8px 32px rgba(34,85,14,0.12)' }}>
              <div style={{ position:'absolute', top:'-0.875rem', left:'50%', transform:'translateX(-50%)', background:'rgb(34,85,14)', color:'white', fontSize:'0.75rem', fontWeight:700, padding:'0.375rem 1.25rem', borderRadius:'9999px', whiteSpace:'nowrap' }}>
                MOST POPULAR
              </div>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                Premium <span style={{ color:'rgb(217,119,6)' }}>⚡</span>
              </h2>
              <div style={{ fontSize:'2.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
                $5.99
                <span style={{ fontSize:'1rem', fontWeight:400, color:'rgb(107,107,88)' }}> / month</span>
              </div>
              <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)', marginBottom:'2rem' }}>Billed monthly · Cancel anytime</p>
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 2rem', display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                {PREMIUM.map(f => (
                  <li key={f} style={{ display:'flex', alignItems:'center', gap:'0.625rem', fontSize:'0.9375rem', color:'rgb(26,26,20)' }}>
                    <CheckCircle style={{ width:'1rem', height:'1rem', color:'rgb(34,85,14)', flexShrink:0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              {profile?.is_premium ? (
                <div style={{ textAlign:'center', padding:'0.875rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.06)', color:'rgb(34,85,14)', fontWeight:600, fontSize:'0.9375rem' }}>
                  Your current plan ✓
                </div>
              ) : profile ? (
                <UpgradeButton />
              ) : (
                <Link href="/signup?plan=premium" className="btn-primary" style={{ width:'100%', justifyContent:'center', boxShadow:'0 4px 16px rgba(34,85,14,0.2)' }}>
                  <Zap style={{ width:'1rem', height:'1rem' }} />
                  Get Started →
                </Link>
              )}
            </div>
          </div>

          {/* Comparison table */}
          <div className="card" style={{ overflow:'hidden', marginBottom:'2rem' }}>
            <div style={{ padding:'1.5rem 2rem', borderBottom:'1px solid rgba(34,85,14,0.08)' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)' }}>Full comparison</h2>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'rgba(34,85,14,0.03)' }}>
                    <th style={{ padding:'1rem 2rem', textAlign:'left', fontSize:'0.8125rem', fontWeight:600, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Feature</th>
                    <th style={{ padding:'1rem 1.5rem', textAlign:'center', fontSize:'0.8125rem', fontWeight:600, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Free</th>
                    <th style={{ padding:'1rem 1.5rem', textAlign:'center', fontSize:'0.8125rem', fontWeight:700, color:'rgb(34,85,14)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Premium ⚡</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} style={{ borderTop:'1px solid rgba(34,85,14,0.06)', background: i % 2 === 0 ? 'white' : 'rgba(34,85,14,0.01)' }}>
                      <td style={{ padding:'1rem 2rem', fontSize:'0.9375rem', color:'rgb(26,26,20)', fontWeight:500 }}>{row.feature}</td>
                      <td style={{ padding:'1rem 1.5rem', textAlign:'center', fontSize:'0.9375rem', color: row.free === '✗' ? 'rgb(209,213,219)' : 'rgb(107,107,88)' }}>{row.free}</td>
                      <td style={{ padding:'1rem 1.5rem', textAlign:'center', fontSize:'0.9375rem', color: row.premium === '✗' ? 'rgb(209,213,219)' : 'rgb(34,85,14)', fontWeight: row.premium !== '✓' && row.premium !== '✗' ? 600 : 400 }}>{row.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ textAlign:'center', fontSize:'0.9375rem', color:'rgb(107,107,88)' }}>
            🔒 Secure payment via Stripe · Cancel any time from your account settings
          </p>

        </div>
      </div>
    </div>
  )
}