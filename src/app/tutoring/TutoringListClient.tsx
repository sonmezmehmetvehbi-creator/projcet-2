'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

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

const SELECT_STYLE: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  padding: '0.55rem 0.875rem',
  borderRadius: '0.625rem',
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
        case 'reviews':
          return (b.total_reviews ?? 0) - (a.total_reviews ?? 0)
        case 'sessions':
          return (b.total_sessions ?? 0) - (a.total_sessions ?? 0)
        case 'newest':
          return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        case 'rating':
        default:
          return (b.rating ?? 0) - (a.rating ?? 0)
      }
    })

    return list
  }, [tutors, search, subject, language, sort])

  return (
    <div>
      {/* Filter bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Row 1: name search + subject dropdown */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tutor name..."
            style={{
              flex: '1 1 220px',
              fontSize: '0.9375rem',
              padding: '0.7rem 1rem',
              borderRadius: '0.75rem',
              border: '1.5px solid rgba(34,85,14,0.2)',
              background: 'var(--af-card)',
              color: 'var(--af-text)',
              boxSizing: 'border-box',
            }}
          />
          <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...SELECT_STYLE, flex: '1 1 220px' }}>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Row 2: language + sort */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ ...SELECT_STYLE, flex: '1 1 220px' }}>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...SELECT_STYLE, flex: '1 1 220px' }}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>Sort: {s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--af-text-muted)', marginBottom: '1.25rem', fontFamily: 'Syne, sans-serif' }}>
        {filtered.length} tutor{filtered.length !== 1 ? 's' : ''} found
      </p>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '0.5rem' }}>
            No tutors match your filters
          </h3>
          <p style={{ color: 'var(--af-text-muted)' }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1.25rem' }}>
          {filtered.map((tutor) => {
            const subjects: string[] = tutor.subjects ?? []
            const extra = subjects.length - 3
            return (
              <div key={tutor.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  {tutor.avatar_url ? (
                    <img src={tutor.avatar_url} alt={tutor.display_name}
                      style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', fontWeight: 700, flexShrink: 0 }}>
                      {tutor.display_name?.[0] ?? '?'}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--af-text)', marginBottom: '0.125rem', display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {tutor.display_name}
                      {tutor.credential_verified && (
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '9999px', background: 'rgb(37,99,235)', color: 'white' }}>
                          ✓ Verified
                        </span>
                      )}
                    </p>
                    {tutor.rating > 0 ? (
                      <p style={{ fontSize: '0.875rem', color: 'rgb(180,120,10)' }}>
                        {'⭐'.repeat(Math.round(tutor.rating))} <span style={{ color: 'var(--af-text-muted)' }}>({tutor.total_reviews ?? 0})</span>
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--af-text-muted)' }}>New tutor</p>
                    )}
                  </div>
                </div>

                {/* Subjects */}
                {subjects.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                    {subjects.slice(0, 3).map((s) => (
                      <span key={s} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', color: 'rgb(34,85,14)', fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', color: 'var(--af-text-muted)', fontWeight: 600 }}>
                        +{extra} more
                      </span>
                    )}
                  </div>
                )}

                {/* Languages */}
                {tutor.languages?.length > 0 && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--af-text-muted)', marginBottom: '0.875rem' }}>
                    🌐 {tutor.languages.join(', ')}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1rem', marginTop: 'auto' }}>
                  <div>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.125rem', color: 'rgb(34,85,14)' }}>
                      ${hourlyRate}/hr
                    </span>
                    {isPremium ? (
                      <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgb(34,85,14)', marginTop: '0.125rem' }}>
                        ⚡ Your premium rate
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.6875rem', color: 'var(--af-text-muted)', marginTop: '0.125rem' }}>
                        Save $15/hr with Premium ⚡
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)' }}>
                    {tutor.total_sessions ?? 0} sessions
                  </span>
                </div>

                <Link href={`/tutoring/tutor/${tutor.id}`}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', display: 'flex', textDecoration: 'none' }}>
                  View Profile →
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
