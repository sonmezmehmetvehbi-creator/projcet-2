'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Send, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  profile: any
  stats: {
    totalUsers: number
    premiumUsers: number
    activeToday: number
    totalSessions: number
    totalWorksheets: number
    totalQuestions: number
    totalTutoringSessions: number
    pendingTutors: number
    openTickets: number
  }
  recentUsers: any[]
  tickets: any[]
  pendingTutorList: any[]
  currentUserId: string
}

const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'
const GREEN = 'rgb(34,85,14)'
const DANGER = 'rgb(163,45,45)'

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, duration])
  return <>{display.toLocaleString()}</>
}

export default function AdminDashboardClient({ profile, stats, recentUsers, tickets, pendingTutorList, currentUserId }: Props) {
  const router = useRouter()
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [liveTickets, setLiveTickets] = useState(tickets)
  // Keep the ticket list in sync when the server refreshes (realtime updates).
  useEffect(() => { setLiveTickets(tickets) }, [tickets])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tutoring_sessions' }, () => {
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tutor_profiles' }, () => {
        router.refresh()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedTicket) return
    const ticketId = selectedTicket.id
    loadMessages(ticketId)
    // Live message updates via Supabase Realtime — replaces the old 3s poll.
    const client = createClient()
    const channel = client
      .channel(`admin-support-messages-${ticketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${ticketId}`,
      }, () => {
        loadMessages(ticketId)
      })
      .subscribe()
    return () => { client.removeChannel(channel) }
  }, [selectedTicket?.id])

  async function loadMessages(ticketId: string) {
    try {
      const res = await fetch(`/api/support/messages?ticketId=${ticketId}`)
      const data = await res.json()
      if (data.messages) {
        setMessages(prev => {
          if (JSON.stringify(prev.map((m: any) => m.id)) === JSON.stringify(data.messages.map((m: any) => m.id))) return prev
          return data.messages
        })
      }
    } catch {}
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedTicket) return
    setSending(true)
    const text = newMessage.trim()
    setNewMessage('')
    await fetch('/api/support/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: selectedTicket.id, message: text }),
    })
    await loadMessages(selectedTicket.id)
    setSending(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedTicket) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/support/upload-image', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        await fetch('/api/support/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: selectedTicket.id, message: '', imageUrl: data.url }),
        })
        await loadMessages(selectedTicket.id)
      }
    } catch {}
    setUploadingImage(false)
    if (e.target) e.target.value = ''
  }

  const [autoDeclining, setAutoDeclining] = useState(false)

  async function runAutoDecline() {
    if (autoDeclining) return
    setAutoDeclining(true)
    try {
      const res = await fetch('/api/cron/auto-decline')
      const data = await res.json()
      if (!res.ok) {
        alert('Auto-decline failed: ' + (data.error ?? 'Unknown error'))
      } else {
        alert(`✅ Auto-declined ${data.autoDeclined} expired session request${data.autoDeclined === 1 ? '' : 's'}.`)
      }
    } catch (e: any) {
      alert('Auto-decline failed: ' + e.message)
    } finally {
      setAutoDeclining(false)
    }
  }

  async function closeTicket(ticketId: string) {
    await fetch('/api/admin/close-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId }),
    })
    setLiveTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t))
    if (selectedTicket?.id === ticketId) setSelectedTicket((prev: any) => ({ ...prev, status: 'closed' }))
  }

  // Time-based stat scaling.
  const [timeRange, setTimeRange] = useState('all')
  const [displayStats, setDisplayStats] = useState(stats)
  const [loadingStats, setLoadingStats] = useState(false)

  // Keep displayed stats in sync when the server refreshes the all-time props.
  useEffect(() => { if (timeRange === 'all') setDisplayStats(stats) }, [stats]) // eslint-disable-line react-hooks/exhaustive-deps

  async function changeTimeRange(range: string) {
    setTimeRange(range)
    setLoadingStats(true)
    try {
      const res = await fetch(`/api/admin/stats?range=${range}`)
      const data = await res.json()
      if (res.ok && data.stats) setDisplayStats(data.stats)
    } catch {}
    setLoadingStats(false)
  }

  const RANGE_LABELS: Record<string, string> = {
    all: 'All Time', today: 'Today', '7days': 'Last 7 Days',
    '30days': 'Last 30 Days', '3months': 'Last 3 Months', year: 'This Year',
  }

  // Stats grouped for the left column.
  const STAT_GROUPS = [
    {
      title: 'Users',
      cards: [
        { label: 'Total Users', value: displayStats.totalUsers },
        { label: 'Premium Users', value: displayStats.premiumUsers },
        { label: 'Active', value: displayStats.activeToday },
      ],
    },
    {
      title: 'Content',
      cards: [
        { label: 'Questions Generated', value: displayStats.totalQuestions },
        { label: 'Worksheets Generated', value: displayStats.totalWorksheets },
        { label: 'Total Sessions', value: displayStats.totalSessions },
      ],
    },
    {
      title: 'Tutoring',
      cards: [
        { label: 'Tutoring Sessions', value: displayStats.totalTutoringSessions },
        { label: 'Pending Tutor Apps', value: displayStats.pendingTutors },
        { label: 'Open Tickets', value: displayStats.openTickets },
      ],
    },
  ]

  // Quick navigation pills to the other admin pages.
  const QUICK_NAV = [
    { label: 'Tutor Applications', href: '/admin/tutors', count: stats.pendingTutors },
    { label: 'Sessions', href: '/admin/sessions', count: 0 },
    { label: 'Payouts', href: '/admin/payouts', count: 0 },
    { label: 'Appeals', href: '/admin/appeals', count: 0 },
    { label: 'Disputes', href: '/admin/disputes', count: 0 },
  ]

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 800, color: MUTED,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem',
  }
  const pill: React.CSSProperties = {
    padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600,
    background: 'white', border: '1.5px solid rgba(34,85,14,0.2)', color: INK,
    textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
  }
  const roleBadgeStyle = (role: string): React.CSSProperties => {
    const map: Record<string, { bg: string; color: string }> = {
      Admin: { bg: 'rgba(147,51,234,0.1)', color: 'rgb(126,34,206)' },
      Tutor: { bg: 'rgba(217,119,6,0.1)', color: 'rgb(180,99,5)' },
      Student: { bg: 'rgba(34,85,14,0.08)', color: GREEN },
    }
    const c = map[role] ?? map.Student
    return { fontSize: '0.625rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '9999px', background: c.bg, color: c.color }
  }

  return (
    <div className="animate-fade-in" style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem', background: 'rgb(250,250,247)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── TOP: header + quick actions ── */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, marginBottom: '0.25rem' }}>
            Welcome back, {profile?.display_name?.split(' ')[0] ?? 'Admin'}
          </h1>
          <p style={{ color: MUTED }}>Here’s what’s happening across AceForge.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {QUICK_NAV.map(item => (
            <Link key={item.href} href={item.href} style={pill}>
              {item.label}
              {item.count > 0 && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.05rem 0.45rem', borderRadius: '9999px', background: 'rgba(163,45,45,0.12)', color: DANGER }}>
                  {item.count}
                </span>
              )}
            </Link>
          ))}
          <button onClick={runAutoDecline} disabled={autoDeclining}
            style={{ ...pill, background: 'rgba(217,119,6,0.1)', border: '1.5px solid rgba(217,119,6,0.3)', color: 'rgb(180,99,5)', cursor: autoDeclining ? 'wait' : 'pointer' }}>
            {autoDeclining ? 'Processing…' : '⏰ Auto-Decline Expired'}
          </button>
        </div>

        {/* ── MIDDLE: stats (left) + attention/users (right) ── */}
        <div className="admin-cols" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: '1.5rem', alignItems: 'start' }}>

          {/* LEFT — grouped stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Time range selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: MUTED, fontWeight: 600 }}>Show:</span>
                <select value={timeRange} onChange={e => changeTimeRange(e.target.value)}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: '0.625rem', border: '1.5px solid rgba(34,85,14,0.2)', background: 'white', color: INK, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                  {Object.entries(RANGE_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </div>
              <span style={{ fontSize: '0.8125rem', color: MUTED }}>
                {loadingStats ? 'Updating…' : `Showing data for: ${RANGE_LABELS[timeRange]}`}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: loadingStats ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            {STAT_GROUPS.map(group => (
              <div key={group.title}>
                <p style={sectionLabel}>{group.title}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {group.cards.map((c, i) => (
                    <div key={c.label} className="card" style={{ padding: '1rem', animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both` }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: INK, lineHeight: 1 }}>
                        <AnimatedNumber value={c.value} duration={800 + i * 50} />
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.375rem', lineHeight: 1.3 }}>
                        {c.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* RIGHT — needs attention + recent signups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Needs attention */}
            <div>
              <p style={sectionLabel}>Needs Attention</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.pendingTutors > 0 && (
                  <Link href="/admin/tutors" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '1.25rem', border: '2px solid rgba(163,45,45,0.25)', background: 'rgba(163,45,45,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', cursor: 'pointer' }}>
                      <div>
                        <p style={{ fontWeight: 700, color: DANGER }}>{stats.pendingTutors} tutor application{stats.pendingTutors > 1 ? 's' : ''} waiting</p>
                        <p style={{ fontSize: '0.8125rem', color: MUTED }}>Needs review</p>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: DANGER, whiteSpace: 'nowrap' }}>Review →</span>
                    </div>
                  </Link>
                )}
                {stats.openTickets > 0 && (
                  <Link href="/admin/support" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '1.25rem', border: '2px solid rgba(163,45,45,0.25)', background: 'rgba(163,45,45,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', cursor: 'pointer' }}>
                      <div>
                        <p style={{ fontWeight: 700, color: DANGER }}>{stats.openTickets} support ticket{stats.openTickets > 1 ? 's' : ''} open</p>
                        <p style={{ fontSize: '0.8125rem', color: MUTED }}>Awaiting reply</p>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: DANGER, whiteSpace: 'nowrap' }}>View →</span>
                    </div>
                  </Link>
                )}
                {stats.pendingTutors === 0 && stats.openTickets === 0 && (
                  <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(34,85,14,0.15)', background: 'rgba(34,85,14,0.04)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <p style={{ fontWeight: 600, color: GREEN }}>All caught up! Nothing pending.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent signups */}
            <div>
              <p style={sectionLabel}>Recent Signups</p>
              <div className="card" style={{ padding: '0.5rem' }}>
                {recentUsers.length === 0 && (
                  <p style={{ padding: '1.5rem', textAlign: 'center', color: MUTED, fontSize: '0.875rem' }}>No users yet.</p>
                )}
                {recentUsers.slice(0, 5).map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.625rem' }}>
                    <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.875rem', fontWeight: 700, flexShrink: 0 }}>
                      {(u.display_name?.[0] ?? u.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.display_name ?? '—'}</p>
                      <p style={{ fontSize: '0.75rem', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '9999px', background: u.is_premium ? 'rgba(217,119,6,0.1)' : 'rgba(34,85,14,0.06)', color: u.is_premium ? 'rgb(217,119,6)' : GREEN }}>
                          {u.is_premium ? 'Premium' : 'Free'}
                        </span>
                        <span style={roleBadgeStyle(u.role)}>{u.role ?? 'Student'}</span>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'rgba(107,107,88,0.8)' }}>{new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 820px) { .admin-cols { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
