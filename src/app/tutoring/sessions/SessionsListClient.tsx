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
      .channel('student-sessions-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tutoring_sessions',
        filter: `student_id=eq.${userId}`,
      }, () => {
        router.refresh()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const proposed = sessions.filter(s => s.status === 'proposed')
  const upcoming = sessions.filter(s => ['pending', 'confirmed'].includes(s.status) && new Date(s.scheduled_at) > new Date())
  const past = sessions.filter(s => s.status !== 'proposed' && (s.status === 'completed' || new Date(s.scheduled_at) < new Date()))

  return (
    <div className={isDark ? 'student-dark' : ''} style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--af-bg)' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'var(--af-text)' }}>
            My Tutoring Sessions
          </h1>
          <Link href="/tutoring" className="btn-primary" style={{ textDecoration: 'none' }}>
            + Book New Session
          </Link>
        </div>

        {proposed.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '1rem' }}>
              Follow-up Proposals
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {proposed.map(s => (
                <div key={s.id} className="card" style={{ padding: '1.25rem', border: '2px solid rgba(37,99,235,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', minWidth: 0 }}>
                      {s.tutor_profiles?.avatar_url ? (
                        <img src={s.tutor_profiles.avatar_url} alt={s.tutor_profiles?.display_name}
                          style={{ width: '3rem', height: '3rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
                          {s.tutor_profiles?.display_name?.[0] ?? '?'}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                          <p style={{ fontWeight: 700, color: 'var(--af-text)', fontSize: '1rem' }}>{s.subject}</p>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(37,99,235,0.12)', color: 'rgb(37,99,235)' }}>
                            📅 Proposed
                          </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)', marginBottom: '0.25rem' }}>
                          with {s.tutor_profiles?.display_name}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)' }}>
                          📅 {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'rgb(34,85,14)' }}>${s.student_price}</p>
                      <Link href={`/tutoring/followup/${s.id}`}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgb(34,85,14)', color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700 }}>
                        View & Pay →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '1rem' }}>
              Upcoming Sessions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcoming.map(s => (
                <div key={s.id} className="card" style={{ padding: '1.25rem', border: s.status === 'confirmed' ? '2px solid rgba(34,85,14,0.2)' : '1px solid var(--af-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Info area links to the session page; the Meet link is a sibling
                        (not nested in the Link) so its target="_blank" isn't blocked. */}
                    <Link href={`/tutoring/session/${s.id}`} style={{ textDecoration: 'none', flex: 1, minWidth: 0, cursor: 'pointer', display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                      {s.tutor_profiles?.avatar_url ? (
                        <img src={s.tutor_profiles.avatar_url} alt={s.tutor_profiles?.display_name}
                          style={{ width: '3rem', height: '3rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
                          {s.tutor_profiles?.display_name?.[0] ?? '?'}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                          <p style={{ fontWeight: 700, color: 'var(--af-text)', fontSize: '1rem' }}>{s.subject}</p>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: s.status === 'confirmed' ? 'var(--af-border)' : 'rgba(232,160,32,0.1)', color: s.status === 'confirmed' ? 'rgb(34,85,14)' : 'rgb(180,120,10)' }}>
                            {s.status === 'confirmed' ? '✅ Confirmed' : '⏳ Pending'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)', marginBottom: '0.25rem' }}>
                          with {s.tutor_profiles?.display_name}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)' }}>
                          📅 {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min
                        </p>
                      </div>
                    </Link>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'rgb(34,85,14)' }}>${s.student_price}</p>
                      {s.meet_link && (
                        <a href={safeMeetLink(s.meet_link)} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '0.8125rem', color: 'rgb(37,99,235)', fontWeight: 600, textDecoration: 'none' }}>
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

        {past.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '1rem' }}>
              Past Sessions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {past.map(s => (
                <Link key={s.id} href={`/tutoring/session/${s.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '1.25rem', cursor: 'pointer', opacity: 0.85 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', minWidth: 0 }}>
                        {s.tutor_profiles?.avatar_url ? (
                          <img src={s.tutor_profiles.avatar_url} alt={s.tutor_profiles?.display_name}
                            style={{ width: '3rem', height: '3rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
                            {s.tutor_profiles?.display_name?.[0] ?? '?'}
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                            <p style={{ fontWeight: 700, color: 'var(--af-text)' }}>{s.subject}</p>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: s.status === 'completed' ? 'var(--af-border)' : s.status === 'disputed' ? 'rgba(163,45,45,0.08)' : 'rgba(107,107,88,0.1)', color: s.status === 'completed' ? 'rgb(34,85,14)' : s.status === 'disputed' ? 'rgb(163,45,45)' : 'var(--af-text-muted)' }}>
                              {s.status}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)', marginBottom: '0.25rem' }}>with {s.tutor_profiles?.display_name}</p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)' }}>
                            📅 {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min
                          </p>
                        </div>
                      </div>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--af-text-muted)' }}>${s.student_price}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '0.75rem' }}>
              No sessions yet
            </h2>
            <p style={{ color: 'var(--af-text-muted)', marginBottom: '1.5rem' }}>Book your first tutoring session and start learning!</p>
            <Link href="/tutoring" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              Browse Tutors
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
