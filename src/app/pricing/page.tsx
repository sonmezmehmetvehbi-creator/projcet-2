import { createServerSupabaseClient } from '@/lib/supabase-server'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { CheckCircle, XCircle, Zap } from 'lucide-react'
import type { Profile } from '@/types'
import UpgradeButton from '@/components/premium/UpgradeButton'

const GREEN = 'rgb(34,85,14)'
const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'

// Free card: positives included, premium-only perks shown as excluded.
const FREE_ROWS = [
  { label: '2 AI questions per day', on: true },
  { label: '2 worksheets per day', on: true },
  { label: '1 SAT practice set per day', on: true },
  { label: 'Access to tutoring marketplace', on: true },
  { label: 'Basic progress tracking', on: true },
  { label: 'No wait time between generations', on: false },
  { label: 'Priority tutor matching', on: false },
  { label: 'Advanced analytics & XP tracking', on: false },
  { label: 'Ad-free experience', on: false },
]

const PREMIUM_ROWS = [
  'Unlimited AI questions',
  'Unlimited worksheets',
  'Unlimited SAT practice',
  'No wait time ⚡',
  'Priority tutor matching',
  'Advanced analytics & XP tracking',
  'Ad-free experience',
  'Bonus generations on level up 🎁',
]

const FAQS = [
  { q: 'Can I cancel anytime?', a: 'Yes — cancel from your settings page in one click, no questions asked. You keep Premium until the end of your billing period.' },
  { q: 'What happens when I hit the free limit?', a: 'Your daily limits reset at midnight, so you can wait until then — or upgrade to Premium for unlimited access right away.' },
  { q: 'Is my payment secure?', a: 'Absolutely. All payments are processed securely through Stripe. We never see or store your card details.' },
  { q: 'Can I switch plans?', a: 'Yes — you can upgrade or downgrade anytime. Changes take effect immediately and billing is prorated.' },
]

const TESTIMONIALS = [
  { quote: 'Upgrading was the best study decision I made — no more waiting between practice sets.', name: 'Jordan M.', initial: 'J' },
  { quote: 'Unlimited SAT practice got my score up 120 points in six weeks.', name: 'Aisha R.', initial: 'A' },
  { quote: 'Priority tutor matching found me help the night before my exam. Lifesaver.', name: 'Diego L.', initial: 'D' },
]

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

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} />

      <div style={{ padding: '6rem 1.5rem 5rem' }}>
        <div className="container-base" style={{ maxWidth: '58rem' }}>

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Pricing</p>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.5rem', fontWeight: 700, color: INK, marginBottom: '0.875rem', lineHeight: 1.1 }}>
              Simple, Transparent Pricing
            </h1>
            <p style={{ color: MUTED, fontSize: '1.0625rem', maxWidth: '32rem', margin: '0 auto' }}>
              Start free, upgrade when you're ready.
            </p>
          </div>

          {/* ── Pricing cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem', alignItems: 'center', maxWidth: '46rem', margin: '0 auto 4rem' }}>

            {/* Free */}
            <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '1.5rem', padding: '2.5rem' }}>
              <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, color: MUTED, background: 'rgb(243,244,246)', padding: '0.375rem 0.875rem', borderRadius: '9999px', marginBottom: '1.25rem' }}>Free</span>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: INK, lineHeight: 1 }}>
                $0<span style={{ fontSize: '1rem', fontWeight: 400, color: MUTED }}> / month</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: MUTED, margin: '0.5rem 0 1.75rem' }}>Forever free</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {FREE_ROWS.map(r => (
                  <li key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9375rem', color: r.on ? INK : 'rgb(156,163,175)' }}>
                    {r.on
                      ? <CheckCircle style={{ width: '1.125rem', height: '1.125rem', color: 'rgb(59,109,17)', flexShrink: 0 }} />
                      : <XCircle style={{ width: '1.125rem', height: '1.125rem', color: 'rgb(209,213,219)', flexShrink: 0 }} />}
                    {r.label}
                  </li>
                ))}
              </ul>
              {profile ? (
                profile.is_premium ? (
                  <div style={{ textAlign: 'center', padding: '0.875rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.05)', color: MUTED, fontSize: '0.9375rem' }}>You're on Premium</div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '0.875rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.05)', color: GREEN, fontWeight: 600, fontSize: '0.9375rem' }}>Your current plan ✓</div>
                )
              ) : (
                <Link href="/signup" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  Get Started →
                </Link>
              )}
            </div>

            {/* Premium */}
            <div style={{ position: 'relative' }}>
              {/* green glow */}
              <div aria-hidden style={{ position: 'absolute', inset: '-8px', borderRadius: '1.75rem', background: 'radial-gradient(ellipse at center, rgba(34,85,14,0.22), transparent 70%)', filter: 'blur(20px)', zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1, transform: 'scale(1.02)', background: 'white', border: `2px solid ${GREEN}`, borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 16px 48px rgba(34,85,14,0.18)' }}>
                <div style={{ position: 'absolute', top: '-0.875rem', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', padding: '0.375rem 1.25rem', borderRadius: '9999px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(217,119,6,0.35)' }}>
                  ⭐ MOST POPULAR
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: GREEN, background: 'rgba(34,85,14,0.1)', padding: '0.375rem 0.875rem', borderRadius: '9999px', marginBottom: '1.25rem' }}>Premium ⚡</span>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: INK, lineHeight: 1 }}>
                  $5.99<span style={{ fontSize: '1rem', fontWeight: 400, color: MUTED }}> / month</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: MUTED, margin: '0.5rem 0 1.75rem' }}>Cancel anytime</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {PREMIUM_ROWS.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9375rem', color: INK, fontWeight: 500 }}>
                      <CheckCircle style={{ width: '1.125rem', height: '1.125rem', color: GREEN, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {profile?.is_premium ? (
                  <div style={{ textAlign: 'center', padding: '0.875rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.06)', color: GREEN, fontWeight: 600, fontSize: '0.9375rem' }}>Your current plan ✓</div>
                ) : profile ? (
                  <UpgradeButton />
                ) : (
                  <Link href="/signup?plan=premium" className="btn-primary" style={{ width: '100%', justifyContent: 'center', boxShadow: '0 4px 16px rgba(34,85,14,0.25)' }}>
                    <Zap style={{ width: '1rem', height: '1rem' }} />
                    Upgrade Now →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ── FAQ ── */}
          <div style={{ maxWidth: '42rem', margin: '0 auto 3.5rem' }}>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: INK, textAlign: 'center', marginBottom: '1.75rem' }}>
              Frequently asked questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FAQS.map(f => (
                <div key={f.q} className="card" style={{ padding: '1.5rem 1.75rem' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: INK, marginBottom: '0.5rem' }}>{f.q}</p>
                  <p style={{ fontSize: '0.9375rem', color: MUTED, lineHeight: 1.6 }}>{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Testimonials ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', maxWidth: '52rem', margin: '0 auto' }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.9375rem', color: INK, lineHeight: 1.6, marginBottom: '1rem' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: GREEN, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>{t.initial}</div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: INK }}>{t.name}</span>
                </div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.9375rem', color: MUTED, marginTop: '3rem' }}>
            🔒 Secure payment via Stripe · Cancel any time from your account settings
          </p>

        </div>
      </div>
    </div>
  )
}
