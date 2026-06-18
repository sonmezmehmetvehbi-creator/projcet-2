'use client'

import { useState } from 'react'
import Link from 'next/link'

// Force pasted Meet links to absolute https:// so they open externally and are
// never treated as internal Next.js routes (which 404'd).
const safeMeetLink = (url: string) => {
  const u = (url || '').trim()
  return /^https?:\/\//i.test(u) ? u : 'https://' + u
}

interface Props {
  profile: any
  sessions: any[]
  allTutors: any[]
}

export default function TutoringDashboardClient({ profile, sessions, allTutors }: Props) {
  const isPremium = profile?.is_premium ?? false
  const hourlyRate = isPremium ? 34.99 : 49.99

  const upcoming = sessions.filter(s =>
    ['pending','confirmed'].includes(s.status) && new Date(s.scheduled_at) > new Date()
  )
  const past = sessions.filter(s =>
    s.status === 'completed' || s.status === 'refunded' || s.status === 'disputed'
  )
  const activeDisputes = sessions.filter(s => s.status === 'disputed')
  const totalSpent = sessions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (s.student_price ?? 0), 0)

  const bookedTutorIds = Array.from(new Set(sessions.map(s => s.tutor_profiles?.id).filter(Boolean)))
  const favoriteTutors = allTutors.filter(t => bookedTutorIds.includes(t.id))
  const newTutors = allTutors.filter(t => !bookedTutorIds.includes(t.id))

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'64rem', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
              Tutoring 🎓
            </h1>
            <p style={{ color:'rgb(107,107,88)' }}>
              {isPremium ? `Premium rate: $${hourlyRate}/hr ⚡` : `$${hourlyRate}/hr · Upgrade to save $15/hr`}
            </p>
          </div>
          <Link href="/tutoring" className="btn-primary" style={{ textDecoration:'none' }}>
            + Book New Session
          </Link>
        </div>

        {/* Active dispute warning */}
        {activeDisputes.length > 0 && (
          <div style={{ padding:'1rem 1.5rem', borderRadius:'0.875rem', background:'rgba(163,45,45,0.06)', border:'1px solid rgba(163,45,45,0.2)', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span style={{ fontSize:'1.25rem' }}>⚠️</span>
            <div>
              <p style={{ fontWeight:700, color:'rgb(163,45,45)', marginBottom:'0.125rem' }}>
                {activeDisputes.length} active dispute{activeDisputes.length > 1 ? 's' : ''}
              </p>
              <p style={{ fontSize:'0.875rem', color:'rgb(163,45,45)' }}>
                Our team is reviewing. We will email you within 3-5 business days.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { label:'Upcoming', value:upcoming.length, emoji:'📅', color:'rgb(37,99,235)' },
            { label:'Completed', value:past.filter(s => s.status === 'completed').length, emoji:'✅', color:'rgb(34,85,14)' },
            { label:'Total Spent', value:'$' + totalSpent.toFixed(2), emoji:'💳', color:'rgb(34,85,14)' },
            { label:'Tutors Booked', value:bookedTutorIds.length, emoji:'🎓', color:'rgb(180,120,10)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding:'1.25rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.5rem', marginBottom:'0.375rem' }}>{s.emoji}</div>
              <div style={{ fontFamily:'Syne, sans-serif', fontSize:'1.5rem', fontWeight:800, color:s.color, marginBottom:'0.25rem' }}>{s.value}</div>
              <div style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', fontFamily:'Syne, sans-serif', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Upcoming sessions */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom:'2rem' }}>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1rem' }}>
              📅 Upcoming Sessions
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {upcoming.map(s => (
                <div key={s.id} className="card" style={{ padding:'1.25rem', border: s.status === 'confirmed' ? '2px solid rgba(34,85,14,0.2)' : '1px solid rgba(232,160,32,0.2)', transition:'all 0.2s' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap' }}>
                    {/* Info area links to the session page; the Meet link is a sibling
                        (not nested in the Link) so its target="_blank" isn't blocked. */}
                    <Link href={`/tutoring/session/${s.id}`} style={{ textDecoration:'none', flex:1, minWidth:0, cursor:'pointer' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.375rem', flexWrap:'wrap' }}>
                        <p style={{ fontWeight:700, color:'rgb(26,26,20)', fontSize:'1rem' }}>{s.subject}</p>
                        <span style={{ fontSize:'0.6875rem', fontWeight:700, padding:'0.2rem 0.5rem', borderRadius:'9999px',
                          background: s.status === 'confirmed' ? 'rgba(34,85,14,0.08)' : 'rgba(232,160,32,0.1)',
                          color: s.status === 'confirmed' ? 'rgb(34,85,14)' : 'rgb(180,120,10)' }}>
                          {s.status === 'confirmed' ? '✅ Confirmed' : '⏳ Pending tutor'}
                        </span>
                      </div>
                      <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'0.25rem' }}>
                        with {s.tutor_profiles?.display_name}
                      </p>
                      <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>
                        📅 {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min
                      </p>
                    </Link>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.5rem' }}>
                      <p style={{ fontFamily:'Syne, sans-serif', fontWeight:700, color:'rgb(34,85,14)' }}>${s.student_price}</p>
                      {s.meet_link && (
                        <a href={safeMeetLink(s.meet_link)} target="_blank" rel="noopener noreferrer"
                          className="btn-primary" style={{ fontSize:'0.8125rem', padding:'0.375rem 0.875rem', textDecoration:'none' }}>
                          🎥 Join Meet
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Book again */}
        {favoriteTutors.length > 0 && (
          <div style={{ marginBottom:'2rem' }}>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
              🔁 Book Again
            </h2>
            <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem', marginBottom:'1rem' }}>Tutors you have worked with before</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:'1rem' }}>
              {favoriteTutors.map(t => (
                <div key={t.id} className="card" style={{ padding:'1.25rem' }}>
                  <Link href={`/tutoring/tutor/${t.id}`} style={{ display:'flex', alignItems:'center', gap:'0.875rem', marginBottom:'0.875rem', textDecoration:'none' }}>
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.display_name}
                        style={{ width:'3rem', height:'3rem', borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                    ) : (
                      <div style={{ width:'3rem', height:'3rem', borderRadius:'50%', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.125rem', fontWeight:700, flexShrink:0 }}>
                        {t.display_name?.[0] ?? '?'}
                      </div>
                    )}
                    <div>
                      <p style={{ fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.125rem' }}>{t.display_name}</p>
                      {t.rating > 0 && <p style={{ fontSize:'0.8125rem', color:'rgb(180,120,10)' }}>⭐ {t.rating} ({t.total_reviews})</p>}
                    </div>
                  </Link>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.25rem', marginBottom:'0.875rem' }}>
                    {t.subjects?.slice(0,2).map((s: string) => (
                      <span key={s} style={{ fontSize:'0.6875rem', padding:'0.2rem 0.5rem', borderRadius:'9999px', background:'rgba(34,85,14,0.06)', color:'rgb(34,85,14)', fontWeight:600 }}>{s}</span>
                    ))}
                  </div>
                  <Link href={`/tutoring/book/${t.id}`} className="btn-primary"
                    style={{ width:'100%', justifyContent:'center', display:'flex', textDecoration:'none', fontSize:'0.875rem', padding:'0.5rem' }}>
                    Book Again →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Browse tutors */}
        <div style={{ marginBottom:'2rem' }}>
          <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
            {favoriteTutors.length > 0 ? '🔍 Other Tutors' : '🔍 Browse Tutors'}
          </h2>
          <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem', marginBottom:'1rem' }}>
            {isPremium ? 'Choose your tutor ⚡' : 'We match you with the best available tutor'}
          </p>

          {allTutors.length === 0 ? (
            <div className="card" style={{ padding:'3rem', textAlign:'center' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🎓</div>
              <h3 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
                Tutors coming soon!
              </h3>
              <p style={{ color:'rgb(107,107,88)' }}>We are onboarding our first tutors. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:'1rem' }}>
              {(favoriteTutors.length > 0 ? newTutors : allTutors).map(t => (
                <div key={t.id} className="card" style={{ padding:'1.5rem' }}>
                  <Link href={`/tutoring/tutor/${t.id}`} style={{ display:'flex', alignItems:'center', gap:'0.875rem', marginBottom:'0.875rem', textDecoration:'none' }}>
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.display_name}
                        style={{ width:'3.5rem', height:'3.5rem', borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                    ) : (
                      <div style={{ width:'3.5rem', height:'3.5rem', borderRadius:'50%', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.25rem', fontWeight:700, flexShrink:0 }}>
                        {t.display_name?.[0] ?? '?'}
                      </div>
                    )}
                    <div>
                      <p style={{ fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.125rem' }}>{t.display_name}</p>
                      {t.rating > 0 && <p style={{ fontSize:'0.875rem', color:'rgb(180,120,10)' }}>⭐ {t.rating} ({t.total_reviews} reviews)</p>}
                      {t.total_sessions > 0 && <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)' }}>{t.total_sessions} sessions</p>}
                    </div>
                  </Link>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem', marginBottom:'0.75rem' }}>
                    {t.subjects?.slice(0,3).map((s: string) => (
                      <span key={s} style={{ fontSize:'0.75rem', padding:'0.2rem 0.5rem', borderRadius:'9999px', background:'rgba(34,85,14,0.06)', color:'rgb(34,85,14)', fontWeight:600 }}>{s}</span>
                    ))}
                  </div>
                  <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', lineHeight:1.6, marginBottom:'1rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                    {t.bio || 'Experienced tutor ready to help you succeed.'}
                  </p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                    <span style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.125rem', color:'rgb(34,85,14)' }}>
                      ${hourlyRate}/hr
                    </span>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.25rem' }}>
                      {t.languages?.slice(0,2).map((l: string) => (
                        <span key={l} style={{ fontSize:'0.6875rem', padding:'0.2rem 0.5rem', borderRadius:'9999px', background:'rgba(34,85,14,0.06)', color:'rgb(107,107,88)' }}>{l}</span>
                      ))}
                    </div>
                  </div>
                  <Link href={`/tutoring/book/${t.id}`} className="btn-primary"
                    style={{ width:'100%', justifyContent:'center', display:'flex', textDecoration:'none' }}>
                    {isPremium ? 'Book Session' : 'Request Session'}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past sessions */}
        {past.length > 0 && (
          <div>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1rem' }}>
              📋 Past Sessions
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
              {past.slice(0,5).map(s => (
                <Link key={s.id} href={`/tutoring/session/${s.id}`} style={{ textDecoration:'none' }}>
                  <div className="card" style={{ padding:'1rem 1.25rem', cursor:'pointer', opacity:0.85, transition:'all 0.2s' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem' }}>
                          <p style={{ fontWeight:600, color:'rgb(26,26,20)', fontSize:'0.9375rem' }}>{s.subject}</p>
                          <span style={{ fontSize:'0.6875rem', fontWeight:700, padding:'0.175rem 0.5rem', borderRadius:'9999px',
                            background: s.status === 'completed' ? 'rgba(34,85,14,0.08)' : s.status === 'disputed' ? 'rgba(163,45,45,0.08)' : 'rgba(107,107,88,0.08)',
                            color: s.status === 'completed' ? 'rgb(34,85,14)' : s.status === 'disputed' ? 'rgb(163,45,45)' : 'rgb(107,107,88)' }}>
                            {s.status}
                          </span>
                        </div>
                        <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>
                          with {s.tutor_profiles?.display_name} · {new Date(s.scheduled_at).toLocaleDateString()} · {s.session_length} min
                        </p>
                      </div>
                      <p style={{ fontFamily:'Syne, sans-serif', fontWeight:700, color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>
                        ${s.student_price}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
              {past.length > 5 && (
                <Link href="/tutoring/sessions" style={{ textAlign:'center', fontSize:'0.875rem', color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none', padding:'0.75rem' }}>
                  View all {past.length} past sessions →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && (
          <div className="card" style={{ padding:'4rem', textAlign:'center' }}>
            <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>🎓</div>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
              Get personalized help
            </h2>
            <p style={{ color:'rgb(107,107,88)', fontSize:'1.0625rem', maxWidth:'32rem', margin:'0 auto 1.5rem', lineHeight:1.7 }}>
              Book a live 1-on-1 tutoring session via Google Meet. {isPremium ? 'As a Premium member, you get $15/hr off.' : 'Upgrade to Premium to save $15/hr.'}
            </p>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/tutoring" className="btn-primary" style={{ textDecoration:'none' }}>
                Browse Tutors →
              </Link>
              {!isPremium && (
                <Link href="/pricing" className="btn-secondary" style={{ textDecoration:'none' }}>
                  Upgrade for $15/hr off ⚡
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Info footer */}
        <div style={{ marginTop:'2rem', padding:'1rem 1.5rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.03)', border:'1px solid rgba(34,85,14,0.08)', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'0.75rem' }}>
          {[
            '🛡️ Full refund if tutor no-shows',
            '📹 All sessions recorded',
            '⏱️ 48hr dispute window',
            '💳 Secure Stripe payments',
          ].map(item => (
            <p key={item} style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>{item}</p>
          ))}
        </div>

      </div>
    </div>
  )
}
