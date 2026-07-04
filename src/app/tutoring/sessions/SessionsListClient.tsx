'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useStudentTheme } from '@/app/contexts/StudentThemeContext'

// Open the tutor's pasted Meet link externally; force absolute https:// so it's
// never treated as an internal Next.js route (which 404'd).
const safeMeetLink = (url: string) => {
  const u = (url || '').trim()
  return /^https?:\/\//i.test(u) ? u : 'https://' + u
}

const GREEN = 'rgb(34,85,14)'

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} at ${time}`
}

function statusMeta(status: string): { accent: string; bg: string; color: string; label: string } {
  switch (status) {
    case 'confirmed': return { accent: GREEN, bg: 'rgba(34,85,14,0.1)', color: GREEN, label: '✅ Confirmed' }
    case 'pending': return { accent: 'rgb(202,138,4)', bg: 'rgba(232,160,32,0.12)', color: 'rgb(180,120,10)', label: '⏳ Pending' }
    case 'completed': return { accent: 'rgb(140,140,120)', bg: 'rgba(107,107,88,0.12)', color: 'rgb(90,90,72)', label: 'Completed' }
    case 'declined': return { accent: 'rgb(163,45,45)', bg: 'rgba(163,45,45,0.1)', color: 'rgb(163,45,45)', label: 'Declined' }
    case 'disputed': return { accent: 'rgb(163,45,45)', bg: 'rgba(163,45,45,0.1)', color: 'rgb(163,45,45)', label: 'Disputed' }
    case 'proposed': return { accent: 'rgb(37,99,235)', bg: 'rgba(37,99,235,0.12)', color: 'rgb(37,99,235)', label: '📅 Proposed' }
    default: return { accent: 'rgb(140,140,120)', bg: 'rgba(107,107,88,0.12)', color: 'rgb(90,90,72)', label: status }
  }
}

function Avatar({ tp }: { tp: any }) {
  return tp?.avatar_url ? (
    <img src={tp.avatar_url} alt={tp?.display_name} style={{ width: '3rem', height: '3rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
      {tp?.display_name?.[0] ?? '?'}
    </div>
  )
}

const durationPill: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', color: GREEN }

interface Props {
  sessions: any[]
  userId: string
}

export default function SessionsListClient({ sessions, userId }: Props) {
  const router = useRouter()
  const { theme } = useStudentTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('student-sessions-realtime', { config: { broadcast: { self: true } } })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tutoring_sessions',
        filter: `student_id=eq.${userId}`,
      }, () => {
        router.refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const proposed = sessions.filter(s => s.status === 'proposed')
  const upcoming = sessions.filter(s => ['pending', 'confirmed'].includes(s.status) && new Date(s.scheduled_at) > new Date())
  const past = sessions.filter(s => s.status !== 'proposed' && (s.status === 'completed' || new Date(s.scheduled_at) < new Date()))

  const countBadge = (n: number) => (
    <span style={{ fontSize: '0.8125rem', fontWeight: 700, padding: '0.15rem 0.6rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', color: GREEN, fontFamily: 'Syne, sans-serif' }}>{n}</span>
  )
  const sectionTitle: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--af-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }

  return (
    <div className={`animate-fade-in ${isDark ? 'student-dark' : ''}`} style={{ paddingTop: '5rem', minHeight: '100vh', background: isDark ? 'var(--af-bg)' : 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--af-text)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            My Sessions {countBadge(sessions.length)}
          </h1>
          <Link href="/tutoring" className="btn-primary" style={{ textDecoration: 'none', borderRadius: '0.875rem' }}>
            + Book New Session
          </Link>
        </div>

        {/* Proposals */}
        {proposed.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={sectionTitle}>Follow-up Proposals {countBadge(proposed.length)}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {proposed.map(s => {
                const m = statusMeta(s.status)
                return (
                  <div key={s.id} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${m.accent}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', minWidth: 0 }}>
                        <Avatar tp={s.tutor_profiles} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                            <p style={{ fontWeight: 700, color: 'var(--af-text)', fontSize: '1rem' }}>{s.subject}</p>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: m.bg, color: m.color }}>{m.label}</span>
                            <span style={durationPill}>{s.session_length} min</span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)', marginBottom: '0.25rem' }}>with {s.tutor_profiles?.display_name}</p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)' }}>📅 {fmtDateTime(s.scheduled_at)}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: GREEN }}>${s.student_price}</p>
                        <Link href={`/tutoring/followup/${s.id}`}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.875rem', background: GREEN, color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700 }}>
                          View & Pay →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={sectionTitle}>Upcoming Sessions {countBadge(upcoming.length)}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcoming.map(s => {
                const m = statusMeta(s.status)
                const hoursLeft = s.status === 'pending' && s.expires_at
                  ? Math.max(0, Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / 3600000))
                  : null
                return (
                  <div key={s.id} className="card sess-hover" style={{ padding: '1.25rem', borderLeft: `4px solid ${m.accent}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                        <Avatar tp={s.tutor_profiles} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                            <p style={{ fontWeight: 700, color: 'var(--af-text)', fontSize: '1rem' }}>{s.subject}</p>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: m.bg, color: m.color }}>{m.label}</span>
                            <span style={durationPill}>{s.session_length} min</span>
                            {hoursLeft !== null && (
                              <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(220,38,38,0.1)', color: 'rgb(220,38,38)' }}>⏳ Expires in {hoursLeft}h</span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)', marginBottom: '0.25rem' }}>with {s.tutor_profiles?.display_name}</p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)' }}>📅 {fmtDateTime(s.scheduled_at)}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.625rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)' }}>Paid <strong style={{ color: 'var(--af-text)' }}>${s.student_price}</strong></p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <Link href={`/tutoring/session/${s.id}`}
                            style={{ padding: '0.5rem 0.875rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.08)', border: '1px solid rgba(34,85,14,0.2)', color: GREEN, textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600 }}>
                            View Session
                          </Link>
                          {s.meet_link && s.status === 'confirmed' && (
                            <a href={safeMeetLink(s.meet_link)} target="_blank" rel="noopener noreferrer"
                              style={{ padding: '0.5rem 0.875rem', borderRadius: '0.875rem', background: GREEN, color: 'white', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 700 }}>
                              🎥 Join Meet
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div>
            <h2 style={sectionTitle}>Past Sessions {countBadge(past.length)}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {past.map(s => {
                const m = statusMeta(s.status)
                return (
                  <Link key={s.id} href={`/tutoring/session/${s.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card sess-hover" style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: `4px solid ${m.accent}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', minWidth: 0 }}>
                          <Avatar tp={s.tutor_profiles} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                              <p style={{ fontWeight: 700, color: 'var(--af-text)' }}>{s.subject}</p>
                              <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: m.bg, color: m.color, textTransform: 'capitalize' }}>{m.label}</span>
                              <span style={durationPill}>{s.session_length} min</span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)', marginBottom: '0.25rem' }}>with {s.tutor_profiles?.display_name}</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)' }}>📅 {fmtDateTime(s.scheduled_at)}</p>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)' }}>Paid <strong style={{ color: 'var(--af-text)' }}>${s.student_price}</strong></p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '0.75rem' }}>No sessions yet</h2>
            <p style={{ color: 'var(--af-text-muted)', marginBottom: '1.5rem' }}>Book your first tutoring session and start learning!</p>
            <Link href="/tutoring" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>Browse Tutors</Link>
          </div>
        )}
      </div>

      <style>{`
        .sess-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .sess-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(34,85,14,0.1); }
      `}</style>
    </div>
  )
}
