'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface QuizReport {
  id: string
  quiz_id: string
  quizTitle: string
  quizIsPublic: boolean
  quizDeleted: boolean
  reporterName: string
  reason: string
  details: string | null
  status: string
  created_at: string
}

const INK = 'rgb(240,240,235)'
const MUTED = 'rgba(255,255,255,0.55)'
const GREEN = 'rgb(34,85,14)'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: 'rgba(217,119,6,0.12)', color: 'rgb(180,83,9)', label: 'Pending' },
  reviewed: { bg: 'rgba(37,99,235,0.12)', color: 'rgb(37,99,235)', label: 'Reviewed' },
  action_taken: { bg: 'rgba(34,85,14,0.12)', color: 'rgb(122,192,74)', label: 'Action Taken' },
  dismissed: { bg: 'rgba(107,107,88,0.15)', color: 'rgba(255,255,255,0.55)', label: 'Dismissed' },
}

const STATUS_ACTIONS = [
  { id: 'reviewed', label: 'Reviewed' },
  { id: 'dismissed', label: 'Dismissed' },
]

const FILTERS = ['all', 'pending', 'reviewed', 'action_taken', 'dismissed'] as const

export default function AdminQuizReportsClient({ reports: initial }: { reports: QuizReport[] }) {
  const [reports, setReports] = useState<QuizReport[]>(initial)
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const visible = reports.filter(r => (filter === 'all' ? true : r.status === filter))

  async function update(reportId: string, opts: { status?: string; action?: 'make_private' | 'delete_quiz' }) {
    setBusy(reportId)
    try {
      const res = await fetch('/api/admin/update-quiz-report', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, ...opts }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setReports(prev => prev.map(r => {
        if (r.id !== reportId) return r
        return {
          ...r,
          status: data.status ?? r.status,
          quizDeleted: opts.action === 'delete_quiz' ? true : r.quizDeleted,
          quizIsPublic: opts.action === 'make_private' ? false : r.quizIsPublic,
        }
      }))
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setBusy(null)
    setConfirmDelete(null)
  }

  const badge = (status: string) => STATUS_STYLE[status] ?? { bg: 'rgba(107,107,88,0.12)', color: MUTED, label: status }

  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: INK, marginBottom: '0.25rem' }}>Quiz Reports</h2>
      <p style={{ color: MUTED, marginBottom: '1.5rem' }}>Public Forge Quizzes flagged by users.</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {FILTERS.map(f => {
          const active = filter === f
          const count = f === 'all' ? reports.length : reports.filter(r => r.status === f).length
          return (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                background: active ? GREEN : 'transparent', color: active ? 'white' : 'rgba(255,255,255,0.55)',
                border: active ? `1px solid ${GREEN}` : '1px solid rgba(34,85,14,0.12)' }}>
              {f.replace('_', ' ')} ({count})
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div style={{ padding: '3rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,85,14,0.12)', textAlign: 'center', color: MUTED }}>
          No {filter === 'all' ? '' : filter.replace('_', ' ')} quiz reports.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {visible.map(r => {
            const open = expanded === r.id
            const b = badge(r.status)
            return (
              <div key={r.id} style={{ borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,85,14,0.12)', overflow: 'hidden' }}>
                <div onClick={() => setExpanded(open ? null : r.id)} style={{ padding: '1.25rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, color: INK }}>🚩 {r.quizTitle}</p>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: b.bg, color: b.color }}>{b.label}</span>
                        {r.quizDeleted && <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(163,45,45,0.15)', color: 'rgb(248,113,113)' }}>Deleted</span>}
                        {!r.quizDeleted && !r.quizIsPublic && <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(107,107,88,0.15)', color: MUTED }}>Private</span>}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'rgb(60,60,50)' }}>⚠️ {r.reason}</p>
                      <p style={{ fontSize: '0.8125rem', color: MUTED, marginTop: '0.25rem' }}>
                        Reported by {r.reporterName} · {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{open ? '▲ Collapse' : '▼ Details'}</span>
                  </div>
                </div>

                {open && (
                  <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {r.details && (
                      <div style={{ padding: '0.875rem', borderRadius: '0.75rem', background: 'rgba(163,45,45,0.04)', border: '1px solid rgba(163,45,45,0.12)', margin: '1rem 0' }}>
                        <p style={{ fontSize: '0.625rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Details</p>
                        <p style={{ fontSize: '0.875rem', color: INK, lineHeight: 1.6 }}>{r.details}</p>
                      </div>
                    )}

                    <div style={{ margin: '1rem 0' }}>
                      <Link href={`/arena/browse/${r.quiz_id}`} target="_blank"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', color: 'rgb(96,165,250)', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
                        🔍 Preview reported quiz ↗
                      </Link>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {STATUS_ACTIONS.map(a => (
                        <button key={a.id} onClick={() => update(r.id, { status: a.id })} disabled={busy === r.id || r.status === a.id}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: r.status === a.id ? 'rgba(34,85,14,0.1)' : GREEN, border: 'none', color: r.status === a.id ? GREEN : 'white', fontWeight: 600, fontSize: '0.8125rem', cursor: r.status === a.id ? 'default' : 'pointer', opacity: busy === r.id ? 0.6 : 1 }}>
                          {a.label}
                        </button>
                      ))}
                      {/* Moderation: force private / delete. Both mark the report actioned. */}
                      {!r.quizDeleted && (
                        <>
                          <button onClick={() => update(r.id, { action: 'make_private' })} disabled={busy === r.id || !r.quizIsPublic}
                            style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.4)', color: 'rgb(217,119,6)', fontWeight: 600, fontSize: '0.8125rem', cursor: !r.quizIsPublic ? 'default' : 'pointer', opacity: busy === r.id || !r.quizIsPublic ? 0.6 : 1 }}>
                            {r.quizIsPublic ? 'Make Private' : 'Already Private'}
                          </button>
                          {confirmDelete === r.id ? (
                            <span style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8125rem', color: 'rgb(248,113,113)', fontWeight: 600 }}>Delete quiz?</span>
                              <button onClick={() => update(r.id, { action: 'delete_quiz' })} disabled={busy === r.id}
                                style={{ padding: '0.5rem 0.9rem', borderRadius: '0.625rem', background: 'rgb(185,28,28)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>
                                Yes, delete
                              </button>
                              <button onClick={() => setConfirmDelete(null)} disabled={busy === r.id}
                                style={{ padding: '0.5rem 0.9rem', borderRadius: '0.625rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: MUTED, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDelete(r.id)} disabled={busy === r.id}
                              style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgba(163,45,45,0.12)', border: '1px solid rgba(163,45,45,0.4)', color: 'rgb(248,113,113)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                              Delete Quiz
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
