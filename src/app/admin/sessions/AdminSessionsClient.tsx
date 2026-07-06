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
  completed: { bg: 'rgba(34,85,14,0.12)', color: 'rgb(122,192,74)' },
  declined: { bg: 'rgba(107,107,88,0.15)', color: 'rgba(255,255,255,0.55)' },
  disputed: { bg: 'rgba(163,45,45,0.12)', color: 'rgb(248,113,113)' },
  refunded: { bg: 'rgba(107,107,88,0.15)', color: 'rgba(255,255,255,0.55)' },
  cancelled: { bg: 'rgba(107,107,88,0.15)', color: 'rgba(255,255,255,0.55)' },
}

const CANCEL_REASONS = [
  'Tutor requested cancellation',
  'Student requested cancellation',
  'No-show by tutor',
  'No-show by student',
  'Inappropriate behavior',
  'Technical issues',
  'Other',
]

export default function AdminSessionsClient({ sessions: sessionsProp }: Props) {
  const router = useRouter()
  const [sessions, setSessions] = useState(sessionsProp)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'pending' | 'confirmed' | 'completed' | 'declined' | 'disputed'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Session chat viewer state.
  const [viewingChatId, setViewingChatId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [loadingChat, setLoadingChat] = useState(false)

  async function loadSessionChat(sessionId: string) {
    if (viewingChatId === sessionId) { setViewingChatId(null); setChatMessages([]); return }
    setLoadingChat(true)
    setViewingChatId(sessionId)
    try {
      const res = await fetch(`/api/tutoring/messages?sessionId=${sessionId}`)
      const data = await res.json()
      setChatMessages(data.messages ?? [])
    } catch {}
    setLoadingChat(false)
  }

  // Inline cancel form state.
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0])
  const [cancelNotes, setCancelNotes] = useState('')
  const [cancelRefund, setCancelRefund] = useState(true)

  function openCancel(id: string) {
    setCancelId(id)
    setCancelReason(CANCEL_REASONS[0])
    setCancelNotes('')
    setCancelRefund(true)
  }

  async function cancelSession(s: any) {
    setBusy(s.id)
    try {
      const res = await fetch('/api/admin/cancel-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: s.id, reason: cancelReason, notes: cancelNotes, refundStudent: cancelRefund }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert(`Cancel failed: ${data.error ?? res.status}`); setBusy(null); return }
      setSessions(prev => prev.map(x => x.id === s.id ? { ...x, status: 'cancelled', cancellation_reason: cancelReason } : x))
      setCancelId(null)
    } catch (e: any) {
      alert(`Cancel failed: ${e?.message ?? 'network error'}`)
    }
    setBusy(null)
  }

  const now = Date.now()
  const isDisputed = (s: any) => s.status === 'disputed' || s.dispute_filed
  const count = (pred: (s: any) => boolean) => sessions.filter(pred).length

  const STATS = [
    { label: 'Total Sessions', value: sessions.length, color: 'rgb(122,192,74)' },
    { label: 'Pending', value: count(s => s.status === 'pending'), color: 'rgb(180,83,9)' },
    { label: 'Confirmed', value: count(s => s.status === 'confirmed'), color: 'rgb(37,99,235)' },
    { label: 'Completed', value: count(s => s.status === 'completed'), color: 'rgb(122,192,74)' },
    { label: 'Declined', value: count(s => s.status === 'declined'), color: 'rgba(255,255,255,0.55)' },
    { label: 'Disputed', value: count(isDisputed), color: 'rgb(248,113,113)' },
  ]

  const TABS = ['all', 'upcoming', 'pending', 'confirmed', 'completed', 'declined', 'disputed'] as const

  const q = search.trim().toLowerCase()
  const visible = sessions.filter(s => {
    if (q) {
      const hay = `${s.student?.display_name ?? ''} ${s.tutor?.display_name ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
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

  const cardBorder = '1px solid rgba(255,255,255,0.08)'
  const labelStyle: React.CSSProperties = { fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }

  function StatusBadge({ status }: { status: string }) {
    const st = STATUS_STYLE[status] ?? { bg: 'rgba(107,107,88,0.12)', color: 'rgba(255,255,255,0.55)' }
    return (
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: st.bg, color: st.color }}>
        {status}
      </span>
    )
  }

  return (
    <div className="animate-fade-in" style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'rgb(240,240,235)', marginBottom: '0.25rem' }}>Sessions</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '1.5rem' }}>All tutoring sessions across the platform.</p>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ padding: '1rem 1.25rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.05)', border: cardBorder }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by student or tutor name…"
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgb(240,240,235)', fontSize: '0.9375rem', boxSizing: 'border-box', marginBottom: '1rem' }} />

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {TABS.map(t => {
            const active = filter === t
            return (
              <button key={t} onClick={() => setFilter(t)}
                style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                  background: active ? 'rgb(34,85,14)' : 'transparent', color: active ? 'white' : 'rgba(255,255,255,0.55)',
                  border: active ? '1px solid rgb(34,85,14)' : cardBorder }}>
                {t}
              </button>
            )
          })}
        </div>

        {/* Session cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
          {visible.length === 0 && (
            <div style={{ padding: '3rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: cardBorder, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              No {filter === 'all' ? '' : filter} sessions.
            </div>
          )}
          {visible.map(s => {
            const open = expanded === s.id
            const past = new Date(s.scheduled_at).getTime() < now
            const canRefund = (s.status === 'completed' || isDisputed(s)) && s.status !== 'refunded'
            const canComplete = s.status === 'confirmed' && past
            const canCancel = s.status === 'confirmed' || s.status === 'pending'
            return (
              <div key={s.id} style={{ borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: cardBorder, overflow: 'hidden' }}>
                <div onClick={() => setExpanded(open ? null : s.id)} style={{ padding: '1.25rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, color: 'rgb(240,240,235)' }}>{s.student?.display_name ?? 'Student'}</p>
                        <StatusBadge status={s.status} />
                        {isDisputed(s) && s.status !== 'disputed' && <StatusBadge status="disputed" />}
                        {s.express_tier && s.express_tier !== 'standard' && (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(217,119,6,0.12)', color: 'rgb(180,83,9)' }}>⚡ {s.express_tier}</span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.2rem' }}>{s.student?.email}</p>
                      <p style={{ fontSize: '0.875rem', color: 'rgb(60,60,50)', marginBottom: '0.2rem' }}>
                        🎓 Tutor: <strong>{s.tutor?.display_name ?? '—'}</strong>
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'rgb(60,60,50)' }}>{s.subject} — {s.topic}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.3rem' }}>
                        📅 {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min · Paid <strong>${s.student_price}</strong> · Payout <strong>${s.tutor_payout}</strong>
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{open ? '▲ Collapse' : '▼ Details'}</span>
                    </div>
                  </div>
                </div>

                {open && (
                  <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
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
                        🎥 <a href={safeLink(s.meet_link)} target="_blank" rel="noopener noreferrer" style={{ color: 'rgb(122,192,74)', fontWeight: 600 }}>Join Meet Link →</a>
                      </p>
                    )}

                    {s.file_urls?.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={labelStyle}>Uploaded files</p>
                        {s.file_urls.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '0.875rem', color: 'rgb(122,192,74)', marginTop: '0.2rem' }}>📄 File {i + 1} →</a>
                        ))}
                      </div>
                    )}

                    {isDisputed(s) && s.dispute_reason && (
                      <div style={{ padding: '0.75rem', borderRadius: '0.625rem', background: 'rgba(163,45,45,0.06)', border: '1px solid rgba(163,45,45,0.2)', marginBottom: '0.75rem' }}>
                        <p style={labelStyle}>Dispute reason</p>
                        <p style={{ fontSize: '0.875rem', color: 'rgb(120,30,30)' }}>{s.dispute_reason}</p>
                      </div>
                    )}

                    <div style={{ marginBottom: '0.875rem' }}>
                      <button onClick={() => loadSessionChat(s.id)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: 'rgb(37,99,235)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                        💬 {viewingChatId === s.id ? 'Hide Session Chat' : 'View Session Chat'}
                      </button>
                    </div>

                    {viewingChatId === s.id && (
                      <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '0.875rem', background: 'rgba(37,99,235,0.03)', border: '1px solid rgba(37,99,235,0.2)' }}>
                        <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1rem', fontWeight: 700, color: 'rgb(240,240,235)', marginBottom: '0.5rem' }}>Session Chat History (admin view)</p>
                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(107,107,88,0.1)', color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem' }}>
                          🔒 This conversation is being reviewed for dispute/admin purposes
                        </div>

                        {loadingChat ? (
                          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1.5rem' }}>Loading messages…</p>
                        ) : chatMessages.length === 0 ? (
                          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1.5rem' }}>No messages in this session</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {chatMessages.map((m, i) => {
                              const isTutor = !!m.is_tutor
                              const accent = isTutor ? 'rgb(79,70,229)' : 'rgb(34,85,14)'
                              const bg = isTutor ? 'rgba(79,70,229,0.08)' : 'rgba(34,85,14,0.06)'
                              return (
                                <div key={m.id ?? i} style={{ display: 'flex', flexDirection: 'column', alignItems: isTutor ? 'flex-end' : 'flex-start' }}>
                                  <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px', background: bg, color: accent, marginBottom: '0.25rem' }}>
                                    {isTutor ? 'Tutor' : 'Student'}
                                  </span>
                                  <div style={{ maxWidth: '80%', padding: '0.625rem 0.875rem', borderRadius: isTutor ? '0.875rem 0.875rem 0.25rem 0.875rem' : '0.875rem 0.875rem 0.875rem 0.25rem', background: bg, border: `1px solid ${accent}22` }}>
                                    {m.message && <p style={{ fontSize: '0.875rem', color: 'rgb(240,240,235)', lineHeight: 1.5 }}>{m.message}</p>}
                                    {m.file_url && (
                                      <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                                        style={{ display: 'inline-block', fontSize: '0.8125rem', color: accent, fontWeight: 600, marginTop: m.message ? '0.375rem' : 0 }}>
                                        📎 {m.file_name || 'View attachment'}
                                      </a>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                                    {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {(canRefund || canComplete || canCancel) && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {canComplete && (
                          <button onClick={() => markComplete(s)} disabled={busy === s.id}
                            style={{ padding: '0.5rem 1.1rem', borderRadius: '0.625rem', background: 'rgb(34,85,14)', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', opacity: busy === s.id ? 0.6 : 1 }}>
                            ✅ Mark Complete
                          </button>
                        )}
                        {canRefund && (
                          <button onClick={() => issueRefund(s)} disabled={busy === s.id}
                            style={{ padding: '0.5rem 1.1rem', borderRadius: '0.625rem', background: 'rgba(163,45,45,0.1)', border: '1px solid rgba(163,45,45,0.3)', color: 'rgb(248,113,113)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', opacity: busy === s.id ? 0.6 : 1 }}>
                            💸 Issue Refund
                          </button>
                        )}
                        {canCancel && cancelId !== s.id && (
                          <button onClick={() => openCancel(s.id)} disabled={busy === s.id}
                            style={{ padding: '0.5rem 1.1rem', borderRadius: '0.625rem', background: 'rgba(163,45,45,0.1)', border: '1px solid rgba(163,45,45,0.3)', color: 'rgb(248,113,113)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                            🚫 Cancel Session
                          </button>
                        )}
                      </div>
                    )}

                    {cancelId === s.id && (
                      <div style={{ marginTop: '1rem', padding: '1.25rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.04)', border: '1px solid rgba(163,45,45,0.2)' }}>
                        <p style={{ fontWeight: 700, color: 'rgb(248,113,113)', marginBottom: '0.875rem' }}>Cancel this session</p>

                        <label style={labelStyle}>Reason for cancellation</label>
                        <select value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                          style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.625rem', border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', fontSize: '0.875rem', marginBottom: '0.875rem', boxSizing: 'border-box' }}>
                          {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>

                        <label style={labelStyle}>Additional notes</label>
                        <textarea value={cancelNotes} onChange={e => setCancelNotes(e.target.value)} rows={2}
                          placeholder="Optional context…"
                          style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.625rem', border: '1.5px solid rgba(255,255,255,0.12)', fontSize: '0.875rem', resize: 'vertical', marginBottom: '0.875rem', boxSizing: 'border-box' }} />

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'rgb(40,40,32)', marginBottom: '1rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={cancelRefund} onChange={e => setCancelRefund(e.target.checked)} style={{ width: '1.1rem', height: '1.1rem' }} />
                          Refund student?
                        </label>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button onClick={() => cancelSession(s)} disabled={busy === s.id}
                            style={{ padding: '0.5rem 1.1rem', borderRadius: '0.625rem', background: 'rgb(248,113,113)', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', opacity: busy === s.id ? 0.6 : 1 }}>
                            {busy === s.id ? 'Cancelling…' : 'Cancel Session'}
                          </button>
                          <button onClick={() => setCancelId(null)} disabled={busy === s.id}
                            style={{ padding: '0.5rem 1.1rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,85,14,0.2)', color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                            Never mind
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Accepted / declined log */}
        <div style={{ borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: cardBorder, padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'rgb(240,240,235)', marginBottom: '1rem' }}>📜 Accepted / Declined Log</h2>
          {log.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>No history yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {log.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'rgb(18,18,28)', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'rgb(40,40,32)', fontWeight: 600 }}>{s.student?.display_name ?? 'Student'}</span>
                    <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)' }}> · {s.tutor?.display_name ?? '—'} · {s.subject}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <StatusBadge status={s.status} />
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{new Date(s.updated_at ?? s.created_at).toLocaleString()}</span>
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
