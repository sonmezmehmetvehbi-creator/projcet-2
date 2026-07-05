'use client'

import Link from 'next/link'
import { Users, Calendar, RotateCcw, ArrowRight } from 'lucide-react'

// Force pasted Meet links to absolute https:// so they open externally and are
// never treated as internal Next.js routes (which 404'd).
const safeMeetLink = (url: string) => {
  const u = (url || '').trim()
  return /^https?:\/\//i.test(u) ? u : 'https://' + u
}

const GREEN = 'rgb(34,85,14)'
const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'
const CARD_SHADOW = '0 2px 16px rgba(34,85,14,0.06)'
const AVATAR_GRADIENT = 'linear-gradient(135deg, rgb(34,85,14), rgb(74,122,40))'

interface Props {
  profile: any
  sessions: any[]
  allTutors: any[]
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

export default function TutoringDashboardClient({ profile, sessions, allTutors }: Props) {
  const isPremium = profile?.is_premium ?? false
  const hourlyRate = isPremium ? 34.99 : 49.99

  const upcoming = sessions.filter(s => ['pending', 'confirmed'].includes(s.status) && new Date(s.scheduled_at) > new Date())
  const past = sessions.filter(s => s.status === 'completed' || s.status === 'refunded' || s.status === 'disputed')
  const activeDisputes = sessions.filter(s => s.status === 'disputed')

  const bookedTutorIds = Array.from(new Set(sessions.map(s => s.tutor_profiles?.id).filter(Boolean)))
  const favoriteTutors = allTutors.filter(t => bookedTutorIds.includes(t.id))

  // Last subject studied with each tutor (most recent session).
  const lastSubjectFor = (tutorId: string) => {
    const s = sessions
      .filter(x => x.tutor_profiles?.id === tutorId)
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())[0]
    return s?.subject ?? null
  }

  const topTutors = [...allTutors].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3)
  const hoursStudied = Math.round(
    past.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.session_length ?? 0), 0) / 60
  )

  const bookAgainHref = favoriteTutors[0] ? `/tutoring/book/${favoriteTutors[0].id}` : '/tutoring'

  const ACTIONS = [
    { href: '/tutoring', title: 'Browse Tutors', desc: 'Find your perfect tutor from our verified network', icon: <Users style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />, grad: 'linear-gradient(135deg, rgb(34,85,14), rgb(74,122,40))', color: GREEN },
    { href: '/tutoring/sessions', title: 'My Sessions', desc: 'View upcoming and past sessions', icon: <Calendar style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />, grad: 'linear-gradient(135deg, rgb(37,99,235), rgb(96,165,250))', color: 'rgb(37,99,235)' },
    { href: bookAgainHref, title: 'Book Again', desc: 'Continue with a previous tutor', icon: <RotateCcw style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />, grad: 'linear-gradient(135deg, rgb(124,58,237), rgb(167,139,250))', color: 'rgb(124,58,237)' },
  ]

  const sectionTitle: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: INK, display: 'flex', alignItems: 'center', gap: '0.5rem' }
  const countBadge = (n: number) => (
    <span style={{ fontSize: '0.8125rem', fontWeight: 800, padding: '0.1rem 0.6rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', color: GREEN, fontFamily: 'Syne, sans-serif' }}>{n}</span>
  )

  return (
    <div className="animate-fade-in" style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── HERO ── */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '1rem', border: '1px solid var(--af-border)', background: 'linear-gradient(135deg, rgba(34,85,14,0.06), rgba(34,85,14,0.01)), white', boxShadow: CARD_SHADOW, padding: '1.75rem 2rem' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: GREEN }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', paddingLeft: '0.5rem' }}>
            <div>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, marginBottom: '0.375rem' }}>Your Tutoring Hub 🎓</h1>
              {isPremium ? (
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'rgb(180,120,10)' }}>⚡ Premium Member — $34.99/hr rate</p>
              ) : (
                <p style={{ fontSize: '0.9375rem', color: MUTED }}>
                  Standard rate — $49.99/hr · <Link href="/pricing" style={{ color: GREEN, fontWeight: 700, textDecoration: 'none' }}>Upgrade for $34.99/hr ⚡</Link>
                </p>
              )}
            </div>
            <Link href="/tutoring" className="btn-primary" style={{ textDecoration: 'none', borderRadius: '0.875rem', flexShrink: 0 }}>+ Book New Session</Link>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1.5rem', paddingLeft: '0.5rem', borderTop: '1px solid var(--af-border)' }}>
            {[
              { label: 'sessions booked', value: sessions.length },
              { label: 'tutors worked with', value: bookedTutorIds.length },
              { label: 'hours studied', value: hoursStudied },
            ].map(s => (
              <div key={s.label}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: GREEN }}>{s.value}</span>
                <span style={{ fontSize: '0.875rem', color: MUTED, marginLeft: '0.375rem' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {ACTIONS.map((a, i) => (
            <Link key={a.title} href={a.href} className="td-action" style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', padding: '1.5rem', borderRadius: '1rem', background: a.grad, color: 'white', textDecoration: 'none', boxShadow: `0 4px 20px ${a.color}33`, animation: 'tdRise 0.5s ease both', animationDelay: `${0.1 * (i + 1)}s` }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'auto' }}>{a.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1rem' }}>
                <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700 }}>{a.title}</h3>
                <ArrowRight className="td-arrow" style={{ width: '1.125rem', height: '1.125rem', flexShrink: 0 }} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.25rem', lineHeight: 1.5 }}>{a.desc}</p>
            </Link>
          ))}
        </div>

        {/* ── ACTIVE DISPUTE WARNING ── */}
        {activeDisputes.length > 0 && (
          <div style={{ padding: '1rem 1.5rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.06)', border: '1px solid rgba(163,45,45,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <p style={{ fontWeight: 700, color: 'rgb(163,45,45)', marginBottom: '0.125rem' }}>{activeDisputes.length} active dispute{activeDisputes.length > 1 ? 's' : ''}</p>
              <p style={{ fontSize: '0.875rem', color: 'rgb(163,45,45)' }}>Our team is reviewing. We will email you within 3-5 business days.</p>
            </div>
          </div>
        )}

        {/* ── UPCOMING SESSIONS ── */}
        <div>
          <h2 style={{ ...sectionTitle, marginBottom: '1rem' }}>Upcoming Sessions {countBadge(upcoming.length)}</h2>
          {upcoming.length === 0 ? (
            <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center', boxShadow: CARD_SHADOW }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: INK, marginBottom: '0.375rem' }}>No upcoming sessions</p>
              <p style={{ color: MUTED, marginBottom: '1.25rem' }}>Book one now to get started!</p>
              <Link href="/tutoring" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>Book a Session →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcoming.map((s, i) => {
                const confirmed = s.status === 'confirmed'
                const accent = confirmed ? GREEN : 'rgb(202,138,4)'
                const tp = s.tutor_profiles
                return (
                  <div key={s.id} className="td-session card" style={{ padding: '1.25rem', borderLeft: `4px solid ${accent}`, boxShadow: CARD_SHADOW, animation: 'tdFade 0.4s ease both', animationDelay: `${Math.min(i, 10) * 0.05}s` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: 1 }}>
                        {tp?.avatar_url ? (
                          <img src={tp.avatar_url} alt={tp?.display_name} style={{ width: '3rem', height: '3rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: AVATAR_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>{tp?.display_name?.[0] ?? '?'}</div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                            <p style={{ fontWeight: 700, color: INK }}>{tp?.display_name}</p>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: confirmed ? 'rgba(34,85,14,0.1)' : 'rgba(232,160,32,0.12)', color: confirmed ? GREEN : 'rgb(180,120,10)' }}>{confirmed ? '✅ Confirmed' : '⏳ Pending'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.6875rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', color: GREEN, fontWeight: 600 }}>{s.subject}</span>
                            <span style={{ fontSize: '0.8125rem', color: MUTED }}>{fmtDateTime(s.scheduled_at)} · {s.session_length} min</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {confirmed && s.meet_link && (
                          <a href={safeMeetLink(s.meet_link)} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '0.5rem 0.875rem', borderRadius: '0.875rem', background: GREEN, color: 'white', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 700 }}>🎥 Join Meet</a>
                        )}
                        <Link href={`/tutoring/session/${s.id}`} style={{ fontSize: '0.8125rem', color: GREEN, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>View Details →</Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── BOOK AGAIN ── */}
        <div>
          <h2 style={{ ...sectionTitle, marginBottom: '1rem' }}>Continue Your Learning Journey</h2>
          {favoriteTutors.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', boxShadow: CARD_SHADOW }}>
              <p style={{ color: MUTED, marginBottom: '1rem' }}>You haven't booked a session yet.</p>
              <Link href="/tutoring" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>Browse Tutors →</Link>
            </div>
          ) : (
            <div className="td-scroll" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {favoriteTutors.map(t => (
                <div key={t.id} className="card" style={{ flexShrink: 0, width: '16rem', padding: '1.25rem', boxShadow: CARD_SHADOW }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.display_name} style={{ width: '3rem', height: '3rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: AVATAR_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>{t.display_name?.[0] ?? '?'}</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.display_name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'rgb(180,120,10)' }}>{t.rating > 0 ? `⭐ ${Number(t.rating).toFixed(1)} (${t.total_reviews ?? 0})` : 'New tutor'}</p>
                    </div>
                  </div>
                  {lastSubjectFor(t.id) && <p style={{ fontSize: '0.8125rem', color: MUTED, marginBottom: '0.875rem' }}>Last: {lastSubjectFor(t.id)}</p>}
                  <Link href={`/tutoring/book/${t.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.5rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.08)', border: '1px solid rgba(34,85,14,0.2)', color: GREEN, fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>Book Again →</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── TOP TUTORS ── */}
        {topTutors.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <h2 style={sectionTitle}>Top Tutors This Week ⭐</h2>
              <Link href="/tutoring" style={{ fontSize: '0.875rem', color: GREEN, fontWeight: 700, textDecoration: 'none' }}>Browse All Tutors →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {topTutors.map((t, i) => {
                const subjects: string[] = t.subjects ?? []
                const extra = subjects.length - 3
                return (
                  <div key={t.id} className="td-tutor card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', boxShadow: CARD_SHADOW, animation: 'tdFade 0.4s ease both', animationDelay: `${Math.min(i, 6) * 0.05}s` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.875rem' }}>
                      {t.avatar_url ? (
                        <img className="td-avatar" src={t.avatar_url} alt={t.display_name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, transition: 'box-shadow 0.2s ease' }} />
                      ) : (
                        <div className="td-avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', background: AVATAR_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.375rem', fontWeight: 700, flexShrink: 0, transition: 'box-shadow 0.2s ease' }}>{t.display_name?.[0] ?? '?'}</div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.0625rem', color: INK }}>{t.display_name}</p>
                          {t.credential_verified && <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', color: GREEN }}>✓ Verified</span>}
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'rgb(180,120,10)', fontWeight: 700 }}>{t.rating > 0 ? `⭐ ${Number(t.rating).toFixed(1)} (${t.total_reviews ?? 0})` : 'New'}</p>
                      </div>
                    </div>
                    {subjects.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                        {subjects.slice(0, 3).map(s => (
                          <span key={s} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.08)', color: GREEN, fontWeight: 600 }}>{s}</span>
                        ))}
                        {extra > 0 && <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', background: 'rgba(107,107,88,0.1)', color: MUTED, fontWeight: 600 }}>+{extra} more</span>}
                      </div>
                    )}
                    <div style={{ marginTop: 'auto', marginBottom: '1rem' }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: GREEN }}>${hourlyRate}/hr</span>
                    </div>
                    <Link href={`/tutoring/tutor/${t.id}`} className="td-view" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.75rem', borderRadius: '0.875rem', background: GREEN, color: 'white', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none' }}>
                      View Profile <span className="td-arrow" style={{ display: 'inline-block', transition: 'transform 0.2s ease' }}>→</span>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PAST SESSIONS ── */}
        {past.length > 0 && (
          <div>
            <h2 style={{ ...sectionTitle, marginBottom: '1rem' }}>Past Sessions {countBadge(past.length)}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {past.slice(0, 5).map(s => {
                const accent = s.status === 'completed' ? 'rgb(140,140,120)' : s.status === 'disputed' ? 'rgb(163,45,45)' : 'rgb(140,140,120)'
                return (
                  <Link key={s.id} href={`/tutoring/session/${s.id}`} style={{ textDecoration: 'none' }}>
                    <div className="td-session card" style={{ padding: '1rem 1.25rem', cursor: 'pointer', borderLeft: `4px solid ${accent}`, boxShadow: CARD_SHADOW }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                            <p style={{ fontWeight: 600, color: INK, fontSize: '0.9375rem' }}>{s.subject}</p>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', textTransform: 'capitalize', background: s.status === 'completed' ? 'rgba(107,107,88,0.12)' : s.status === 'disputed' ? 'rgba(163,45,45,0.1)' : 'rgba(107,107,88,0.12)', color: s.status === 'disputed' ? 'rgb(163,45,45)' : 'rgb(90,90,72)' }}>{s.status}</span>
                          </div>
                          <p style={{ fontSize: '0.8125rem', color: MUTED }}>with {s.tutor_profiles?.display_name} · {new Date(s.scheduled_at).toLocaleDateString()} · {s.session_length} min</p>
                        </div>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: MUTED, fontSize: '0.9375rem' }}>${s.student_price}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
              {past.length > 5 && (
                <Link href="/tutoring/sessions" style={{ textAlign: 'center', fontSize: '0.875rem', color: GREEN, fontWeight: 600, textDecoration: 'none', padding: '0.75rem' }}>
                  View all {past.length} past sessions →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {sessions.length === 0 && (
          <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', boxShadow: CARD_SHADOW }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎓</div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: INK, marginBottom: '0.75rem' }}>Get personalized help</h2>
            <p style={{ color: MUTED, fontSize: '1.0625rem', maxWidth: '32rem', margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
              Book a live 1-on-1 tutoring session via Google Meet. {isPremium ? 'As a Premium member, you get $15/hr off.' : 'Upgrade to Premium to save $15/hr.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/tutoring" className="btn-primary" style={{ textDecoration: 'none' }}>Browse Tutors →</Link>
              {!isPremium && <Link href="/pricing" className="btn-secondary" style={{ textDecoration: 'none' }}>Upgrade for $15/hr off ⚡</Link>}
            </div>
          </div>
        )}

        {/* ── INFO FOOTER ── */}
        <div style={{ padding: '1rem 1.5rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '0.75rem' }}>
          {['🛡️ Full refund if tutor no-shows', '📹 All sessions recorded', '⏱️ 48hr dispute window', '💳 Secure Stripe payments'].map(item => (
            <p key={item} style={{ fontSize: '0.8125rem', color: MUTED }}>{item}</p>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes tdRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tdFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .td-action { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .td-action:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(34,85,14,0.2); }
        .td-action:hover .td-arrow { transform: translateX(4px); }
        .td-session { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .td-session:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(34,85,14,0.12); }
        .td-tutor { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .td-tutor:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(34,85,14,0.12); }
        .td-tutor:hover .td-avatar { box-shadow: 0 0 0 3px rgba(34,85,14,0.25); }
        .td-view:hover .td-arrow, .td-action:hover .td-arrow { transform: translateX(4px); }
        .td-scroll { scroll-behavior: smooth; scrollbar-width: none; -ms-overflow-style: none; }
        .td-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
