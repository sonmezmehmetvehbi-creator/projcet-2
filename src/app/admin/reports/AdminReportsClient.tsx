'use client'

import { useState } from 'react'

interface Report {
  id: string
  tutorName: string
  studentName: string
  studentEmail: string | null
  sessionDate: string | null
  sessionSubject: string | null
  complaint_type: string
  description: string
  status: string
  admin_notes: string | null
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
  { id: 'action_taken', label: 'Action Taken' },
  { id: 'dismissed', label: 'Dismissed' },
]

const FILTERS = ['all', 'pending', 'reviewed', 'action_taken', 'dismissed'] as const

export default function AdminReportsClient({ reports: initial }: { reports: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initial)
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const visible = reports.filter(r => filter === 'all' ? true : r.status === filter)

  async function update(reportId: string, status?: string, adminNotes?: string) {
    setBusy(reportId)
    try {
      const res = await fetch('/api/admin/update-report', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status, adminNotes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, ...(status ? { status } : {}), ...(adminNotes !== undefined ? { admin_notes: adminNotes } : {}) } : r))
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setBusy(null)
  }

  const badge = (status: string) => STATUS_STYLE[status] ?? { bg: 'rgba(107,107,88,0.12)', color: MUTED, label: status }

  return (
    <div className="animate-fade-in" style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, marginBottom: '0.25rem' }}>Tutor Reports</h1>
        <p style={{ color: MUTED, marginBottom: '1.5rem' }}>Complaints filed by tutors against students.</p>

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
            No {filter === 'all' ? '' : filter.replace('_', ' ')} reports.
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
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 700, color: INK }}>{r.tutorName} <span style={{ color: MUTED, fontWeight: 400 }}>vs</span> {r.studentName}</p>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: b.bg, color: b.color }}>{b.label}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'rgb(60,60,50)' }}>⚠️ {r.complaint_type}</p>
                        <p style={{ fontSize: '0.8125rem', color: MUTED, marginTop: '0.25rem' }}>
                          Filed {new Date(r.created_at).toLocaleDateString()}
                          {r.sessionDate ? ` · Session ${new Date(r.sessionDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{open ? '▲ Collapse' : '▼ Details'}</span>
                    </div>
                  </div>

                  {open && (
                    <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ padding: '0.875rem', borderRadius: '0.75rem', background: 'rgba(163,45,45,0.04)', border: '1px solid rgba(163,45,45,0.12)', margin: '1rem 0' }}>
                        <p style={{ fontSize: '0.625rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Description</p>
                        <p style={{ fontSize: '0.875rem', color: INK, lineHeight: 1.6 }}>{r.description}</p>
                      </div>

                      {r.studentEmail && <p style={{ fontSize: '0.8125rem', color: MUTED, marginBottom: '0.75rem' }}>Student email: {r.studentEmail}</p>}

                      <p style={{ fontSize: '0.625rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Admin notes</p>
                      <textarea
                        value={notes[r.id] ?? r.admin_notes ?? ''}
                        onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                        rows={2} placeholder="Internal notes about this report…"
                        style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.625rem', border: '1.5px solid rgba(255,255,255,0.12)', fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical', marginBottom: '0.75rem' }} />

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button onClick={() => update(r.id, undefined, notes[r.id] ?? r.admin_notes ?? '')} disabled={busy === r.id}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.12)', color: INK, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                          💾 Save Note
                        </button>
                        {STATUS_ACTIONS.map(a => (
                          <button key={a.id} onClick={() => update(r.id, a.id, notes[r.id])} disabled={busy === r.id || r.status === a.id}
                            style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: r.status === a.id ? 'rgba(34,85,14,0.1)' : GREEN, border: 'none', color: r.status === a.id ? GREEN : 'transparent', fontWeight: 600, fontSize: '0.8125rem', cursor: r.status === a.id ? 'default' : 'pointer', opacity: busy === r.id ? 0.6 : 1 }}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
