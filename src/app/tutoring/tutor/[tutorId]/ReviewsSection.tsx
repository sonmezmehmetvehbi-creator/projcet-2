'use client'

import { useState } from 'react'

interface Review {
  id?: string
  rating: number
  comment?: string | null
  created_at: string
  would_recommend?: boolean | null
  profiles?: { display_name?: string } | null
}

const GOLD = 'rgb(251,191,36)'
const GREEN = 'rgb(34,85,14)'
const EMPTY = 'rgb(210,210,200)'

function Stars({ rating, size = '1rem' }: { rating: number; size?: string }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, letterSpacing: '0.05em' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ color: n <= Math.round(rating) ? GOLD : EMPTY }}>★</span>
      ))}
    </span>
  )
}

export default function ReviewsSection({ reviews, avgRating }: { reviews: Review[]; avgRating: number }) {
  const [filter, setFilter] = useState<number | 'all'>('all')
  const [visibleCount, setVisibleCount] = useState(5)

  const total = reviews?.length ?? 0

  // Empty state
  if (total === 0) {
    return (
      <div id="reviews" className="card" style={{ padding: '2.5rem 1.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: EMPTY }}>★★★★★</div>
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '0.375rem' }}>
          Reviews
        </h2>
        <p style={{ color: 'var(--af-text-muted)', fontSize: '0.9375rem' }}>
          No reviews yet. Be the first to review this tutor after your session!
        </p>
      </div>
    )
  }

  // Rating breakdown counts per star level
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(r => { if (counts[r.rating] !== undefined) counts[r.rating]++ })

  // Would-recommend percentage (only if the field is present on any review)
  const recommendable = reviews.filter(r => typeof r.would_recommend === 'boolean')
  const recommendPct = recommendable.length > 0
    ? Math.round((recommendable.filter(r => r.would_recommend).length / recommendable.length) * 100)
    : null

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.rating === filter)
  const visible = filtered.slice(0, visibleCount)

  const FILTERS: (number | 'all')[] = ['all', 5, 4, 3, 2, 1]

  return (
    <div id="reviews" className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '1.25rem' }}>
        ⭐ Reviews
      </h2>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', paddingBottom: '1.25rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(34,85,14,0.1)' }}>
        <div style={{ textAlign: 'center', minWidth: '120px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '3rem', fontWeight: 800, color: 'var(--af-text)', lineHeight: 1 }}>
            {avgRating.toFixed(1)}
          </div>
          <div style={{ margin: '0.375rem 0' }}><Stars rating={avgRating} size="1.125rem" /></div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--af-text-muted)' }}>Based on {total} review{total !== 1 ? 's' : ''}</p>
          {recommendPct !== null && (
            <p style={{ fontSize: '0.8125rem', color: GREEN, fontWeight: 600, marginTop: '0.375rem' }}>
              👍 {recommendPct}% would recommend
            </p>
          )}
        </div>

        {/* Breakdown bars */}
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {[5, 4, 3, 2, 1].map(star => {
            const pct = total > 0 ? (counts[star] / total) * 100 : 0
            return (
              <button key={star} type="button" onClick={() => { setFilter(star); setVisibleCount(5) }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.125rem 0', textAlign: 'left' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--af-text-muted)', whiteSpace: 'nowrap', width: '2.75rem' }}>{star} ★</span>
                <div style={{ flex: 1, height: '0.625rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: GOLD, borderRadius: '9999px' }} />
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--af-text-muted)', width: '1.75rem', textAlign: 'right' }}>{counts[star]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {FILTERS.map(f => {
          const active = filter === f
          return (
            <button key={f} type="button" onClick={() => { setFilter(f); setVisibleCount(5) }}
              style={{ padding: '0.375rem 0.875rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                background: active ? GREEN : 'transparent', color: active ? 'white' : 'var(--af-text-muted)',
                border: `1px solid ${active ? GREEN : 'rgba(34,85,14,0.2)'}` }}>
              {f === 'all' ? 'All' : `${f} ⭐`}
            </button>
          )
        })}
      </div>

      {/* Review cards */}
      {visible.length === 0 ? (
        <p style={{ color: 'var(--af-text-muted)', fontSize: '0.9375rem', padding: '1rem 0' }}>
          No {filter} star reviews yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visible.map((r, i) => (
            <div key={r.id ?? i} style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                  {r.profiles?.display_name?.[0] ?? '?'}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--af-text)' }}>{r.profiles?.display_name ?? 'Student'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span style={{ marginLeft: 'auto' }}><Stars rating={r.rating} /></span>
              </div>
              {r.comment && <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)', lineHeight: 1.6, marginBottom: '0.625rem' }}>{r.comment}</p>}
              <button type="button"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'transparent', border: '1px solid rgba(34,85,14,0.2)', color: 'var(--af-text-muted)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                👍 Helpful
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {filtered.length > visibleCount && (
        <button type="button" onClick={() => setVisibleCount(filtered.length)}
          style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.06)', border: '1px solid rgba(34,85,14,0.2)', color: GREEN, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          Load more reviews ({filtered.length - visibleCount} more)
        </button>
      )}
    </div>
  )
}
