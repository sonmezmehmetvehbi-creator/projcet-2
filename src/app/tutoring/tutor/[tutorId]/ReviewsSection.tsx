'use client'

import { useState } from 'react'

interface Review {
  id?: string
  rating: number
  comment?: string | null
  created_at: string
  profiles?: { display_name?: string } | null
}

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const [expanded, setExpanded] = useState(false)

  if (!reviews || reviews.length === 0) return null

  const visible = expanded ? reviews : reviews.slice(0, 3)

  return (
    <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '1rem' }}>
        ⭐ Reviews
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {visible.map((r, i) => (
          <div key={r.id ?? i} style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                {r.profiles?.display_name?.[0] ?? '?'}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--af-text)' }}>{r.profiles?.display_name ?? 'Student'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'rgb(251,191,36)' }}>{'★'.repeat(r.rating)}</span>
            </div>
            {r.comment && <p style={{ fontSize: '0.875rem', color: 'var(--af-text-muted)', lineHeight: 1.6 }}>{r.comment}</p>}
          </div>
        ))}
      </div>

      {reviews.length > 3 && (
        <button type="button" onClick={() => setExpanded(e => !e)}
          style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: 'rgb(34,85,14)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          {expanded ? 'Show Less' : `See All ${reviews.length} Comments →`}
        </button>
      )}
    </div>
  )
}
