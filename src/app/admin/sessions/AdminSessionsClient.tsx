'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  sessions: any[]
}

const safeLink = (url: string) => {
  const u = (url || '').trim()
  return /^https?:\/\//i.test(u) ? u : 'https://' + u
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: 'rgba(217,119,6,0.12)', color: 'rgb(180,83,9)' },
  confirmed: { bg: 'rgba(37,99,235,0.12)', color: 'rgb(37,99,235)' },
  completed: { bg: 'rgba(34,85,14,0.12)', color: 'rgb(34,85,14)' },
  declined: { bg: 'rgba(107,107,88,0.15)', color: 'rgb(90,90,72)' },
  disputed: { bg: 'rgba(163,45,45,0.12)', color: 'rgb(163,45,45)' },
  refunded: { bg: 'rgba(107,107,88,0.15)', color: 'rgb(90,90,72)' },
}

export default function AdminSessionsClient({ sessions: sessionsProp }: Props) {
  const router = useRouter()
  const [sessions, setSessions] = useState(sessionsProp)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'pending' | 'confirmed' | 'completed' | 'declined' | 'disputed'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const now = Date.now()
  const isDisputed = (s: any) => s.status === 'disputed' || s.dispute_filed
  const count = (pred: (s: any) => boolean) => sessions.filter(pred).length

  const STATS = [
    { label: 'Total Sessions', value: sessions.length, color: 'rgb(34,85,14)' },
    { label: 'Pending', value: count(s => s.status === 'pending'), color: 'rgb(180,83,9)' },
    { label: 'Confirmed', value: count(s => s.status === 'confirmed'), color: 'rgb(37,99,235)' },
    { label: 'Completed', value: count(s => s.status === 'completed'), color: 'rgb(34,85,14)' },
    { label: 'Declined', value: count(s => s.status === 'declined'), color: 'rgb(90,90,72)' },
    { label: 'Disputed', value: count(isDisputed), color: 'rgb(163,45,45)' },
  ]

  const TABS = ['all', 'upcoming', 'pending', 'confirmed', 'completed', 'declined', 'disputed'] as const

  const visible = sessions.filter(s => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return s.status === 'confirmed' && new Date(s.scheduled_at).getTime() > now
    if (filter === 'disputed') return isDisputed(s)
    return s.status === filter
  })

  // Accepted/declined log, most recent first.
  const log = sessions
    .filter(s => ['confirmed', 'declined', 'completed', 'refunded'].includes(s.status))
    .slice()
    .sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime())

  async function issueRefund(s: any) {
    if (!confirm(`Issue a full refund of $${s.student_price} to ${s.student?.display_name ?? 'the student'}?`)) return
    setBusy(s.id)
    try {
      const res = await fetch('/api/admin/refund-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: s.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert(`Refund failed: ${data.error ?? res.status}`); setBusy(null); return }
      setSessions(prev => prev.map(x => x.id === s.id ? { ...x, status: 'refunded', stripe_refund_id: data.refundId ?? x.stripe_refund_id } : x))
    } catch (e: any) {
      alert(`Refund failed: ${e?.message ?? 'network error'}`)
    }
    setBusy(null)
  }

  async function markComplete(s: any) {
    if (!confirm('Mark this session as complete?')) return
    setBusy(s.id)
    try {
      const res = await fetch('/api/tutor/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: s.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert(`Failed: ${data.error ?? res.status}`); setBusy(null); return }
      setSessions(prev => prev.map(x => x.id === s.id ? { ...x, status: 'completed' } : x))
      router.refresh()
    } catch (e: any) {
      alert(`Failed: ${e?.message ?? 'network error'}`)
    }
    setBusy(null)
  }

  const cardBorder = '1px solid rgba(34,85,14,0.12)'
  const labelStyle: React.CSSProperties = { fontSize: '0.625rem', fontWeight: 700, color: 'rgb(140,140,120)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }

  function StatusBadge({ status }: { status: string }) {
    const st = STATUS_STYLE[status] ?? { bg: 'rgba(107,107,88,0.12)', color: 'rgb(90,90,72)' }
    return (
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: st.bg, color: st.color }}>
        {status}
      </span>
    )
  }

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.25rem' }}>Sessions</h1>
        <p style={{ color: 'rgb(107,107,88)', marginBottom: '1.5rem' }}>All tutoring sessions across the platform.</p>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ padding: '1rem 1.25rem', borderRadius: '0.875rem', background: 'white', border: cardBorder }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgb(140,140,120)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {TABS.map(t => {
            const active = filter === t
            return (
              <button key={t} onClick={() => setFilter(t)}
                style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                  background: active ? 'rgb(34,85,14)' : 'white', color: active ? 'white' : 'rgb(90,90,72)',
                  border: active ? '1px solid rgb(34,85,14)' : cardBorder }}>
                {t}
              </button>
            )
          })}
        </div>

        {/* Session cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
          {visible.length === 0 && (
            <div style={{ padding: '3rem', borderRadius: '1rem', background: 'white', border: cardBorder, textAlign: 'center', color: 'rgb(140,140,120)' }}>
              No {filter === 'all' ? '' : filter} sessions.
            </div>
          )}
          {visible.map(s => {
            const open = expanded === s.id
            const past = new Date(s.scheduled_at).getTime() < now
            const canRefund = (s.status === 'completed' || isDisputed(s)) && s.status !== 'refunded'
            const canComplete = s.status === 'confirmed' && past
            return (
              <div key={s.id} style={{ borderRadius: '1rem', background: 'white', border: cardBorder, overflow: 'hidden' }}>
                <div onClick={() => setExpanded(open ? null : s.id)} style={{ padding: '1.25rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, color: 'rgb(26,26,20)' }}>{s.student?.display_name ?? 'Student'}</p>
                        <StatusBadge status={s.status} />
                        {isDisputed(s) && s.status !== 'disputed' && <StatusBadge status="disputed" />}
                        {s.express_tier && s.express_tier !== 'standard' && (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(217,119,6,0.12)', color: 'rgb(180,83,9)' }}>⚡ {s.express_tier}</span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)', marginBottom: '0.2rem' }}>{s.student?.email}</p>
                      <p style={{ fontSize: '0.875rem', color: 'rgb(60,60,50)', marginBottom: '0.2rem' }}>
                        🎓 Tutor: <strong>{s.tutor?.display_name ?? '—'}</strong>
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'rgb(60,60,50)' }}>{s.subject} — {s.topic}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)', marginTop: '0.3rem' }}>
                        📅 {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min · Paid <strong>${s.student_price}</strong> · Payout <strong>${s.tutor_payout}</strong>
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgb(140,140,120)' }}>{open ? '▲ Collapse' : '▼ Details'}</span>
                    </div>
                  </div>
                </div>

                {open && (
                  <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(34,85,14,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '0.75rem', margin: '1rem 0' }}>
                      <div><p style={labelStyle}>Grade</p><p style={{ fontSize: '0.875rem', color: 'rgb(40,40,32)' }}>{s.grade ?? '—'}</p></div>
                      <div><p style={labelStyle}>Language</p><p style={{ fontSize: '0.875rem', color: 'rgb(40,40,32)' }}>{s.language ?? '—'}</p></div>
                      <div><p style={labelStyle}>Wants Continuing</p><p style={{ fontSize: '0.875rem', color: 'rgb(40,40,32)' }}>{s.wants_continuing ? 'Yes 🔁' : 'No'}</p></div>
                      <div><p style={labelStyle}>Created</p><p style={{ fontSize: '0.875rem', color: 'rgb(40,40,32)' }}>{s.created_at ? new Date(s.created_at).toLocaleString() : '—'}</p></div>
                      <div><p style={labelStyle}>Stripe Payment Intent</p><p style={{ fontSize: '0.75rem', color: 'rgb(40,40,32)', wordBreak: 'break-all' }}>{s.stripe_payment_intent_id ?? '—'}</p></div>
                      <div><p style={labelStyle}>Stripe Refund</p><p style={{ fontSize: '0.75rem', color: 'rgb(40,40,32)', wordBreak: 'break-all' }}>{s.stripe_refund_id ?? '—'}</p></div>
                    </div>

                    {s.meet_link && (
                      <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        🎥 <a href={safeLink(s.meet_link)} target="_blank" rel="noopener noreferrer" style={{ color: 'rgb(34,85,14)', fontWeight: 600 }}>Join Meet Link →</a>
                      </p>
                    )}

                    {s.file_urls?.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={labelStyle}>Uploaded files</p>
                        {s.file_urls.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '0.875rem', color: 'rgb(34,85,14)', marginTop: '0.2rem' }}>📄 File {i + 1} →</a>
                        ))}
                      </div>
                    )}

                    {isDisputed(s) && s.dispute_reason && (
                      <div style={{ padding: '0.75rem', borderRadius: '0.625rem', background: 'rgba(163,45,45,0.06)', border: '1px solid rgba(163,45,45,0.2)', marginBottom: '0.75rem' }}>
                        <p style={labelStyle}>Dispute reason</p>
                        <p style={{ fontSize: '0.875rem', color: 'rgb(120,30,30)' }}>{s.dispute_reason}</p>
                      </div>
                    )}

                    {(canRefund || canComplete) && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {canComplete && (
                          <button onClick={() => markComplete(s)} disabled={busy === s.id}
                            style={{ padding: '0.5rem 1.1rem', borderRadius: '0.625rem', background: 'rgb(34,85,14)', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', opacity: busy === s.id ? 0.6 : 1 }}>
                            ✅ Mark Complete
                          </button>
                        )}
                        {canRefund && (
                          <button onClick={() => issueRefund(s)} disabled={busy === s.id}
                            style={{ padding: '0.5rem 1.1rem', borderRadius: '0.625rem', background: 'rgba(163,45,45,0.1)', border: '1px solid rgba(163,45,45,0.3)', color: 'rgb(163,45,45)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', opacity: busy === s.id ? 0.6 : 1 }}>
                            💸 Issue Refund
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Accepted / declined log */}
        <div style={{ borderRadius: '1rem', background: 'white', border: cardBorder, padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '1rem' }}>📜 Accepted / Declined Log</h2>
          {log.length === 0 ? (
            <p style={{ color: 'rgb(140,140,120)' }}>No history yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {log.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'rgb(250,250,247)', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'rgb(40,40,32)', fontWeight: 600 }}>{s.student?.display_name ?? 'Student'}</span>
                    <span style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)' }}> · {s.tutor?.display_name ?? '—'} · {s.subject}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <StatusBadge status={s.status} />
                    <span style={{ fontSize: '0.75rem', color: 'rgb(140,140,120)' }}>{new Date(s.updated_at ?? s.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
