import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'

export default async function TutoringPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

 const { data: tutors } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('status', 'approved')
    .eq('is_active', true)
    .order('rating', { ascending: false })

  const isPremium = profile?.is_premium ?? false
  const hourlyRate = isPremium ? 34.99 : 49.99

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} />
      <div style={{ paddingTop:'5rem' }}>
        <div style={{ maxWidth:'64rem', margin:'0 auto', padding:'3rem 1.5rem' }}>

          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(34,85,14,0.06)', border:'1px solid rgba(34,85,14,0.15)', padding:'0.375rem 1rem', borderRadius:'9999px', marginBottom:'1rem' }}>
              <span style={{ fontSize:'0.8125rem', fontWeight:700, color:'rgb(34,85,14)', fontFamily:'Syne, sans-serif', textTransform:'uppercase', letterSpacing:'0.05em' }}>1-on-1 Tutoring</span>
            </div>
            <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1rem' }}>
              Learn from expert tutors
            </h1>
            <p style={{ color:'rgb(107,107,88)', fontSize:'1.0625rem', maxWidth:'36rem', margin:'0 auto 1.5rem' }}>
              Live 1-on-1 sessions via Google Meet. All sessions recorded for quality assurance.
            </p>
            <div style={{ display:'inline-flex', gap:'1rem', flexWrap:'wrap', justifyContent:'center' }}>
              <div style={{ padding:'0.625rem 1.25rem', borderRadius:'9999px', background: isPremium ? 'rgba(34,85,14,0.08)' : 'white', border:`2px solid ${isPremium ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.2)'}` }}>
                <span style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'1rem', color:'rgb(34,85,14)' }}>
                  ${hourlyRate}/hr {isPremium ? '⚡ Premium rate' : ''}
                </span>
              </div>
              {!isPremium && (
                <Link href="/pricing" style={{ padding:'0.625rem 1.25rem', borderRadius:'9999px', background:'rgba(34,85,14,0.06)', border:'1.5px solid rgba(34,85,14,0.2)', textDecoration:'none', fontFamily:'Syne, sans-serif', fontWeight:600, fontSize:'0.9375rem', color:'rgb(34,85,14)' }}>
                  Premium saves you $15/hr →
                </Link>
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="card" style={{ padding:'2rem', marginBottom:'2rem' }}>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1.5rem', textAlign:'center' }}>
              How it works
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'1.5rem' }}>
              {[
                { emoji:'🔍', step:'1', title:'Choose a tutor', desc: isPremium ? 'Browse our verified tutors and pick the best fit for you.' : 'We match you with the best available tutor for your subject.' },
                { emoji:'📅', step:'2', title:'Pick a time', desc:'Select your preferred session length and time slot.' },
                { emoji:'💳', step:'3', title:'Pay securely', desc:"Pay upfront via Stripe. Full refund if tutor doesn't show up." },
                { emoji:'🎥', step:'4', title:'Join Google Meet', desc:'Your tutor sends a Meet link. Session is recorded for quality.' },
              ].map(s => (
                <div key={s.step} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>{s.emoji}</div>
                  <p style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'0.875rem', color:'rgb(34,85,14)', marginBottom:'0.375rem' }}>Step {s.step}</p>
                  <p style={{ fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.375rem' }}>{s.title}</p>
                  <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', lineHeight:1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Refund policy */}
          <div style={{ padding:'1.25rem 1.5rem', borderRadius:'1rem', background:'rgba(34,85,14,0.03)', border:'1px solid rgba(34,85,14,0.1)', marginBottom:'2rem' }}>
            <p style={{ fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.625rem' }}>🛡️ Our Refund Policy</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'0.5rem' }}>
              {[
                '✅ Full refund if tutor no-shows',
                '✅ Full refund if tutor cancels within 24hrs',
                '✅ Full refund if tutor is 10+ min late',
                '✅ Dispute reviewed within 3-5 business days',
                '✅ All sessions recorded for dispute resolution',
                '⚠️ 50% refund if you cancel under 24hrs',
              ].map(p => (
                <p key={p} style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>{p}</p>
              ))}
            </div>
          </div>

          {/* Tutor listing */}
          <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1.25rem' }}>
            {isPremium ? 'Choose your tutor' : 'Our tutors'}
          </h2>

          {!tutors || tutors.length === 0 ? (
            <div className="card" style={{ padding:'4rem', textAlign:'center' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🎓</div>
              <h3 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
                Tutors coming soon!
              </h3>
              <p style={{ color:'rgb(107,107,88)', marginBottom:'1.5rem' }}>
                We are onboarding our first tutors. Check back soon!
              </p>
              <Link href="/dashboard" className="btn-primary" style={{ display:'inline-flex' }}>
                Back to Dashboard
              </Link>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1.25rem' }}>
              {tutors.map((tutor: any) => (
                <div key={tutor.id} className="card" style={{ padding:'1.5rem', transition:'all 0.2s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem' }}>
                    <div style={{ width:'3.5rem', height:'3.5rem', borderRadius:'50%', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.25rem', fontWeight:700, flexShrink:0 }}>
                      {tutor.display_name?.[0] ?? '?'}
                    </div>
                    <div>
                      <p style={{ fontFamily:'Fraunces, Georgia, serif', fontWeight:700, fontSize:'1.0625rem', color:'rgb(26,26,20)', marginBottom:'0.125rem' }}>
                        {tutor.display_name}
                      </p>
                      {tutor.rating > 0 && (
                        <p style={{ fontSize:'0.875rem', color:'rgb(180,120,10)' }}>
                          {'⭐'.repeat(Math.round(tutor.rating))} ({tutor.total_reviews})
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem', marginBottom:'0.875rem' }}>
                    {tutor.subjects?.slice(0,3).map((s: string) => (
                      <span key={s} style={{ fontSize:'0.75rem', padding:'0.2rem 0.5rem', borderRadius:'9999px', background:'rgba(34,85,14,0.06)', color:'rgb(34,85,14)', fontWeight:600 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', lineHeight:1.6, marginBottom:'1rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {tutor.bio || 'Experienced tutor ready to help you succeed.'}
                  </p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                    <span style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.125rem', color:'rgb(34,85,14)' }}>
                      ${hourlyRate}/hr
                    </span>
                    <span style={{ fontSize:'0.75rem', color:'rgb(107,107,88)' }}>
                      {tutor.total_sessions} sessions
                    </span>
                  </div>
                  <Link href={`/tutoring/tutor/${tutor.id}`}
                    className={isPremium ? 'btn-primary' : 'btn-secondary'}
                    style={{ width:'100%', justifyContent:'center', display:'flex', textDecoration:'none' }}>
                    {isPremium ? 'View & Book' : 'View Profile'}
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Recording notice */}
          <div style={{ marginTop:'2rem', padding:'1rem 1.5rem', borderRadius:'0.875rem', background:'rgba(37,99,235,0.05)', border:'1px solid rgba(37,99,235,0.15)' }}>
            <p style={{ fontSize:'0.8125rem', color:'rgb(37,99,235)', lineHeight:1.7 }}>
              📹 <strong>Recording Notice:</strong> All tutoring sessions are recorded for quality assurance and dispute resolution purposes. By booking a session, both the student and tutor consent to recording. Recordings are reviewed only in case of a dispute and are deleted after 30 days.
            </p>
          </div>

          {/* Legal policy link */}
          <div style={{ marginTop:'1rem', textAlign:'center' }}>
            <Link href="/tutoring/legal" style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', textDecoration:'none' }}>
              ⚖️ View full tutoring policies, refund policy & legal terms →
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
