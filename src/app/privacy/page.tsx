import Navbar from '@/components/layout/Navbar'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

const GREEN = 'rgb(34,85,14)'
const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. Information We Collect',
    body: [
      'We collect the information you provide directly, including your name, email address, and the content you generate on the platform.',
      'We also collect usage data, tutoring session data, and payment information. Payments are handled by Stripe — we never store your card details.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'We use your information to provide and improve the Service, personalize your experience, send transactional emails, process payments, and match students with tutors.',
    ],
  },
  {
    title: '3. Information Sharing',
    body: [
      'We share data with trusted service providers only as needed to run AceForge: Stripe (payments), Supabase (database), OpenAI (AI generation — your prompts may be used to improve their models), Resend (email delivery), and Vercel (hosting).',
      'We never sell your data.',
    ],
  },
  {
    title: '4. Cookies & Tracking',
    body: [
      'We use essential cookies for authentication. On the free plan, we use Google AdSense to serve ads, which may set its own cookies.',
      'You can opt out of non-essential cookies at any time.',
    ],
  },
  {
    title: '5. Data Security',
    body: [
      'Your data is encrypted in transit (HTTPS) and at rest via Supabase. All payment security is handled by Stripe.',
    ],
  },
  {
    title: '6. Your Rights',
    body: [
      'You have the right to access your data, request its deletion, and export your data. To exercise these rights, contact contactinfo21342@gmail.com.',
    ],
  },
  {
    title: "7. Children's Privacy",
    body: [
      'AceForge is intended for users aged 13 and older. We do not knowingly collect data from children under 13. If we learn we have done so, we will delete it.',
    ],
  },
  {
    title: '8. Tutoring Sessions',
    body: [
      'Session chat messages are stored for dispute resolution and are deleted after 90 days unless a dispute is active.',
    ],
  },
  {
    title: '9. Data Retention',
    body: [
      'We retain your account data while your account is active. Upon an account deletion request, your data is deleted within 30 days.',
    ],
  },
  {
    title: '10. Changes to Policy',
    body: [
      'We will notify users of significant changes to this Privacy Policy via email.',
    ],
  },
  {
    title: '11. Contact',
    body: [
      'Questions about this Privacy Policy? Contact us at contactinfo21342@gmail.com.',
    ],
  },
]

export default async function PrivacyPage() {
  let profile = null
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      profile = data
    }
  } catch {}

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} />
      <div className="animate-fade-in" style={{ paddingTop: '5rem', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem' }}>

          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.5rem', fontWeight: 700, color: INK, marginBottom: '0.5rem' }}>
            Privacy Policy
          </h1>
          <p style={{ color: MUTED, fontSize: '0.9375rem', marginBottom: '2.5rem' }}>
            Last updated: July 21, 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {SECTIONS.map((section, i) => (
              <section key={i} style={{
                background: 'white',
                borderRadius: '1rem',
                borderLeft: `3px solid ${GREEN}`,
                padding: '1.5rem 1.75rem',
                boxShadow: '0 1px 3px rgba(34,85,14,0.06)',
              }}>
                <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: INK, marginBottom: '0.75rem' }}>
                  {section.title}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {section.body.map((para, j) => (
                    <p key={j} style={{ fontSize: '0.9375rem', color: INK, lineHeight: 1.8 }}>{para}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <Link href="/terms" style={{ color: GREEN, fontWeight: 700, textDecoration: 'none', fontSize: '0.9375rem' }}>
              Read our Terms of Service →
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
