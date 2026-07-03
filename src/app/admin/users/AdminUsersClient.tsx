'use client'

import { useState, useMemo, Fragment } from 'react'
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
const th: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '0.75rem 1rem', fontSize: '0.875rem', color: INK, verticalAlign: 'middle' }

export default function AdminUsersClient({ users: initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | 'Student' | 'Tutor' | 'Admin'>('All')
  const [planFilter, setPlanFilter] = useState<'All' | 'Free' | 'Premium'>('All')
  const [rangeFilter, setRangeFilter] = useState<RangeId>('all')
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

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

  // Reset to first page whenever the filters change the result set.
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

  async function updateUser(userId: string, action: 'make_admin' | 'remove_premium') {
    if (busy) return
    setBusy(userId)
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setUsers(prev => prev.map(u => {
        if (u.id !== userId) return u
        if (action === 'make_admin') return { ...u, is_admin: true, accountType: 'Admin' }
        return { ...u, is_premium: false }
      }))
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setBusy(null)
    }
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
                          <td colSpan={8} style={{ padding: '0 1rem 1.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                              {[
                                { label: 'Account created', value: new Date(u.created_at).toLocaleString() },
                                { label: 'Last active', value: u.lastActive ? new Date(u.lastActive).toLocaleDateString() : '—' },
                                { label: 'Questions generated', value: u.totalQuestions.toLocaleString() },
                                { label: 'Worksheets generated', value: u.totalWorksheets.toLocaleString() },
                                { label: 'Total sessions', value: u.totalSessions.toLocaleString() },
                                { label: 'Tutoring (as student)', value: u.totalTutoringSessions.toLocaleString() },
                                { label: 'XP', value: (u.xp ?? 0).toLocaleString() },
                                { label: 'Level', value: String(u.level ?? 1) },
                                ...(u.tutor_status ? [{ label: 'Tutor status', value: u.tutor_status }] : []),
                              ].map(item => (
                                <div key={item.label} style={{ padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'white', border: '1px solid rgba(34,85,14,0.08)' }}>
                                  <p style={{ fontSize: '0.625rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{item.label}</p>
                                  <p style={{ fontSize: '0.875rem', color: INK, fontWeight: 600 }}>{item.value}</p>
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                              {!u.is_admin && (
                                <button onClick={() => updateUser(u.id, 'make_admin')} disabled={busy === u.id}
                                  style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgba(147,51,234,0.1)', border: '1.5px solid rgba(147,51,234,0.3)', color: 'rgb(126,34,206)', fontWeight: 600, fontSize: '0.8125rem', cursor: busy === u.id ? 'wait' : 'pointer' }}>
                                  {busy === u.id ? '…' : '🛡️ Make Admin'}
                                </button>
                              )}
                              {u.is_premium && (
                                <button onClick={() => updateUser(u.id, 'remove_premium')} disabled={busy === u.id}
                                  style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgba(163,45,45,0.08)', border: '1.5px solid rgba(163,45,45,0.3)', color: 'rgb(163,45,45)', fontWeight: 600, fontSize: '0.8125rem', cursor: busy === u.id ? 'wait' : 'pointer' }}>
                                  {busy === u.id ? '…' : '✕ Remove Premium'}
                                </button>
                              )}
                            </div>
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
