'use client'

import { useState, useMemo } from 'react'

interface Payout {
  id: string
  tutor_id: string
  amount: number
  status: string
  request_status: string
  requested_at: string | null
  paid_at: string | null
  created_at: string | null
  paid_via: string | null
  reference_id: string | null
  receipt_url: string | null
  notes: string | null
  tutor_name: string
  tutor_email: string
  payment_handle: string
  venmo: string | null
  paypal: string | null
  zelle: string | null
  session_subject: string
  session_date: string | null
}

interface Tutor {
  id: string
  name: string
  email: string
  venmo: string | null
  paypal: string | null
  zelle: string | null
  payment_handle: string
  w9_collected: boolean
  total_paid: number
  total_pending: number
  earned_this_year: number
  session_count: number
}

interface SessionRow {
  id: string
  student_price: number
  created_at: string | null
  status: string
}

interface Props {
  payouts: Payout[]
  tutors: Tutor[]
  sessions: SessionRow[]
  reports: any[]
  thisYear: number
}

const GREEN = 'rgb(34,85,14)'
const MUTED = 'rgb(107,107,88)'
const INK = 'rgb(26,26,20)'

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = rows.map(r => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'pending', label: '⏳ Pending Payouts' },
  { id: 'history', label: '🧾 Payout History' },
  { id: 'tax', label: '🏛️ Tax Center' },
] as const

type TabId = typeof TABS[number]['id']

export default function AdminPayoutsClient({ payouts: initialPayouts, tutors: initialTutors, sessions, reports, thisYear }: Props) {
  const [tab, setTab] = useState<TabId>('overview')
  const [payouts, setPayouts] = useState(initialPayouts)
  const [tutors, setTutors] = useState(initialTutors)

  // ---- Aggregates ----
  const totalRevenue = useMemo(() => sessions.reduce((s, x) => s + x.student_price, 0), [sessions])
  const totalPaid = useMemo(() => payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0), [payouts])
  const totalPending = useMemo(() => payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0), [payouts])
  const profit = totalRevenue - totalPaid

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh' }}>
      <div style={{ maxWidth: '76rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, marginBottom: '0.25rem' }}>
          Payouts & Tax Center
        </h1>
        <p style={{ color: MUTED, marginBottom: '1.5rem' }}>Manual payout processing, receipts, and 1099 tracking.</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '2rem', borderBottom: '2px solid rgba(34,85,14,0.08)', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.9375rem', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? INK : MUTED, background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: tab === t.id ? `2px solid ${INK}` : '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <OverviewTab payouts={payouts} sessions={sessions} totalRevenue={totalRevenue} totalPaid={totalPaid} totalPending={totalPending} profit={profit} />
        )}
        {tab === 'pending' && (
          <PendingTab tutors={tutors} payouts={payouts} setPayouts={setPayouts} />
        )}
        {tab === 'history' && (
          <HistoryTab payouts={payouts} tutors={tutors} thisYear={thisYear} />
        )}
        {tab === 'tax' && (
          <TaxTab tutors={tutors} setTutors={setTutors} thisYear={thisYear} />
        )}
      </div>
    </div>
  )
}

// ============ Tab 1: Overview ============
function OverviewTab({ payouts, sessions, totalRevenue, totalPaid, totalPending, profit }: {
  payouts: Payout[]; sessions: SessionRow[]; totalRevenue: number; totalPaid: number; totalPending: number; profit: number
}) {
  const STATS = [
    { label: 'Total Revenue', value: totalRevenue, emoji: '💵', color: 'rgb(37,99,235)' },
    { label: 'Total Paid Out', value: totalPaid, emoji: '💸', color: GREEN },
    { label: 'Total Pending', value: totalPending, emoji: '⏳', color: 'rgb(217,119,6)' },
    { label: 'Platform Profit', value: profit, emoji: '📈', color: profit >= 0 ? GREEN : 'rgb(163,45,45)' },
  ]

  // Last 6 months revenue vs payouts
  const months = useMemo(() => {
    const out: { key: string; label: string; revenue: number; payouts: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('en-US', { month: 'short' })
      const revenue = sessions.filter(s => s.created_at && s.created_at.startsWith(key)).reduce((sum, s) => sum + s.student_price, 0)
      const pay = payouts.filter(p => p.status === 'paid' && p.paid_at && p.paid_at.startsWith(key)).reduce((sum, p) => sum + p.amount, 0)
      out.push({ key, label, revenue, payouts: pay })
    }
    return out
  }, [sessions, payouts])

  const maxBar = Math.max(1, ...months.flatMap(m => [m.revenue, m.payouts]))

  function exportAll() {
    const rows: (string | number)[][] = [
      ['Payout ID', 'Tutor', 'Email', 'Amount', 'Status', 'Method', 'Reference ID', 'Session', 'Paid At', 'Created At'],
      ...payouts.map(p => [p.id, p.tutor_name, p.tutor_email, p.amount.toFixed(2), p.status, p.paid_via ?? '', p.reference_id ?? '', p.session_subject, p.paid_at ?? '', p.created_at ?? '']),
    ]
    downloadCsv(`aceforge-payouts-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {STATS.map(s => (
          <div key={s.label} className="card" style={{ padding: '1.5rem', background: `${s.color}0d`, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.emoji}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
              ${s.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.375rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: INK }}>Revenue vs Payouts — last 6 months</h2>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: MUTED }}>
            <span><span style={{ display: 'inline-block', width: '0.75rem', height: '0.75rem', borderRadius: '2px', background: 'rgb(37,99,235)', marginRight: '0.375rem' }} />Revenue</span>
            <span><span style={{ display: 'inline-block', width: '0.75rem', height: '0.75rem', borderRadius: '2px', background: GREEN, marginRight: '0.375rem' }} />Payouts</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '220px', padding: '0 0.5rem' }}>
          {months.map(m => (
            <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.25rem', height: '180px', width: '100%', justifyContent: 'center' }}>
                <div title={`Revenue $${m.revenue.toFixed(2)}`} style={{ width: '40%', maxWidth: '1.75rem', height: `${(m.revenue / maxBar) * 100}%`, minHeight: m.revenue > 0 ? '4px' : '0', background: 'rgb(37,99,235)', borderRadius: '4px 4px 0 0' }} />
                <div title={`Payouts $${m.payouts.toFixed(2)}`} style={{ width: '40%', maxWidth: '1.75rem', height: `${(m.payouts / maxBar) * 100}%`, minHeight: m.payouts > 0 ? '4px' : '0', background: GREEN, borderRadius: '4px 4px 0 0' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: MUTED, fontWeight: 600, marginTop: '0.5rem' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={exportAll}
        style={{ padding: '0.625rem 1.25rem', borderRadius: '0.625rem', background: GREEN, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
        ⬇️ Export CSV
      </button>
    </div>
  )
}

// ============ Tab 2: Pending Payouts ============
function PendingTab({ tutors, payouts, setPayouts }: {
  tutors: Tutor[]; payouts: Payout[]; setPayouts: React.Dispatch<React.SetStateAction<Payout[]>>
}) {
  const [openForm, setOpenForm] = useState<string | null>(null)
  const [done, setDone] = useState<Record<string, boolean>>({})

  // Tutors with pending balance > 0, computed live from payouts
  const pendingByTutor = useMemo(() => {
    return tutors
      .map(t => {
        const tp = payouts.filter(p => p.tutor_id === t.id && p.status === 'pending')
        return { tutor: t, pendingPayouts: tp, amount: tp.reduce((s, p) => s + p.amount, 0) }
      })
      .filter(row => row.amount > 0)
  }, [tutors, payouts])

  if (pendingByTutor.length === 0) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center', color: MUTED }}>No pending payouts 🎉</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {pendingByTutor.map(({ tutor, pendingPayouts, amount }) => (
        <div key={tutor.id} className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.0625rem', color: INK }}>{tutor.name}</p>
              <p style={{ fontSize: '0.875rem', color: MUTED }}>{tutor.email || 'No email'}</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {tutor.venmo && <span style={chip}>Venmo: {tutor.venmo}</span>}
                {tutor.paypal && <span style={chip}>PayPal: {tutor.paypal}</span>}
                {tutor.zelle && <span style={chip}>Zelle: {tutor.zelle}</span>}
                {!tutor.venmo && !tutor.paypal && !tutor.zelle && <span style={{ ...chip, color: 'rgb(163,45,45)' }}>No payment handle</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: GREEN, lineHeight: 1 }}>${amount.toFixed(2)}</p>
              <p style={{ fontSize: '0.75rem', color: MUTED, marginTop: '0.25rem' }}>{pendingPayouts.length} session{pendingPayouts.length !== 1 ? 's' : ''}</p>
              {!done[tutor.id] && openForm !== tutor.id && (
                <button onClick={() => setOpenForm(tutor.id)}
                  style={{ marginTop: '0.625rem', padding: '0.5rem 1rem', borderRadius: '0.625rem', background: GREEN, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                  ✓ Mark as Paid
                </button>
              )}
              {done[tutor.id] && <p style={{ marginTop: '0.625rem', color: GREEN, fontWeight: 600, fontSize: '0.875rem' }}>✅ Paid</p>}
            </div>
          </div>

          {openForm === tutor.id && (
            <MarkPaidForm
              tutor={tutor}
              pendingPayouts={pendingPayouts}
              onCancel={() => setOpenForm(null)}
              onPaid={(ids) => {
                setPayouts(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: 'paid', request_status: 'paid', paid_at: new Date().toISOString() } : p))
                setDone(d => ({ ...d, [tutor.id]: true }))
                setOpenForm(null)
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function MarkPaidForm({ tutor, pendingPayouts, onCancel, onPaid }: {
  tutor: Tutor; pendingPayouts: Payout[]; onCancel: () => void; onPaid: (ids: string[]) => void
}) {
  const defaultMethod = tutor.venmo ? 'Venmo' : tutor.paypal ? 'PayPal' : tutor.zelle ? 'Zelle' : 'Venmo'
  const [method, setMethod] = useState(defaultMethod)
  const [reference, setReference] = useState('')
  const [legalName, setLegalName] = useState(tutor.name)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleFor = (m: string) => m === 'Venmo' ? tutor.venmo : m === 'PayPal' ? tutor.paypal : tutor.zelle

  async function confirm() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const ids: string[] = []
      for (const p of pendingPayouts) {
        const res = await fetch('/api/admin/mark-payout-paid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payoutId: p.id,
            tutorId: tutor.id,
            amount: p.amount,
            paidVia: method,
            referenceId: reference || null,
            tutorName: legalName,
            tutorEmail: tutor.email,
            tutorPaymentHandle: handleFor(method) ?? tutor.payment_handle,
            notes: notes || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed')
        ids.push(p.id)
      }
      onPaid(ids)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(34,85,14,0.1)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '0.875rem' }}>
      <div>
        <label style={lbl}>Payment method</label>
        <select value={method} onChange={e => setMethod(e.target.value)} style={input}>
          {['Venmo', 'PayPal', 'Zelle'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>Reference / transaction ID</label>
        <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. TXN-12345" style={input} />
      </div>
      <div>
        <label style={lbl}>Tutor legal name</label>
        <input value={legalName} onChange={e => setLegalName(e.target.value)} style={input} />
      </div>
      <div>
        <label style={lbl}>Notes (optional)</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" style={input} />
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
        <button onClick={confirm} disabled={busy}
          style={{ padding: '0.625rem 1.25rem', borderRadius: '0.625rem', background: GREEN, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Processing…' : `Confirm payment of $${pendingPayouts.reduce((s, p) => s + p.amount, 0).toFixed(2)}`}
        </button>
        <button onClick={onCancel} disabled={busy}
          style={{ padding: '0.625rem 1rem', borderRadius: '0.625rem', background: 'transparent', border: `1px solid ${MUTED}40`, color: MUTED, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          Cancel
        </button>
        {error && <span style={{ color: 'rgb(163,45,45)', fontSize: '0.8125rem' }}>{error}</span>}
      </div>
    </div>
  )
}

// ============ Tab 3: Payout History ============
function HistoryTab({ payouts, tutors, thisYear }: { payouts: Payout[]; tutors: Tutor[]; thisYear: number }) {
  const [tutorFilter, setTutorFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')

  const paid = useMemo(() => payouts.filter(p => p.status === 'paid'), [payouts])

  const monthOptions = useMemo(() => {
    const set = new Set<string>()
    paid.forEach(p => { if (p.paid_at) set.add(p.paid_at.slice(0, 7)) })
    return Array.from(set).sort().reverse()
  }, [paid])

  const filtered = useMemo(() => paid.filter(p => {
    if (tutorFilter !== 'all' && p.tutor_id !== tutorFilter) return false
    if (monthFilter !== 'all' && !(p.paid_at ?? '').startsWith(monthFilter)) return false
    return true
  }), [paid, tutorFilter, monthFilter])

  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const paidThisMonth = paid.filter(p => (p.paid_at ?? '').startsWith(thisMonthKey)).reduce((s, p) => s + p.amount, 0)
  const paidThisYear = paid.filter(p => p.paid_at && new Date(p.paid_at).getFullYear() === thisYear).reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid this month</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: GREEN, marginTop: '0.25rem' }}>${paidThisMonth.toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid this year ({thisYear})</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: GREEN, marginTop: '0.25rem' }}>${paidThisYear.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select value={tutorFilter} onChange={e => setTutorFilter(e.target.value)} style={input}>
          <option value="all">All tutors</option>
          {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} style={input}>
          <option value="all">All months</option>
          {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: MUTED }}>No paid payouts match.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(34,85,14,0.04)' }}>
                  {['Date', 'Tutor', 'Amount', 'Method', 'Reference ID', 'Session', 'Receipt'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(34,85,14,0.06)' }}>
                    <td style={td}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                    <td style={{ ...td, fontWeight: 600, color: INK }}>{p.tutor_name}</td>
                    <td style={{ ...td, fontWeight: 700, color: GREEN }}>${p.amount.toFixed(2)}</td>
                    <td style={td}>{p.paid_via ?? '—'}</td>
                    <td style={td}>{p.reference_id ?? '—'}</td>
                    <td style={td}>{p.session_subject}</td>
                    <td style={td}>
                      {p.receipt_url
                        ? <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: GREEN, fontWeight: 600, textDecoration: 'none' }}>⬇️ Receipt</a>
                        : <span style={{ color: MUTED }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ Tab 4: Tax Center ============
function TaxTab({ tutors, setTutors, thisYear }: {
  tutors: Tutor[]; setTutors: React.Dispatch<React.SetStateAction<Tutor[]>>; thisYear: number
}) {
  const [busy, setBusy] = useState<string | null>(null)

  const rows = useMemo(() => [...tutors].sort((a, b) => b.earned_this_year - a.earned_this_year), [tutors])

  async function toggleW9(tutor: Tutor) {
    if (busy) return
    setBusy(tutor.id)
    try {
      const res = await fetch('/api/admin/toggle-w9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId: tutor.id, collected: !tutor.w9_collected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setTutors(prev => prev.map(t => t.id === tutor.id ? { ...t, w9_collected: !t.w9_collected } : t))
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setBusy(null)
    }
  }

  function export1099() {
    const needs = rows.filter(t => t.earned_this_year >= 600)
    const data: (string | number)[][] = [
      ['Tutor Legal Name', 'Email', 'Address (placeholder)', `Total Earnings ${thisYear}`, 'W-9 Collected', '1099 Required'],
      ...needs.map(t => [t.name, t.email, '— collect on W-9 —', t.earned_this_year.toFixed(2), t.w9_collected ? 'Yes' : 'No', 'Yes']),
    ]
    downloadCsv(`aceforge-1099-${thisYear}.csv`, data)
  }

  const tierColor = (amt: number) => amt >= 600 ? 'rgb(163,45,45)' : amt >= 400 ? 'rgb(217,119,6)' : GREEN
  const tierBg = (amt: number) => amt >= 600 ? 'rgba(163,45,45,0.08)' : amt >= 400 ? 'rgba(217,119,6,0.08)' : 'rgba(34,85,14,0.06)'

  return (
    <div>
      <div style={{ padding: '1rem 1.25rem', borderRadius: '0.875rem', background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'rgb(37,99,235)', lineHeight: 1.6 }}>
          🏛️ Tutors earning <strong>$600+</strong> will receive a 1099-NEC. Collect their W-9 before filing.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={export1099}
          style={{ padding: '0.625rem 1.25rem', borderRadius: '0.625rem', background: GREEN, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          ⬇️ Export 1099 Data
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(34,85,14,0.04)' }}>
                {['Tutor', `Earnings ${thisYear}`, 'Status', 'W-9', ''].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(34,85,14,0.06)' }}>
                  <td style={{ ...td, fontWeight: 600, color: INK }}>
                    {t.name}
                    <div style={{ fontSize: '0.75rem', color: MUTED, fontWeight: 400 }}>{t.email}</div>
                  </td>
                  <td style={td}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.875rem', color: tierColor(t.earned_this_year), background: tierBg(t.earned_this_year) }}>
                      ${t.earned_this_year.toFixed(2)}
                    </span>
                  </td>
                  <td style={td}>
                    {t.earned_this_year >= 600
                      ? <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(163,45,45,0.12)', color: 'rgb(163,45,45)' }}>1099 Required</span>
                      : t.earned_this_year >= 400
                        ? <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(217,119,6,0.12)', color: 'rgb(180,99,5)' }}>Approaching</span>
                        : <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', color: GREEN }}>Under $600</span>}
                  </td>
                  <td style={td}>
                    {t.w9_collected
                      ? <span style={{ color: GREEN, fontWeight: 600, fontSize: '0.8125rem' }}>✅ Collected</span>
                      : <span style={{ color: MUTED, fontWeight: 600, fontSize: '0.8125rem' }}>Not collected</span>}
                  </td>
                  <td style={td}>
                    <button onClick={() => toggleW9(t)} disabled={busy === t.id}
                      style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', background: t.w9_collected ? 'transparent' : GREEN, border: t.w9_collected ? `1px solid ${MUTED}40` : 'none', color: t.w9_collected ? MUTED : 'white', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {busy === t.id ? '…' : t.w9_collected ? 'Mark uncollected' : 'Mark collected'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---- shared styles ----
const chip: React.CSSProperties = { fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', color: GREEN, fontWeight: 600 }
const lbl: React.CSSProperties = { display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }
const input: React.CSSProperties = { width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.625rem', border: '1.5px solid rgba(34,85,14,0.2)', background: 'white', color: INK, fontSize: '0.875rem', boxSizing: 'border-box' }
const th: React.CSSProperties = { padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(34,85,14,0.08)', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '0.875rem 1rem', fontSize: '0.875rem', color: MUTED }
