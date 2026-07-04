'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

const SUBJECTS = [
  'All Subjects',
  'SAT Math', 'SAT Reading & Writing', 'ACT Math', 'ACT English', 'Algebra', 'Geometry',
  'Pre-Calculus', 'Calculus', 'Statistics', 'Biology', 'Chemistry', 'Physics',
  'AP Chemistry', 'AP Biology', 'AP Physics', 'English Literature', 'Essay Writing', 'History',
  'Economics', 'Computer Science', 'Python', 'Java', 'Spanish', 'French', 'Trigonometry',
  'Linear Algebra', 'Differential Equations', 'Discrete Math', 'Organic Chemistry', 'Biochemistry',
  'Anatomy', 'Environmental Science', 'AP Calculus AB', 'AP Calculus BC', 'AP Statistics',
  'AP Computer Science', 'AP History', 'AP Economics', 'AP English', 'AP Spanish', 'AP French',
  'IB Math', 'IB Physics', 'IB Chemistry', 'IB Biology', 'IB Economics', 'GMAT', 'GRE', 'LSAT',
  'MCAT', 'TOEFL', 'IELTS', 'Music Theory', 'Art History', 'Philosophy', 'Psychology', 'Sociology',
  'Accounting', 'Finance', 'Marketing', 'Business', 'C++', 'JavaScript', 'React', 'Data Science',
  'Machine Learning', 'Arabic', 'Mandarin', 'German', 'Italian', 'Portuguese', 'Japanese',
  'Korean', 'Russian', 'Turkish', 'Hindi', 'Hebrew',
]
const LANGUAGES = ['All Languages', 'English', 'Spanish', 'French', 'Arabic', 'Turkish', 'Mandarin', 'German', 'Hindi', 'Portuguese']
const SORTS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'sessions', label: 'Most Sessions' },
  { value: 'newest', label: 'Newest' },
]

const GREEN = 'rgb(34,85,14)'

const SELECT_STYLE: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  padding: '0.65rem 0.875rem',
  borderRadius: '0.875rem',
  border: '1.5px solid rgba(34,85,14,0.2)',
  background: 'var(--af-card)',
  color: 'var(--af-text)',
  fontFamily: 'Syne, sans-serif',
  cursor: 'pointer',
}

export default function TutoringListClient({ tutors, isPremium }: { tutors: any[]; isPremium: boolean }) {
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('All Subjects')
  const [language, setLanguage] = useState('All Languages')
  const [sort, setSort] = useState('rating')

  const hourlyRate = isPremium ? 34.99 : 49.99

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = (tutors ?? []).filter((t) => {
      if (q && !(t.display_name ?? '').toLowerCase().includes(q)) return false
      if (subject !== 'All Subjects' && !(t.subjects ?? []).includes(subject)) return false
      if (language !== 'All Languages' && !(t.languages ?? []).includes(language)) return false
      return true
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'reviews': return (b.total_reviews ?? 0) - (a.total_reviews ?? 0)
        case 'sessions': return (b.total_sessions ?? 0) - (a.total_sessions ?? 0)
        case 'newest': return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        case 'rating':
        default: return (b.rating ?? 0) - (a.rating ?? 0)
      }
    })

    return list
  }, [tutors, search, subject, language, sort])

  const activeFilters = [
    ...(subject !== 'All Subjects' ? [{ label: subject, clear: () => setSubject('All Subjects') }] : []),
    ...(language !== 'All Languages' ? [{ label: language, clear: () => setLanguage('All Languages') }] : []),
  ]

  return (
    <div className="animate-fade-in tut-list">

      {/* ── HERO ── */}
      <div style={{ position: 'relative', borderRadius: '1.75rem', padding: '2.5rem 2rem 3rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgb(34,85,14), rgb(59,130,46))', color: 'white', boxShadow: '0 14px 44px rgba(34,85,14,0.28)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-20px', fontSize: '10rem', opacity: 0.1, lineHeight: 1 }}>🎓</div>
        <div style={{ position: 'relative', maxWidth: '40rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.1, marginBottom: '0.5rem' }}>Find Your Perfect Tutor</h1>
          <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.85)', marginBottom: '1.25rem' }}>Expert tutors for every subject — book in minutes</p>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <span style={pill}>🟢 Live sessions available</span>
            <span style={pill}>✓ Verified tutors only</span>
          </div>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1.125rem', height: '1.125rem', color: 'rgb(107,107,88)' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by tutor name..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.95rem 1rem 0.95rem 2.75rem', borderRadius: '9999px', border: 'none', outline: 'none', fontSize: '1rem', color: 'rgb(26,26,20)', background: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
          </div>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={subject} onChange={e => setSubject(e.target.value)} style={{ ...SELECT_STYLE, flex: '1 1 200px' }}>
            {SUBJECTS.map(s => <option key={s} value={s}>{s === 'All Subjects' ? 'Subject: All' : s}</option>)}
          </select>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{ ...SELECT_STYLE, flex: '1 1 160px' }}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l === 'All Languages' ? 'Language: All' : l}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...SELECT_STYLE, flex: '1 1 160px' }}>
            {SORTS.map(s => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
          </select>
        </div>
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.875rem' }}>
            {activeFilters.map(f => (
              <button key={f.label} onClick={f.clear}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.5rem 0.3rem 0.75rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', border: '1px solid rgba(34,85,14,0.25)', color: GREEN, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                {f.label} <X style={{ width: '0.875rem', height: '0.875rem' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--af-text-muted)', marginBottom: '1.25rem', fontFamily: 'Syne, sans-serif' }}>
        {filtered.length} tutor{filtered.length !== 1 ? 's' : ''} found
      </p>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '5rem', height: '5rem', margin: '0 auto 1.5rem' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,85,14,0.08)' }} />
            <div style={{ position: 'absolute', inset: '0.75rem', borderRadius: '50%', border: `3px solid rgba(34,85,14,0.25)` }} />
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '1.5rem', height: '0.4rem', background: 'rgba(34,85,14,0.3)', borderRadius: '9999px', transform: 'rotate(45deg)' }} />
          </div>
          <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '0.5rem' }}>
            No tutors found for your search
          </h3>
          <p style={{ color: 'var(--af-text-muted)', marginBottom: '1.25rem' }}>Try clearing your filters or searching a different subject.</p>
          <button onClick={() => { setSearch(''); setSubject('All Subjects'); setLanguage('All Languages') }}
            className="btn-secondary" style={{ display: 'inline-flex' }}>Clear filters</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '1.25rem' }}>
          {filtered.map((tutor, i) => {
            const subjects: string[] = tutor.subjects ?? []
            const extra = subjects.length - 3
            return (
              <div key={tutor.id} className={`tut-card${i < 6 ? ` animate-stagger-${i + 1}` : ''}`}
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderRadius: '1.25rem', background: 'var(--af-card)', border: '1px solid var(--af-border)', boxShadow: '0 4px 24px rgba(34,85,14,0.06)' }}>

                {/* Header: avatar + rating */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {tutor.avatar_url ? (
                        <img src={tutor.avatar_url} alt={tutor.display_name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>
                          {tutor.display_name?.[0] ?? '?'}
                        </div>
                      )}
                      {/* online dot */}
                      <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '0.875rem', height: '0.875rem', borderRadius: '50%', background: 'rgb(34,197,94)', border: '2.5px solid var(--af-card)' }} />
                      {/* verified checkmark badge */}
                      {tutor.credential_verified && (
                        <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: 'rgb(37,99,235)', border: '2px solid var(--af-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6875rem', fontWeight: 800 }}>✓</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.125rem', color: 'var(--af-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tutor.display_name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)' }}>{tutor.total_sessions ?? 0} sessions</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {tutor.rating > 0 ? (
                      <>
                        <p style={{ fontSize: '0.875rem', color: 'rgb(180,120,10)', whiteSpace: 'nowrap' }}>{'⭐'.repeat(Math.round(tutor.rating))}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)' }}>{tutor.total_reviews ?? 0} reviews</p>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.08)', color: GREEN }}>New</span>
                    )}
                  </div>
                </div>

                {/* Subjects */}
                {subjects.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                    {subjects.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', color: GREEN, fontWeight: 600 }}>{s}</span>
                    ))}
                    {extra > 0 && (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(107,107,88,0.1)', color: 'var(--af-text-muted)', fontWeight: 600 }}>+{extra} more</span>
                    )}
                  </div>
                )}

                {tutor.languages?.length > 0 && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--af-text-muted)', marginBottom: '0.875rem' }}>🌐 {tutor.languages.join(', ')}</p>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1rem', marginTop: 'auto' }}>
                  <div>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: GREEN }}>${hourlyRate}/hr</span>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: isPremium ? GREEN : 'var(--af-text-muted)', marginTop: '0.125rem' }}>
                      {isPremium ? '⚡ Your premium rate' : 'Save $15/hr with Premium ⚡'}
                    </p>
                  </div>
                </div>

                <Link href={`/tutoring/tutor/${tutor.id}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', textDecoration: 'none', borderRadius: '0.875rem' }}>
                  View Profile →
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .tut-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .tut-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(34,85,14,0.14); }
      `}</style>
    </div>
  )
}

const pill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
  padding: '0.4rem 0.875rem', borderRadius: '9999px',
  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
  fontSize: '0.8125rem', fontWeight: 600,
}
