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
  status: string
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

interface TaxInfo {
  tutor_id: string
  legal_name: string | null
  email: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  business_name: string | null
  tax_entity_type: string | null
  w9_collected: boolean
  w9_collected_date: string | null
  notes: string | null
}

interface Props {
  payouts: Payout[]
  pendingPayouts: Payout[]
  tutors: Tutor[]
  sessions: SessionRow[]
  reports: any[]
  thisYear: number
  taxInfoMap: Record<string, TaxInfo>
  ytdEarningsMap: Record<string, number>
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
]

const ENTITY_TYPES = [
  { value: 'individual', label: 'Individual / Sole Proprietor' },
  { value: 'single_llc', label: 'Single-Member LLC' },
  { value: 'multi_llc', label: 'Multi-Member LLC' },
  { value: 's_corp', label: 'S-Corporation' },
  { value: 'c_corp', label: 'C-Corporation' },
  { value: 'partnership', label: 'Partnership' },
]

const entityLabel = (v: string | null | undefined) =>
  ENTITY_TYPES.find(e => e.value === v)?.label ?? (v || '')

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
  { id: 'tax', label: '🧾 Tax Info' },
] as const

type TabId = typeof TABS[number]['id']

export default function AdminPayoutsClient({ payouts: initialPayouts, pendingPayouts, tutors: initialTutors, sessions, reports, thisYear, taxInfoMap, ytdEarningsMap }: Props) {
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
          <PendingTab pendingPayouts={pendingPayouts} />
        )}
        {tab === 'history' && (
          <HistoryTab payouts={payouts} tutors={tutors} thisYear={thisYear} />
        )}
        {tab === 'tax' && (
          <TaxInfoTab tutors={tutors} thisYear={thisYear} taxInfoMap={taxInfoMap} ytdEarningsMap={ytdEarningsMap} />
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
      ['Payout ID', 'Tutor Name', 'Tutor Email', 'Tutor Venmo', 'Tutor PayPal', 'Tutor Zelle', 'Amount', 'Status', 'Paid At', 'Payment Method', 'Reference ID', 'Session Subject', 'Session Date', 'Notes'],
      ...payouts.map(p => [
        p.id,
        p.tutor_name,
        p.tutor_email,
        p.venmo ?? '',
        p.paypal ?? '',
        p.zelle ?? '',
        p.amount.toFixed(2),
        p.status,
        p.paid_at ? new Date(p.paid_at).toLocaleString() : '',
        p.paid_via ?? '',
        p.reference_id ?? '',
        p.session_subject,
        p.session_date ? new Date(p.session_date).toLocaleString() : '',
        p.notes ?? '',
      ]),
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
interface PendingTutor {
  id: string
  name: string
  email: string
  venmo: string | null
  paypal: string | null
  zelle: string | null
  payment_handle: string
  pendingPayouts: Payout[]
  amount: number
}

function PendingTab({ pendingPayouts }: { pendingPayouts: Payout[] }) {
  const [rows, setRows] = useState<Payout[]>(pendingPayouts)
  const [openForm, setOpenForm] = useState<string | null>(null)
  const [done, setDone] = useState<Record<string, boolean>>({})

  // Group the pending payouts by tutor.
  const pendingByTutor: PendingTutor[] = useMemo(() => {
    const map = new Map<string, PendingTutor>()
    for (const p of rows) {
      const existing = map.get(p.tutor_id)
      if (existing) {
        existing.pendingPayouts.push(p)
        existing.amount += p.amount
      } else {
        map.set(p.tutor_id, {
          id: p.tutor_id,
          name: p.tutor_name,
          email: p.tutor_email,
          venmo: p.venmo,
          paypal: p.paypal,
          zelle: p.zelle,
          payment_handle: p.payment_handle,
          pendingPayouts: [p],
          amount: p.amount,
        })
      }
    }
    return Array.from(map.values())
  }, [rows])

  if (pendingByTutor.length === 0) {
    return <div className="card" style={{ padding: '3rem', textAlign: 'center', color: MUTED }}>No pending payouts 🎉</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {pendingByTutor.map((tutor) => (
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
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: GREEN, lineHeight: 1 }}>${tutor.amount.toFixed(2)}</p>
              <p style={{ fontSize: '0.75rem', color: MUTED, marginTop: '0.25rem' }}>{tutor.pendingPayouts.length} session{tutor.pendingPayouts.length !== 1 ? 's' : ''}</p>
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
              pendingPayouts={tutor.pendingPayouts}
              onCancel={() => setOpenForm(null)}
              onPaid={(ids) => {
                setRows(prev => prev.filter(p => !ids.includes(p.id)))
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
  tutor: PendingTutor; pendingPayouts: Payout[]; onCancel: () => void; onPaid: (ids: string[]) => void
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

// ============ Tab 4: Tax Info ============
function TaxInfoTab({ tutors, thisYear, taxInfoMap, ytdEarningsMap }: {
  tutors: Tutor[]; thisYear: number; taxInfoMap: Record<string, TaxInfo>; ytdEarningsMap: Record<string, number>
}) {
  // Local, editable copy of tax info keyed by tutor_id.
  const [taxInfo, setTaxInfo] = useState<Record<string, TaxInfo>>(taxInfoMap)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const ytd = (id: string) => ytdEarningsMap[id] ?? 0

  // All approved tutors, highest YTD earners first.
  const rows = useMemo(
    () => tutors.filter(t => t.status === 'approved').sort((a, b) => ytd(b.id) - ytd(a.id)),
    [tutors, ytdEarningsMap] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const needsCount = rows.filter(t => ytd(t.id) >= 600).length

  const isCollected = (t: Tutor) => taxInfo[t.id]?.w9_collected ?? t.w9_collected

  async function toggleW9(tutor: Tutor) {
    if (busy) return
    setBusy(tutor.id)
    const next = !isCollected(tutor)
    try {
      const res = await fetch('/api/admin/update-tax-info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId: tutor.id, w9_collected: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setTaxInfo(prev => ({ ...prev, [tutor.id]: { ...(prev[tutor.id] ?? { tutor_id: tutor.id } as TaxInfo), ...data.taxInfo } }))
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setBusy(null)
    }
  }

  function exportTaxCsv() {
    const rowsCsv: (string | number)[][] = [
      ['Legal Name', 'Business Name', 'Entity Type', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Total Earned YTD', 'W9 Collected', 'W9 Date', 'Venmo', 'PayPal', 'Zelle', 'Notes'],
      ...rows.map(t => {
        const info = taxInfo[t.id]
        const address = [info?.address_line1, info?.address_line2].filter(Boolean).join(', ')
        return [
          info?.legal_name || t.name,
          info?.business_name ?? '',
          entityLabel(info?.tax_entity_type),
          info?.email || t.email,
          info?.phone ?? '',
          address,
          info?.city ?? '',
          info?.state ?? '',
          info?.zip ?? '',
          ytd(t.id).toFixed(2),
          isCollected(t) ? 'Yes' : 'No',
          info?.w9_collected_date ? new Date(info.w9_collected_date).toLocaleDateString() : '',
          t.venmo ?? '',
          t.paypal ?? '',
          t.zelle ?? '',
          info?.notes ?? '',
        ]
      }),
    ]
    downloadCsv(`aceforge-tax-data-${thisYear}.csv`, rowsCsv)
  }

  // Threshold tiering by YTD earnings.
  const tierColor = (amt: number) => amt >= 600 ? 'rgb(163,45,45)' : amt >= 400 ? 'rgb(180,99,5)' : GREEN
  const tierBarBg = (amt: number) => amt >= 600 ? 'rgb(163,45,45)' : amt >= 400 ? 'rgb(217,119,6)' : GREEN
  const tierLabel = (amt: number) =>
    amt >= 600 ? '🚨 1099 Required — W-9 needed'
      : amt >= 400 ? '⚠️ Approaching $600 — collect W-9 soon'
        : 'Under threshold'

  return (
    <div>
      {/* Summary banner */}
      <div style={{ padding: '1.25rem 1.5rem', borderRadius: '0.875rem', background: needsCount > 0 ? 'rgba(163,45,45,0.06)' : 'rgba(34,85,14,0.05)', border: `1px solid ${needsCount > 0 ? 'rgba(163,45,45,0.18)' : 'rgba(34,85,14,0.15)'}`, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: needsCount > 0 ? 'rgb(163,45,45)' : GREEN }}>
            {needsCount} tutor{needsCount !== 1 ? 's' : ''} require 1099 filing this year
          </p>
          <p style={{ fontSize: '0.8125rem', color: MUTED, marginTop: '0.25rem' }}>
            Tutors earning <strong>$600+</strong> in {thisYear} need a 1099-NEC. Collect their W-9 and tax info below.
          </p>
        </div>
        <button onClick={exportTaxCsv}
          style={{ padding: '0.625rem 1.25rem', borderRadius: '0.625rem', background: GREEN, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ⬇️ Export Tax Data CSV
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: MUTED }}>No approved tutors yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {rows.map(t => {
            const amt = ytd(t.id)
            const collected = isCollected(t)
            const pct = Math.min(100, (amt / 600) * 100)
            const open = expanded === t.id
            return (
              <div key={t.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '9999px', background: tierBarBg(amt), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.125rem', fontFamily: 'Syne, sans-serif', flexShrink: 0 }}>
                    {(t.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: INK }}>{t.name}</p>
                    <p style={{ fontSize: '0.8125rem', color: MUTED }}>{t.email || 'No email'}</p>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <p style={{ fontSize: '0.6875rem', color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earned YTD {thisYear}</p>
                    <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: tierColor(amt), lineHeight: 1.1 }}>${amt.toFixed(2)}</p>
                  </div>
                </div>

                {/* Progress bar toward $600 */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ height: '0.625rem', borderRadius: '9999px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: tierBarBg(amt), borderRadius: '9999px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: tierColor(amt) }}>{tierLabel(amt)}</span>
                    <span style={{ fontSize: '0.75rem', color: MUTED }}>${amt.toFixed(0)} / $600</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button onClick={() => toggleW9(t)} disabled={busy === t.id}
                    title={collected ? 'W-9 collected — click to unmark' : 'W-9 not collected — click to mark collected'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.875rem', borderRadius: '0.625rem', background: collected ? 'rgba(34,85,14,0.1)' : 'rgba(107,107,88,0.08)', border: `1px solid ${collected ? 'rgba(34,85,14,0.25)' : 'rgba(107,107,88,0.2)'}`, color: collected ? GREEN : MUTED, fontWeight: 600, fontSize: '0.8125rem', cursor: busy === t.id ? 'wait' : 'pointer' }}>
                    <span style={{ fontSize: '1rem' }}>{busy === t.id ? '…' : collected ? '✅' : '✖️'}</span>
                    W-9 {collected ? 'Collected' : 'Not Collected'}
                  </button>
                  <button onClick={() => setExpanded(open ? null : t.id)}
                    style={{ padding: '0.45rem 0.875rem', borderRadius: '0.625rem', background: open ? INK : 'transparent', border: `1px solid ${open ? INK : 'rgba(34,85,14,0.25)'}`, color: open ? 'white' : INK, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                    {open ? '▲ Close' : '📝 View/Edit Tax Info'}
                  </button>
                </div>

                {open && (
                  <TaxInfoForm
                    tutor={t}
                    thisYear={thisYear}
                    ytd={amt}
                    info={taxInfo[t.id]}
                    onSaved={(saved) => {
                      setTaxInfo(prev => ({ ...prev, [t.id]: saved }))
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---- Inline tax info form (Sub-section B) ----
function TaxInfoForm({ tutor, thisYear, ytd, info, onSaved }: {
  tutor: Tutor; thisYear: number; ytd: number; info: TaxInfo | undefined; onSaved: (saved: TaxInfo) => void
}) {
  const [form, setForm] = useState({
    legal_name: info?.legal_name ?? tutor.name ?? '',
    email: info?.email ?? tutor.email ?? '',
    phone: info?.phone ?? '',
    address_line1: info?.address_line1 ?? '',
    address_line2: info?.address_line2 ?? '',
    city: info?.city ?? '',
    state: info?.state ?? '',
    zip: info?.zip ?? '',
    country: info?.country ?? 'US',
    business_name: info?.business_name ?? '',
    tax_entity_type: info?.tax_entity_type ?? 'individual',
    w9_collected: info?.w9_collected ?? tutor.w9_collected ?? false,
    w9_collected_date: info?.w9_collected_date ? info.w9_collected_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    notes: info?.notes ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const set = (k: keyof typeof form, v: any) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  async function save() {
    if (busy) return
    if (!form.legal_name.trim()) { setError('Legal name is required'); return }
    if (!form.email.trim()) { setError('Email is required'); return }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/update-tax-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutor.id,
          ...form,
          w9_collected_date: form.w9_collected ? new Date(form.w9_collected_date).toISOString() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setSaved(true)
      onSaved(data.taxInfo)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(34,85,14,0.12)' }}>
      {/* Read-only cross-reference from tutor profile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.875rem 1rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.04)' }}>
        {[
          { l: 'Venmo', v: tutor.venmo || '—' },
          { l: 'PayPal', v: tutor.paypal || '—' },
          { l: 'Zelle', v: tutor.zelle || '—' },
          { l: 'Sessions', v: String(tutor.session_count) },
          { l: 'Earned all time', v: `$${tutor.total_paid.toFixed(2)}` },
          { l: `Earned ${thisYear}`, v: `$${ytd.toFixed(2)}` },
        ].map(x => (
          <div key={x.l}>
            <div style={{ fontSize: '0.625rem', color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{x.l}</div>
            <div style={{ fontSize: '0.875rem', color: INK, fontWeight: 600, marginTop: '0.15rem', wordBreak: 'break-word' }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Editable tax form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '0.875rem' }}>
        <div>
          <label style={lbl}>Legal Name (as on tax return) *</label>
          <input value={form.legal_name} onChange={e => set('legal_name', e.target.value)} style={input} />
        </div>
        <div>
          <label style={lbl}>Email *</label>
          <input value={form.email} onChange={e => set('email', e.target.value)} style={input} />
        </div>
        <div>
          <label style={lbl}>Phone</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} style={input} />
        </div>
        <div>
          <label style={lbl}>Address Line 1</label>
          <input value={form.address_line1} onChange={e => set('address_line1', e.target.value)} style={input} />
        </div>
        <div>
          <label style={lbl}>Address Line 2</label>
          <input value={form.address_line2} onChange={e => set('address_line2', e.target.value)} style={input} />
        </div>
        <div>
          <label style={lbl}>City</label>
          <input value={form.city} onChange={e => set('city', e.target.value)} style={input} />
        </div>
        <div>
          <label style={lbl}>State</label>
          <select value={form.state} onChange={e => set('state', e.target.value)} style={input}>
            <option value="">Select…</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>ZIP Code</label>
          <input value={form.zip} onChange={e => set('zip', e.target.value)} style={input} />
        </div>
        <div>
          <label style={lbl}>Country</label>
          <input value={form.country} onChange={e => set('country', e.target.value)} style={input} />
        </div>
        <div>
          <label style={lbl}>Business Name (optional)</label>
          <input value={form.business_name} onChange={e => set('business_name', e.target.value)} style={input} />
        </div>
        <div>
          <label style={lbl}>Entity Type</label>
          <select value={form.tax_entity_type} onChange={e => set('tax_entity_type', e.target.value)} style={input}>
            {ENTITY_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <label style={lbl}>W-9 Collected</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '2.4rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: INK, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.w9_collected} onChange={e => set('w9_collected', e.target.checked)} style={{ width: '1.1rem', height: '1.1rem' }} />
              Collected
            </label>
            {form.w9_collected && (
              <input type="date" value={form.w9_collected_date} onChange={e => set('w9_collected_date', e.target.value)} style={{ ...input, width: 'auto', flex: 1 }} />
            )}
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...input, resize: 'vertical' }} placeholder="Any additional tax notes…" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
        <button onClick={save} disabled={busy}
          style={{ padding: '0.625rem 1.25rem', borderRadius: '0.625rem', background: GREEN, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Saving…' : '💾 Save Tax Info'}
        </button>
        {saved && <span style={{ color: GREEN, fontWeight: 600, fontSize: '0.875rem' }}>✅ Saved</span>}
        {error && <span style={{ color: 'rgb(163,45,45)', fontSize: '0.8125rem' }}>{error}</span>}
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
