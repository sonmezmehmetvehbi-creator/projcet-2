'use client'

import { useState, useMemo, useEffect, Fragment } from 'react'
import { ChevronDown } from 'lucide-react'

interface UserRow {
  id: string
  display_name: string | null
  email: string | null
  role: string | null
  is_admin: boolean
  is_premium: boolean
  created_at: string
  xp: number | null
  level: number | null
  tutor_status: string | null
  accountType: 'Admin' | 'Tutor' | 'Student'
  totalSessions: number
  totalTutoringSessions: number
  totalQuestions: number
  totalWorksheets: number
  lastActive: string | null
}

interface Props {
  users: UserRow[]
  currentUserId: string
}

const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'
const GREEN = 'rgb(34,85,14)'
const DANGER = 'rgb(163,45,45)'

const PER_PAGE = 25

const DATE_RANGES = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: '7days', label: 'Last 7 Days' },
  { id: '30days', label: 'Last 30 Days' },
  { id: '3months', label: 'Last 3 Months' },
  { id: 'year', label: 'This Year' },
] as const

type RangeId = typeof DATE_RANGES[number]['id']

const BAN_TYPES = [
  { id: 'tutoring_ban', label: 'Tutoring Ban' },
  { id: 'generation_ban', label: 'Generation Ban' },
  { id: 'support_ban', label: 'Support Ban' },
  { id: 'full_account_ban', label: 'Full Account Ban' },
]
const BAN_DURATIONS = [
  { id: '1', label: '1 Day' },
  { id: '3', label: '3 Days' },
  { id: '7', label: '7 Days' },
  { id: '30', label: '30 Days' },
  { id: 'permanent', label: 'Permanent' },
]
const banLabel = (id: string) => BAN_TYPES.find(b => b.id === id)?.label ?? id

function cutoffFor(range: RangeId): number | null {
  const now = new Date()
  switch (range) {
    case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    case '7days': return now.getTime() - 7 * 86400000
    case '30days': return now.getTime() - 30 * 86400000
    case '3months': { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d.getTime() }
    case 'year': return new Date(now.getFullYear(), 0, 1).getTime()
    default: return null
  }
}

function roleBadgeStyle(type: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    Admin: { bg: 'rgba(147,51,234,0.1)', color: 'rgb(126,34,206)' },
    Tutor: { bg: 'rgba(217,119,6,0.1)', color: 'rgb(180,99,5)' },
    Student: { bg: 'rgba(34,85,14,0.08)', color: GREEN },
  }
  const c = map[type] ?? map.Student
  return { fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: c.bg, color: c.color, whiteSpace: 'nowrap' }
}

const selectStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: '1.5px solid rgba(34,85,14,0.2)',
  background: 'white', color: INK, fontSize: '0.875rem', cursor: 'pointer',
}
const inputStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: '1.5px solid rgba(34,85,14,0.2)',
  background: 'white', color: INK, fontSize: '0.875rem', boxSizing: 'border-box',
}
const th: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '0.75rem 1rem', fontSize: '0.875rem', color: INK, verticalAlign: 'middle' }
const actionCard: React.CSSProperties = { padding: '1rem 1.125rem', borderRadius: '0.875rem', background: 'white', border: '1px solid rgba(34,85,14,0.1)' }
const cardTitle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 800, color: INK, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }
const smallLabel: React.CSSProperties = { fontSize: '0.625rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }

function btnStyle(kind: 'primary' | 'neutral' | 'danger', disabled?: boolean): React.CSSProperties {
  const base: React.CSSProperties = { padding: '0.5rem 1rem', borderRadius: '0.625rem', fontWeight: 600, fontSize: '0.8125rem', cursor: disabled ? 'wait' : 'pointer', whiteSpace: 'nowrap' }
  if (kind === 'primary') return { ...base, background: GREEN, border: 'none', color: 'white' }
  if (kind === 'danger') return { ...base, background: 'rgba(163,45,45,0.08)', border: '1.5px solid rgba(163,45,45,0.3)', color: DANGER }
  return { ...base, background: 'white', border: '1.5px solid rgba(34,85,14,0.2)', color: INK }
}

export default function AdminUsersClient({ users: initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | 'Student' | 'Tutor' | 'Admin'>('All')
  const [planFilter, setPlanFilter] = useState<'All' | 'Free' | 'Premium'>('All')
  const [rangeFilter, setRangeFilter] = useState<RangeId>('all')
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const patchUser = (id: string, partial: Partial<UserRow>) =>
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...partial } : u)))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const cutoff = cutoffFor(rangeFilter)
    return users.filter(u => {
      if (q) {
        const hay = `${u.display_name ?? ''} ${u.email ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (typeFilter !== 'All' && u.accountType !== typeFilter) return false
      if (planFilter === 'Premium' && !u.is_premium) return false
      if (planFilter === 'Free' && u.is_premium) return false
      if (cutoff && new Date(u.created_at).getTime() < cutoff) return false
      return true
    })
  }, [users, search, typeFilter, planFilter, rangeFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, pageCount - 1)
  const pageUsers = filtered.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE)

  const counts = useMemo(() => ({
    shown: filtered.length,
    premium: filtered.filter(u => u.is_premium).length,
    tutors: filtered.filter(u => u.accountType === 'Tutor').length,
    admins: filtered.filter(u => u.accountType === 'Admin').length,
  }), [filtered])

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(0) }
  }

  function exportCsv() {
    const escape = (v: string | number) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const header = ['Name', 'Email', 'Account Type', 'Plan', 'Role', 'XP', 'Level', 'Sessions', 'Tutoring Sessions', 'Questions', 'Worksheets', 'Joined', 'Last Active']
    const rows = filtered.map(u => [
      u.display_name ?? '', u.email ?? '', u.accountType, u.is_premium ? 'Premium' : 'Free',
      u.role ?? '', u.xp ?? 0, u.level ?? 0, u.totalSessions, u.totalTutoringSessions,
      u.totalQuestions, u.totalWorksheets,
      new Date(u.created_at).toLocaleDateString(),
      u.lastActive ? new Date(u.lastActive).toLocaleDateString() : '',
    ])
    const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aceforge-users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fade-in" style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem', background: 'rgb(250,250,247)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, marginBottom: '0.25rem' }}>Users</h1>
            <p style={{ color: MUTED }}>{users.length.toLocaleString()} total accounts</p>
          </div>
          <button onClick={exportCsv}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.625rem', background: GREEN, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ⬇️ Export CSV
          </button>
        </div>

        {/* Search */}
        <input value={search} onChange={e => resetPage(setSearch)(e.target.value)}
          placeholder="Search by name or email…"
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1.5px solid rgba(34,85,14,0.2)', background: 'white', color: INK, fontSize: '0.9375rem', boxSizing: 'border-box', marginBottom: '1rem' }} />

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <select value={typeFilter} onChange={e => resetPage(setTypeFilter)(e.target.value as any)} style={selectStyle}>
            {['All', 'Student', 'Tutor', 'Admin'].map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </select>
          <select value={planFilter} onChange={e => resetPage(setPlanFilter)(e.target.value as any)} style={selectStyle}>
            {['All', 'Free', 'Premium'].map(p => <option key={p} value={p}>{p === 'All' ? 'All Plans' : p}</option>)}
          </select>
          <select value={rangeFilter} onChange={e => resetPage(setRangeFilter)(e.target.value as any)} style={selectStyle}>
            {DATE_RANGES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '0.875rem 1.25rem', borderRadius: '0.75rem', background: 'white', border: '1px solid rgba(34,85,14,0.1)', marginBottom: '1.25rem' }}>
          {[
            { label: 'shown', value: counts.shown, suffix: 'users shown' },
            { label: 'premium', value: counts.premium, suffix: 'premium' },
            { label: 'tutors', value: counts.tutors, suffix: 'tutors' },
            { label: 'admins', value: counts.admins, suffix: 'admins' },
          ].map(s => (
            <div key={s.label} style={{ fontSize: '0.875rem', color: MUTED }}>
              <span style={{ fontWeight: 800, color: INK, fontFamily: 'Syne, sans-serif' }}>{s.value.toLocaleString()}</span> {s.suffix}
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
              <thead>
                <tr style={{ background: 'rgba(34,85,14,0.03)', borderBottom: '1px solid rgba(34,85,14,0.08)' }}>
                  <th style={th}></th>
                  <th style={th}>Name</th>
                  <th style={th}>Email</th>
                  <th style={th}>Role</th>
                  <th style={th}>Plan</th>
                  <th style={th}>XP / Level</th>
                  <th style={th}>Joined</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.length === 0 && (
                  <tr><td style={{ ...td, textAlign: 'center', color: MUTED, padding: '3rem' }} colSpan={8}>No users match your filters.</td></tr>
                )}
                {pageUsers.map(u => {
                  const open = expanded === u.id
                  return (
                    <Fragment key={u.id}>
                      <tr onClick={() => setExpanded(open ? null : u.id)}
                        style={{ borderBottom: open ? 'none' : '1px solid rgba(34,85,14,0.06)', cursor: 'pointer', background: open ? 'rgba(34,85,14,0.02)' : 'transparent' }}>
                        <td style={td}>
                          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.875rem', fontWeight: 700 }}>
                            {(u.display_name?.[0] ?? u.email?.[0] ?? '?').toUpperCase()}
                          </div>
                        </td>
                        <td style={{ ...td, fontWeight: 600 }}>{u.display_name ?? '—'}</td>
                        <td style={{ ...td, color: MUTED }}>{u.email}</td>
                        <td style={td}><span style={roleBadgeStyle(u.accountType)}>{u.accountType}</span></td>
                        <td style={td}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: u.is_premium ? 'rgba(217,119,6,0.1)' : 'rgba(34,85,14,0.06)', color: u.is_premium ? 'rgb(217,119,6)' : GREEN }}>
                            {u.is_premium ? 'Premium' : 'Free'}
                          </span>
                        </td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>{(u.xp ?? 0).toLocaleString()} · Lv {u.level ?? 1}</td>
                        <td style={{ ...td, color: MUTED, whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td style={td}>
                          <ChevronDown style={{ width: '1.125rem', height: '1.125rem', color: MUTED, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </td>
                      </tr>
                      {open && (
                        <tr style={{ borderBottom: '1px solid rgba(34,85,14,0.06)', background: 'rgba(34,85,14,0.02)' }}>
                          <td colSpan={8} style={{ padding: '0 1rem 1.5rem' }}>
                            <UserDetailPanel user={u} onPatch={patchUser} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '0.875rem', color: MUTED }}>
            Showing {filtered.length === 0 ? 0 : safePage * PER_PAGE + 1}–{Math.min((safePage + 1) * PER_PAGE, filtered.length)} of {filtered.length.toLocaleString()}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'white', border: '1.5px solid rgba(34,85,14,0.2)', color: safePage === 0 ? MUTED : INK, fontWeight: 600, fontSize: '0.875rem', cursor: safePage === 0 ? 'default' : 'pointer', opacity: safePage === 0 ? 0.5 : 1 }}>
              ← Previous
            </button>
            <span style={{ fontSize: '0.875rem', color: MUTED, padding: '0 0.5rem' }}>Page {safePage + 1} of {pageCount}</span>
            <button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={safePage >= pageCount - 1}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'white', border: '1.5px solid rgba(34,85,14,0.2)', color: safePage >= pageCount - 1 ? MUTED : INK, fontWeight: 600, fontSize: '0.875rem', cursor: safePage >= pageCount - 1 ? 'default' : 'pointer', opacity: safePage >= pageCount - 1 ? 0.5 : 1 }}>
              Next →
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Expandable per-user detail panel with Account Info / Actions / History tabs.
// ──────────────────────────────────────────────────────────────────────────
function UserDetailPanel({ user, onPatch }: { user: UserRow; onPatch: (id: string, p: Partial<UserRow>) => void }) {
  const [tab, setTab] = useState<'account' | 'actions' | 'history'>('account')
  const [stripe, setStripe] = useState<any>(null)
  const [stripeLoading, setStripeLoading] = useState(true)
  const [details, setDetails] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(user.is_premium)

  // Action form state
  const [genAmount, setGenAmount] = useState(5)
  const [xpAmount, setXpAmount] = useState(50)
  const [xpSign, setXpSign] = useState<'+' | '-'>('+')
  const [xpReason, setXpReason] = useState('')
  const [banType, setBanType] = useState('tutoring_ban')
  const [banDuration, setBanDuration] = useState('7')
  const [banReason, setBanReason] = useState('')
  const [note, setNote] = useState('')

  // Ticket-conversation modal
  const [viewTicket, setViewTicket] = useState<any>(null)
  const [ticketMessages, setTicketMessages] = useState<any[]>([])
  const [ticketLoading, setTicketLoading] = useState(false)

  async function openTicket(ticket: any) {
    setViewTicket(ticket)
    setTicketMessages([])
    setTicketLoading(true)
    try {
      const res = await fetch(`/api/support/messages?ticketId=${ticket.id}`)
      const data = await res.json()
      setTicketMessages(data.messages ?? [])
    } catch { setTicketMessages([]) }
    setTicketLoading(false)
  }

  useEffect(() => { loadStripe(); loadDetails() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadStripe() {
    setStripeLoading(true)
    try {
      const res = await fetch(`/api/admin/user-stripe?userId=${user.id}`)
      setStripe(await res.json())
    } catch { setStripe({ error: true }) }
    setStripeLoading(false)
  }
  async function loadDetails() {
    setDetailsLoading(true)
    try {
      const res = await fetch(`/api/admin/user-details?userId=${user.id}`)
      setDetails(await res.json())
    } catch { setDetails({ bans: [], notes: [], tickets: [], disputes: [], generations: [] }) }
    setDetailsLoading(false)
  }

  async function runAction(action: string, extra: any = {}, key = action): Promise<any | null> {
    if (busy) return null
    setBusy(key)
    try {
      const res = await fetch('/api/admin/user-actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      return data
    } catch (e: any) {
      alert('Error: ' + e.message)
      return null
    } finally { setBusy(null) }
  }

  const profile = details?.profile
  const bans: any[] = details?.bans ?? []
  const notes: any[] = details?.notes ?? []
  const tickets: any[] = details?.tickets ?? []
  const disputes: any[] = details?.disputes ?? []
  const sessions: any[] = details?.sessions ?? []
  const generations: any[] = details?.generations ?? []

  const TABS = [
    { id: 'account', label: 'Account Info' },
    { id: 'actions', label: 'Actions' },
    { id: 'history', label: 'History' },
  ] as const

  return (
    <div style={{ borderRadius: '0.875rem', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(34,85,14,0.1)', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(34,85,14,0.1)', background: 'white' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? INK : MUTED, background: 'transparent', border: 'none', borderBottom: tab === t.id ? `2px solid ${GREEN}` : '2px solid transparent', marginBottom: '-1px', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.25rem' }}>

        {/* ── TAB 1: ACCOUNT INFO ── */}
        {tab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Full name', value: user.display_name ?? '—' },
                { label: 'Email', value: user.email ?? '—' },
                { label: 'Role', value: user.accountType },
                { label: 'Plan', value: isPremium ? 'Premium' : 'Free' },
                { label: 'XP', value: (user.xp ?? 0).toLocaleString() },
                { label: 'Level', value: String(user.level ?? 1) },
                { label: 'Streak', value: profile ? `${profile.streak_count ?? 0} days` : '…' },
                { label: 'Joined', value: new Date(user.created_at).toLocaleDateString() },
                { label: 'Last active', value: user.lastActive ? new Date(user.lastActive).toLocaleDateString() : '—' },
              ].map(item => (
                <div key={item.label} style={{ padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'white', border: '1px solid rgba(34,85,14,0.08)' }}>
                  <p style={smallLabel}>{item.label}</p>
                  <p style={{ fontSize: '0.875rem', color: INK, fontWeight: 600, wordBreak: 'break-word' }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Stripe subscription */}
            <div style={actionCard}>
              <p style={cardTitle}>Stripe Subscription</p>
              {stripeLoading ? (
                <p style={{ fontSize: '0.875rem', color: MUTED }}>Loading subscription…</p>
              ) : !stripe || stripe.noSubscription || stripe.error ? (
                <p style={{ fontSize: '0.875rem', color: MUTED }}>
                  No active subscription
                  {stripe?.stripeCustomerUrl && (
                    <> · <a href={stripe.stripeCustomerUrl} target="_blank" rel="noopener noreferrer" style={{ color: GREEN, fontWeight: 600 }}>View in Stripe →</a></>
                  )}
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '0.75rem' }}>
                  {[
                    { label: 'Status', value: stripe.subscriptionStatus ?? '—' },
                    { label: 'Next billing', value: stripe.currentPeriodEnd ? new Date(stripe.currentPeriodEnd).toLocaleDateString() : '—' },
                    { label: 'Amount', value: stripe.amount != null ? `$${stripe.amount.toFixed(2)}` : '—' },
                    { label: 'Cancels at period end', value: stripe.cancelAtPeriodEnd ? 'Yes' : 'No' },
                  ].map(item => (
                    <div key={item.label}>
                      <p style={smallLabel}>{item.label}</p>
                      <p style={{ fontSize: '0.875rem', color: INK, fontWeight: 600 }}>{item.value}</p>
                    </div>
                  ))}
                  {stripe.stripeCustomerUrl && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <a href={stripe.stripeCustomerUrl} target="_blank" rel="noopener noreferrer" style={{ color: GREEN, fontWeight: 600, fontSize: '0.8125rem' }}>View customer in Stripe →</a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active bans */}
            <div style={actionCard}>
              <p style={cardTitle}>Active Bans</p>
              {detailsLoading ? (
                <p style={{ fontSize: '0.875rem', color: MUTED }}>Loading…</p>
              ) : bans.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: MUTED }}>No active bans.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {bans.map(b => (
                    <BanRow key={b.id} ban={b} busy={busy === 'unban-' + b.id}
                      onUnban={async () => { const d = await runAction('unban_user', { banId: b.id }, 'unban-' + b.id); if (d) loadDetails() }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: ACTIONS ── */}
        {tab === 'actions' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1rem' }}>

            {/* Premium */}
            <div style={actionCard}>
              <p style={cardTitle}>Premium</p>
              {isPremium ? (
                <button disabled={busy === 'remove_premium'} style={btnStyle('danger', busy === 'remove_premium')}
                  onClick={async () => { const d = await runAction('remove_premium'); if (d) { setIsPremium(false); onPatch(user.id, { is_premium: false }) } }}>
                  ✕ Remove Premium
                </button>
              ) : (
                <button disabled={busy === 'grant_premium'} style={btnStyle('primary', busy === 'grant_premium')}
                  onClick={async () => { const d = await runAction('grant_premium'); if (d) { setIsPremium(true); onPatch(user.id, { is_premium: true }) } }}>
                  ⚡ Grant Premium
                </button>
              )}
            </div>

            {/* Generations */}
            <div style={actionCard}>
              <p style={cardTitle}>Generations</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <input type="number" min={1} max={50} value={genAmount}
                  onChange={e => setGenAmount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                  style={{ ...inputStyle, width: '5rem' }} />
                <button disabled={busy === 'add_generations'} style={btnStyle('primary', busy === 'add_generations')}
                  onClick={async () => { const d = await runAction('add_generations', { amount: genAmount }); if (d) { loadDetails() } }}>
                  Add Bonus
                </button>
              </div>
              <button disabled={busy === 'reset_daily_usage'} style={btnStyle('neutral', busy === 'reset_daily_usage')}
                onClick={async () => { if (!confirm("Reset today's usage for this user?")) return; await runAction('reset_daily_usage') }}>
                Reset Daily Usage
              </button>
            </div>

            {/* XP & Streak */}
            <div style={actionCard}>
              <p style={cardTitle}>XP &amp; Streak</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button onClick={() => setXpSign(s => (s === '+' ? '-' : '+'))}
                  style={{ ...btnStyle('neutral'), width: '2.5rem', textAlign: 'center', padding: '0.5rem 0' }}>{xpSign}</button>
                <input type="number" min={0} value={xpAmount}
                  onChange={e => setXpAmount(Math.max(0, Number(e.target.value) || 0))}
                  style={{ ...inputStyle, width: '5rem' }} />
                <button disabled={busy === 'adjust_xp'} style={btnStyle('primary', busy === 'adjust_xp')}
                  onClick={async () => {
                    const amount = xpSign === '-' ? -Math.abs(xpAmount) : Math.abs(xpAmount)
                    const d = await runAction('adjust_xp', { amount, reason: xpReason })
                    if (d) { onPatch(user.id, { xp: d.xp, level: d.level }); setXpReason('') }
                  }}>
                  Adjust XP
                </button>
              </div>
              <input value={xpReason} onChange={e => setXpReason(e.target.value)} placeholder="Reason (optional)"
                style={{ ...inputStyle, width: '100%', marginBottom: '0.625rem' }} />
              <button disabled={busy === 'reset_streak'} style={btnStyle('neutral', busy === 'reset_streak')}
                onClick={async () => { if (!confirm('Reset streak to 0?')) return; await runAction('reset_streak') }}>
                Reset Streak
              </button>
            </div>

            {/* Email */}
            <div style={actionCard}>
              <p style={cardTitle}>Email</p>
              <button disabled={busy === 'send_password_reset'} style={btnStyle('neutral', busy === 'send_password_reset')}
                onClick={async () => { const d = await runAction('send_password_reset'); if (d) alert('Password reset email sent.') }}>
                ✉️ Send Password Reset Email
              </button>
            </div>

            {/* Ban system */}
            <div style={{ ...actionCard, gridColumn: '1 / -1' }}>
              <p style={cardTitle}>Ban System</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
                <select value={banType} onChange={e => setBanType(e.target.value)} style={selectStyle}>
                  {BAN_TYPES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
                <select value={banDuration} onChange={e => setBanDuration(e.target.value)} style={selectStyle}>
                  {BAN_DURATIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
                <input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason (required)"
                  style={{ ...inputStyle, flex: '1 1 200px' }} />
                <button disabled={busy === 'ban_user'} style={btnStyle('danger', busy === 'ban_user')}
                  onClick={async () => {
                    if (!banReason.trim()) { alert('A reason is required.'); return }
                    const d = await runAction('ban_user', { banType, duration: banDuration, reason: banReason })
                    if (d) { setBanReason(''); loadDetails(); if (banType === 'full_account_ban') onPatch(user.id, {}) }
                  }}>
                  🚫 Ban User
                </button>
              </div>
              {bans.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {bans.map(b => (
                    <BanRow key={b.id} ban={b} busy={busy === 'unban-' + b.id}
                      onUnban={async () => { const d = await runAction('unban_user', { banId: b.id }, 'unban-' + b.id); if (d) loadDetails() }} />
                  ))}
                </div>
              )}
            </div>

            {/* Admin notes */}
            <div style={{ ...actionCard, gridColumn: '1 / -1' }}>
              <p style={cardTitle}>Admin Notes</p>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Internal note about this user…"
                style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: '0.625rem' }} />
              <button disabled={busy === 'save_note'} style={btnStyle('primary', busy === 'save_note')}
                onClick={async () => { if (!note.trim()) return; const d = await runAction('save_note', { note }); if (d) { setNote(''); loadDetails() } }}>
                Save Note
              </button>
              {notes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.875rem' }}>
                  {notes.map(n => (
                    <div key={n.id} style={{ padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)' }}>
                      <p style={{ fontSize: '0.875rem', color: INK, lineHeight: 1.5 }}>{n.note}</p>
                      <p style={{ fontSize: '0.6875rem', color: MUTED, marginTop: '0.25rem' }}>{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: HISTORY ── */}
        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {detailsLoading && <p style={{ fontSize: '0.875rem', color: MUTED }}>Loading history…</p>}

            <div style={actionCard}>
              <p style={cardTitle}>Support Tickets</p>
              {tickets.length === 0 ? <p style={{ fontSize: '0.875rem', color: MUTED }}>No support tickets.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tickets.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid rgba(34,85,14,0.06)' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', color: INK, fontWeight: 600 }}>{t.subject}</p>
                        <p style={{ fontSize: '0.75rem', color: MUTED }}>{new Date(t.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: t.status === 'open' ? 'rgba(34,85,14,0.1)' : 'rgba(107,107,88,0.1)', color: t.status === 'open' ? GREEN : MUTED }}>{t.status}</span>
                        <button onClick={() => openTicket(t)} style={btnStyle('neutral')}>View Ticket</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={actionCard}>
              <p style={cardTitle}>Disputes</p>
              {disputes.length === 0 ? <p style={{ fontSize: '0.875rem', color: MUTED }}>No disputes.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {disputes.map(d => {
                    const resolution = d.status === 'refunded'
                      ? 'Resolved — refunded'
                      : d.dispute_resolved_at
                        ? `Resolved${d.dispute_resolved_in_student_favor ? ' (student favor)' : ''}`
                        : 'Open'
                    return (
                      <div key={d.id} style={{ padding: '0.75rem', borderRadius: '0.625rem', background: 'rgba(163,45,45,0.04)', border: '1px solid rgba(163,45,45,0.12)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                          <span style={{ fontSize: '0.875rem', color: INK, fontWeight: 600 }}>{d.subject ?? 'Tutoring session'}</span>
                          <span style={{ fontSize: '0.8125rem', color: MUTED, whiteSpace: 'nowrap' }}>{d.scheduled_at ? new Date(d.scheduled_at).toLocaleDateString() : '—'}</span>
                        </div>
                        {d.dispute_reason && <p style={{ fontSize: '0.8125rem', color: MUTED, lineHeight: 1.5, marginBottom: '0.375rem' }}>{d.dispute_reason}</p>}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: MUTED }}>
                          <span>Status: <strong style={{ color: INK }}>{d.dispute_status ?? '—'}</strong></span>
                          <span>Paid: <strong style={{ color: INK }}>${Number(d.student_price ?? 0).toFixed(2)}</strong></span>
                          <span>Resolution: <strong style={{ color: INK }}>{resolution}</strong></span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={actionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <p style={{ ...cardTitle, margin: 0 }}>Tutoring Sessions</p>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', color: GREEN }}>{sessions.length}</span>
              </div>
              {sessions.length === 0 ? <p style={{ fontSize: '0.875rem', color: MUTED }}>No tutoring sessions.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(34,85,14,0.06)', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', color: INK }}>
                        {s.subject ?? 'Session'} · <span style={{ color: MUTED }}>{s.tutor_profiles?.display_name ?? 'Tutor'}</span>
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: MUTED, whiteSpace: 'nowrap' }}>
                        {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString() : '—'} · {s.status} · ${Number(s.student_price ?? 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={actionCard}>
              <p style={cardTitle}>Recent Generations (last 7 days)</p>
              {generations.length === 0 ? <p style={{ fontSize: '0.875rem', color: MUTED }}>No activity in the last 7 days.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {generations.map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(34,85,14,0.06)' }}>
                      <span style={{ fontSize: '0.875rem', color: INK }}>{new Date(g.date).toLocaleDateString()}</span>
                      <span style={{ fontSize: '0.8125rem', color: MUTED, whiteSpace: 'nowrap' }}>{g.questions ?? 0} questions · {g.worksheets ?? 0} worksheets</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ticket conversation modal */}
      {viewTicket && (
        <div onClick={() => setViewTicket(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '36rem', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(34,85,14,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewTicket.subject}</p>
                <p style={{ fontSize: '0.75rem', color: MUTED }}>{viewTicket.status} · {new Date(viewTicket.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setViewTicket(null)} style={btnStyle('neutral')}>Close</button>
            </div>
            <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ticketLoading ? (
                <p style={{ fontSize: '0.875rem', color: MUTED }}>Loading conversation…</p>
              ) : ticketMessages.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: MUTED }}>No messages in this ticket.</p>
              ) : ticketMessages.map((m, i) => (
                <div key={m.id ?? i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.is_admin ? 'flex-end' : 'flex-start' }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: m.is_admin ? GREEN : MUTED, marginBottom: '0.2rem' }}>{m.is_admin ? 'Admin' : 'User'}</p>
                  <div style={{ maxWidth: '80%', padding: '0.625rem 0.875rem', borderRadius: m.is_admin ? '0.875rem 0.875rem 0.25rem 0.875rem' : '0.875rem 0.875rem 0.875rem 0.25rem', background: m.is_admin ? 'rgb(26,26,20)' : 'rgba(34,85,14,0.08)', color: m.is_admin ? 'white' : INK }}>
                    {m.image_url && <a href={m.image_url} target="_blank" rel="noopener noreferrer"><img src={m.image_url} alt="attachment" style={{ maxWidth: '100%', borderRadius: '0.5rem', display: 'block', marginBottom: m.message ? '0.375rem' : 0 }} /></a>}
                    {m.message && <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{m.message}</p>}
                  </div>
                  <p style={{ fontSize: '0.625rem', color: MUTED, marginTop: '0.2rem' }}>{new Date(m.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BanRow({ ban, busy, onUnban }: { ban: any; busy: boolean; onUnban: () => void }) {
  const expiry = ban.is_permanent || !ban.expires_at ? 'Permanent' : `Until ${new Date(ban.expires_at).toLocaleDateString()}`
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(163,45,45,0.05)', border: '1px solid rgba(163,45,45,0.15)', flexWrap: 'wrap' }}>
      <div>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: DANGER }}>{banLabel(ban.ban_type)} · {expiry}</p>
        <p style={{ fontSize: '0.8125rem', color: MUTED }}>{ban.reason}</p>
      </div>
      <button disabled={busy} onClick={onUnban} style={btnStyle('neutral', busy)}>{busy ? '…' : 'Unban'}</button>
    </div>
  )
}
