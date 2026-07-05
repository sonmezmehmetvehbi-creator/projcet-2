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
const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'
const AVATAR_GRADIENT = 'linear-gradient(135deg, rgb(34,85,14), rgb(74,122,40))'

const SELECT_STYLE: React.CSSProperties = {
  height: '44px',
  fontSize: '0.875rem',
  fontWeight: 600,
  padding: '0 0.875rem',
  borderRadius: '0.75rem',
  border: '1.5px solid rgba(34,85,14,0.2)',
  background: 'var(--af-card)',
  color: 'var(--af-text)',
  fontFamily: 'Syne, sans-serif',
  cursor: 'pointer',
  width: '100%',
  boxSizing: 'border-box',
}
const filterLabel: React.CSSProperties = { fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem', display: 'block' }

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

      {/* ── HEADER ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.5rem', fontWeight: 700, color: INK, lineHeight: 1.1, marginBottom: '0.375rem' }}>Find Your Tutor</h1>
        <p style={{ fontSize: '1.0625rem', color: MUTED }}>Browse verified tutors across 80+ subjects</p>
      </div>

      {/* ── SEARCH + FILTER CARD ── */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 4px 24px rgba(34,85,14,0.06)' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1.125rem', height: '1.125rem', color: MUTED, pointerEvents: 'none' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by tutor name..."
            style={{ width: '100%', boxSizing: 'border-box', height: '48px', padding: '0 1rem 0 2.75rem', borderRadius: '0.875rem', border: '1.5px solid rgba(34,85,14,0.2)', outline: 'none', fontSize: '0.9375rem', color: 'var(--af-text)', background: 'var(--af-card)' }} />
        </div>

        {/* Filters row */}
        <div className="tut-filters" style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={filterLabel}>Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={SELECT_STYLE}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={filterLabel}>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={SELECT_STYLE}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={filterLabel}>Sort</label>
            <select value={sort} onChange={e => setSort(e.target.value)} style={SELECT_STYLE}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Active filters + count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {activeFilters.length > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: GREEN, color: 'white', fontFamily: 'Syne, sans-serif' }}>{activeFilters.length}</span>
            )}
            {activeFilters.map(f => (
              <button key={f.label} onClick={f.clear}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.5rem 0.3rem 0.75rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', border: '1px solid rgba(34,85,14,0.25)', color: GREEN, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
                {f.label} <X style={{ width: '0.875rem', height: '0.875rem' }} />
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: GREEN, fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap' }}>
            {filtered.length} tutor{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '5rem', height: '5rem', margin: '0 auto 1.5rem' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,85,14,0.08)' }} />
            <div style={{ position: 'absolute', inset: '0.75rem', borderRadius: '50%', border: `3px solid rgba(34,85,14,0.25)` }} />
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '1.5rem', height: '0.4rem', background: 'rgba(34,85,14,0.3)', borderRadius: '9999px', transform: 'rotate(45deg)' }} />
          </div>
          <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '0.5rem' }}>
            No tutors match your search
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
              <div key={tutor.id} className="tut-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderRadius: '1.25rem', background: 'var(--af-card)', border: '1px solid var(--af-border)', boxShadow: '0 4px 24px rgba(34,85,14,0.06)', animation: 'cardIn 0.4s ease both', animationDelay: `${Math.min(i, 12) * 0.05}s` }}>

                {/* Header: avatar + rating */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {tutor.avatar_url ? (
                        <img className="tut-avatar" src={tutor.avatar_url} alt={tutor.display_name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', transition: 'box-shadow 0.2s ease' }} />
                      ) : (
                        <div className="tut-avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', background: AVATAR_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.375rem', fontWeight: 700, transition: 'box-shadow 0.2s ease' }}>
                          {tutor.display_name?.[0] ?? '?'}
                        </div>
                      )}
                      <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '0.8125rem', height: '0.8125rem', borderRadius: '50%', background: 'rgb(34,197,94)', border: '2.5px solid var(--af-card)' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.0625rem', color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tutor.display_name}</p>
                        {tutor.credential_verified && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.625rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', color: GREEN, whiteSpace: 'nowrap' }}>✓ Verified</span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: MUTED }}>{tutor.total_sessions ?? 0} sessions</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {tutor.rating > 0 ? (
                      <>
                        <p style={{ fontSize: '0.8125rem', color: 'rgb(180,120,10)', fontWeight: 700, whiteSpace: 'nowrap' }}>⭐ {Number(tutor.rating).toFixed(1)}</p>
                        <p style={{ fontSize: '0.6875rem', color: MUTED }}>({tutor.total_reviews ?? 0})</p>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.08)', color: GREEN }}>New</span>
                    )}
                  </div>
                </div>

                {/* Subjects */}
                {subjects.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.625rem' }}>
                    {subjects.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.08)', color: GREEN, fontWeight: 600 }}>{s}</span>
                    ))}
                    {extra > 0 && (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', background: 'rgba(107,107,88,0.1)', color: MUTED, fontWeight: 600 }}>+{extra} more</span>
                    )}
                  </div>
                )}

                {/* Languages */}
                {tutor.languages?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                    {tutor.languages.slice(0, 4).map((l: string) => (
                      <span key={l} style={{ fontSize: '0.6875rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(107,107,88,0.09)', color: MUTED, fontWeight: 600 }}>🌐 {l}</span>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 'auto', marginBottom: '1rem' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: GREEN }}>${hourlyRate}/hr</span>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: isPremium ? GREEN : MUTED, marginTop: '0.125rem' }}>
                    {isPremium ? '⚡ Your premium rate' : 'Save $15/hr with Premium ⚡'}
                  </p>
                </div>

                <Link href={`/tutoring/tutor/${tutor.id}`} className="tut-view"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.75rem', borderRadius: '0.875rem', background: GREEN, color: 'white', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none' }}>
                  View Profile <span className="tut-arrow" style={{ display: 'inline-block', transition: 'transform 0.2s ease' }}>→</span>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .tut-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .tut-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(34,85,14,0.12); }
        .tut-card:hover .tut-avatar { box-shadow: 0 0 0 3px rgba(34,85,14,0.25); }
        .tut-view:hover .tut-arrow { transform: translateX(4px); }
        @media (max-width: 560px) { .tut-filters > div { flex: 1 1 100% !important; } }
      `}</style>
    </div>
  )
}
