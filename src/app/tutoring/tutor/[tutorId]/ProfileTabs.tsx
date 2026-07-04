'use client'

import { useState } from 'react'
import ReviewsSection from './ReviewsSection'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const GREEN = 'rgb(34,85,14)'

const label: React.CSSProperties = { fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 800, color: 'var(--af-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }

export default function ProfileTabs({ tutor, degrees, linkedinUrl, availability, reviews, reviewAvg }: {
  tutor: any
  degrees: any[]
  linkedinUrl: string | null
  availability: any[]
  reviews: any[]
  reviewAvg: number
}) {
  const [tab, setTab] = useState<'about' | 'availability' | 'reviews'>('about')

  const TABS = [
    { id: 'about', label: 'About' },
    { id: 'availability', label: 'Availability' },
    { id: 'reviews', label: `Reviews${reviews.length ? ` (${reviews.length})` : ''}` },
  ] as const

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Tab bar */}
      <div className="card" style={{ padding: '0.375rem', marginBottom: '1.5rem', display: 'flex', gap: '0.25rem' }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '0.625rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: active ? 700 : 600, fontSize: '0.9375rem', background: active ? GREEN : 'transparent', color: active ? 'white' : 'var(--af-text-muted)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'about' && (
        <div className="card tab-fade" style={{ padding: '1.75rem' }}>
          {tutor.bio && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={label}>About</h2>
              <p style={{ fontSize: '0.9375rem', color: 'var(--af-text)', lineHeight: 1.7 }}>{tutor.bio}</p>
            </div>
          )}
          {degrees.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={label}>Education</h2>
              {degrees.map((d: any, i: number) => (
                <p key={i} style={{ fontSize: '0.9375rem', color: 'var(--af-text)', lineHeight: 1.7 }}>
                  🎓 {[d.level, d.field && 'in ' + d.field, d.institution && 'at ' + d.institution].filter(Boolean).join(' ')}
                </p>
              ))}
            </div>
          )}
          {tutor.languages?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={label}>Languages</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {tutor.languages.map((l: string) => (
                  <span key={l} style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'rgba(107,107,88,0.07)', color: 'var(--af-text-muted)', fontWeight: 600, border: '1px solid rgba(107,107,88,0.15)' }}>🌐 {l}</span>
                ))}
              </div>
            </div>
          )}
          {linkedinUrl && (
            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, color: 'rgb(10,102,194)', textDecoration: 'none' }}>
              🔗 View LinkedIn Profile →
            </a>
          )}
          {!tutor.bio && degrees.length === 0 && !tutor.languages?.length && !linkedinUrl && (
            <p style={{ color: 'var(--af-text-muted)' }}>This tutor hasn't added more details yet.</p>
          )}
        </div>
      )}

      {tab === 'availability' && (
        <div className="card tab-fade" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '1rem' }}>📅 Weekly Availability</h2>
          {availability.length === 0 ? (
            <p style={{ color: 'var(--af-text-muted)' }}>No availability listed. You can still request a session — the tutor will confirm.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.625rem' }}>
              {availability.map((a: any) => (
                <div key={a.id} style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.04)', border: '1px solid rgba(34,85,14,0.12)' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--af-text)', marginBottom: '0.25rem' }}>{DAYS[a.day_of_week]}</p>
                  <p style={{ fontSize: '0.8125rem', color: GREEN, fontWeight: 600 }}>{a.start_time} – {a.end_time}</p>
                </div>
              ))}
            </div>
          )}
          {availability[0]?.timezone && (
            <p style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)', marginTop: '1rem' }}>Timezone: {availability[0].timezone.replace(/_/g, ' ')}</p>
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="tab-fade">
          <ReviewsSection reviews={reviews} avgRating={reviewAvg} />
        </div>
      )}

      <style>{`
        @keyframes tabFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .tab-fade { animation: tabFade 0.25s ease both; }
      `}</style>
    </div>
  )
}
