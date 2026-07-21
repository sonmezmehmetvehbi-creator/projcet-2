'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import Link from 'next/link'
import { Send, Paperclip, CheckCircle, Headphones } from 'lucide-react'
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

// ── Dark admin palette ──
const PAGE_BG = 'rgb(18,18,28)'
const CARD_BG = 'rgba(255,255,255,0.04)'
const CARD_BORDER = 'rgba(255,255,255,0.08)'
const TEXT1 = 'white'
const TEXT2 = 'rgba(255,255,255,0.55)'
const GREEN = 'rgb(34,85,14)'
const GREEN_BRIGHT = 'rgb(74,222,128)'
const DANGER = 'rgb(248,113,113)'
const WARNING = 'rgb(251,191,36)'

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

  const [mountedDate, setMountedDate] = useState('')
  useEffect(() => {
    setMountedDate(new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))
  }, [])

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

  // Stats grouped with per-card accent colours.
  const STAT_GROUPS = [
    {
      title: 'Users',
      cards: [
        { label: 'Total Users', value: displayStats.totalUsers, accent: 'rgb(96,165,250)' },
        { label: 'Premium Users', value: displayStats.premiumUsers, accent: 'rgb(251,191,36)' },
        { label: 'Active', value: displayStats.activeToday, accent: GREEN_BRIGHT },
      ],
    },
    {
      title: 'Content',
      cards: [
        { label: 'Questions Generated', value: displayStats.totalQuestions, accent: 'rgb(167,139,250)' },
        { label: 'Worksheets Created', value: displayStats.totalWorksheets, accent: 'rgb(129,140,248)' },
        { label: 'Total Sessions', value: displayStats.totalSessions, accent: 'rgb(34,211,238)' },
      ],
    },
    {
      title: 'Tutoring',
      cards: [
        { label: 'Tutoring Sessions', value: displayStats.totalTutoringSessions, accent: GREEN_BRIGHT },
        { label: 'Pending Applications', value: displayStats.pendingTutors, accent: WARNING, dot: displayStats.pendingTutors > 0 },
        { label: 'Open Tickets', value: displayStats.openTickets, accent: DANGER, dot: displayStats.openTickets > 0 },
      ],
    },
  ]

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 800, color: TEXT2,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem',
  }
  const roleBadgeStyle = (role: string): React.CSSProperties => {
    const map: Record<string, { bg: string; color: string }> = {
      Admin: { bg: 'rgba(167,139,250,0.15)', color: 'rgb(196,181,253)' },
      Tutor: { bg: 'rgba(251,191,36,0.15)', color: WARNING },
      Student: { bg: 'rgba(74,222,128,0.12)', color: GREEN_BRIGHT },
    }
    const c = map[role] ?? map.Student
    return { fontSize: '0.625rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '9999px', background: c.bg, color: c.color }
  }

  const hasAttention = stats.pendingTutors > 0 || stats.openTickets > 0

  return (
    <div className="animate-fade-in" style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem', background: PAGE_BG }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: TEXT1, marginBottom: '0.25rem' }}>Admin Dashboard</h1>
            <p style={{ color: TEXT2, fontSize: '0.875rem' }}>{mountedDate || ' '}</p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <p style={{ ...sectionLabel, marginBottom: 0 }}>Overview</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: TEXT2 }}>{loadingStats ? 'Updating…' : 'Showing:'}</span>
            <select value={timeRange} onChange={e => changeTimeRange(e.target.value)} className="admin-select"
              style={{ padding: '0.4rem 0.75rem', borderRadius: '0.625rem', border: `1px solid ${CARD_BORDER}`, background: 'rgba(255,255,255,0.06)', color: TEXT1, fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', colorScheme: 'dark' }}>
              {Object.entries(RANGE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem', opacity: loadingStats ? 0.5 : 1, transition: 'opacity 0.2s' }} className="admin-stat-groups">
          {STAT_GROUPS.map((group, gi) => (
            <div key={group.title}>
              <p style={sectionLabel}>{group.title}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {group.cards.map((c: any, i) => (
                  <div key={c.label} style={{ position: 'relative', padding: '1rem 1.125rem', background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderLeft: `3px solid ${c.accent}`, borderRadius: '0.875rem', animation: `adminFadeUp 0.4s ease ${(gi * 3 + i) * 0.08}s both` }}>
                    {c.dot && <span className="admin-dot" style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: DANGER }} />}
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: TEXT1, lineHeight: 1 }}>
                      <AnimatedNumber value={c.value} duration={800 + i * 50} />
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: TEXT2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.375rem', lineHeight: 1.3 }}>
                      {c.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Needs attention ── */}
        {hasAttention && (
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={sectionLabel}>Needs Attention</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {stats.pendingTutors > 0 && (
                <Link href="/admin/tutors" style={{ textDecoration: 'none' }}>
                  <div className="admin-pulse" style={{ padding: '1.25rem', borderRadius: '1rem', border: `1px solid rgba(251,191,36,0.4)`, background: 'rgba(251,191,36,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: WARNING }}>{stats.pendingTutors} tutor application{stats.pendingTutors > 1 ? 's' : ''} waiting</p>
                      <p style={{ fontSize: '0.8125rem', color: TEXT2 }}>Needs review</p>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: WARNING, padding: '0.375rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(251,191,36,0.12)', whiteSpace: 'nowrap' }}>Review →</span>
                  </div>
                </Link>
              )}
              {stats.openTickets > 0 && (
                <Link href="/admin/support" style={{ textDecoration: 'none' }}>
                  <div className="admin-pulse" style={{ padding: '1.25rem', borderRadius: '1rem', border: `1px solid rgba(248,113,113,0.4)`, background: 'rgba(248,113,113,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', cursor: 'pointer' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: DANGER }}>{stats.openTickets} support ticket{stats.openTickets > 1 ? 's' : ''} open</p>
                      <p style={{ fontSize: '0.8125rem', color: TEXT2 }}>Awaiting reply</p>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: DANGER, padding: '0.375rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(248,113,113,0.12)', whiteSpace: 'nowrap' }}>View →</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Recent users ── */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={sectionLabel}>Recent Users</p>
          <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: '1rem', overflow: 'hidden' }}>
            {recentUsers.length === 0 ? (
              <p style={{ padding: '1.5rem', textAlign: 'center', color: TEXT2, fontSize: '0.875rem' }}>No users yet.</p>
            ) : (
              <>
                {recentUsers.slice(0, 8).map((u, i) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent', borderTop: i === 0 ? 'none' : `1px solid rgba(255,255,255,0.04)` }}>
                    <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.875rem', fontWeight: 700, flexShrink: 0 }}>
                      {(u.display_name?.[0] ?? u.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: TEXT1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.display_name ?? '—'}</p>
                      <p style={{ fontSize: '0.75rem', color: TEXT2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                    </div>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: u.is_premium ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)', color: u.is_premium ? WARNING : TEXT2, flexShrink: 0 }}>
                      {u.is_premium ? 'Premium' : 'Free'}
                    </span>
                    <span style={{ ...roleBadgeStyle(u.role), flexShrink: 0 }}>{u.role ?? 'Student'}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', flexShrink: 0, minWidth: '5rem', textAlign: 'right' }}>{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
                <Link href="/admin/users" style={{ display: 'block', textAlign: 'center', padding: '0.875rem', fontSize: '0.875rem', fontWeight: 700, color: GREEN_BRIGHT, textDecoration: 'none', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                  View All Users →
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Support chat ── */}
        <div>
          <p style={sectionLabel}>Support Tickets</p>
          <div className="admin-support-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.25rem', height: '30rem' }}>

            {/* ticket list */}
            <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${CARD_BORDER}` }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: TEXT1 }}>Tickets</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {liveTickets.length === 0 ? (
                  <p style={{ padding: '2rem 1rem', textAlign: 'center', color: TEXT2, fontSize: '0.875rem' }}>No tickets.</p>
                ) : liveTickets.map(ticket => {
                  const isSel = selectedTicket?.id === ticket.id
                  const isOpen = ticket.status === 'open'
                  return (
                    <button key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="admin-ticket-row"
                      style={{ width: '100%', padding: '0.875rem 1rem', textAlign: 'left', background: isSel ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', borderBottom: `1px solid rgba(255,255,255,0.05)`, borderLeft: `3px solid ${isSel ? GREEN_BRIGHT : 'transparent'}`, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s', display: 'block' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: TEXT1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ticket.subject}</p>
                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.1rem 0.45rem', borderRadius: '9999px', background: isOpen ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)', color: isOpen ? GREEN_BRIGHT : TEXT2, flexShrink: 0 }}>{ticket.status}</span>
                      </div>
                      <p style={{ fontSize: '0.6875rem', color: TEXT2 }}>{new Date(ticket.created_at).toLocaleDateString()}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* chat area */}
            <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {!selectedTicket ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.875rem', color: TEXT2 }}>
                  <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Headphones style={{ width: '1.5rem', height: '1.5rem', color: GREEN_BRIGHT }} />
                  </div>
                  <p style={{ fontSize: '0.9375rem' }}>Select a ticket to view the conversation</p>
                </div>
              ) : (
                <>
                  {/* header */}
                  <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${CARD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: TEXT1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedTicket.subject}</p>
                      <p style={{ fontSize: '0.75rem', color: TEXT2 }}>{selectedTicket.status === 'open' ? 'Open' : 'Closed'}</p>
                    </div>
                    {selectedTicket.status === 'open' && (
                      <button onClick={() => closeTicket(selectedTicket.id)}
                        style={{ flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, padding: '0.4rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: GREEN_BRIGHT, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle style={{ width: '0.875rem', height: '0.875rem' }} /> Close
                      </button>
                    )}
                  </div>

                  {/* messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', color: TEXT2, fontSize: '0.875rem', padding: '2rem' }}>No messages yet.</div>
                    )}
                    {messages.map((msg, i) => {
                      const isAdmin = msg.is_admin // admin (me) → right, dark bubble
                      return (
                        <div key={msg.id ?? i} className="admin-msg" style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                          {!isAdmin && <p style={{ fontSize: '0.6875rem', color: TEXT2, fontWeight: 700, marginBottom: '0.2rem', paddingLeft: '0.25rem' }}>Student</p>}
                          <div style={{
                            maxWidth: '75%',
                            padding: msg.image_url && !msg.message ? '0.375rem' : '0.625rem 0.875rem',
                            borderRadius: isAdmin ? '0.875rem 0.875rem 0.25rem 0.875rem' : '0.875rem 0.875rem 0.875rem 0.25rem',
                            background: isAdmin ? 'rgba(255,255,255,0.08)' : GREEN,
                            border: isAdmin ? `1px solid ${CARD_BORDER}` : 'none',
                            color: 'white', overflow: 'hidden',
                          }}>
                            {msg.image_url && (
                              <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                                <img src={msg.image_url} alt="attachment" style={{ maxWidth: '100%', borderRadius: '0.5rem', display: 'block', maxHeight: '260px', objectFit: 'contain' }} />
                              </a>
                            )}
                            {msg.message && <p style={{ fontSize: '0.875rem', lineHeight: 1.5, marginTop: msg.image_url ? '0.4rem' : 0 }}>{msg.message}</p>}
                          </div>
                          <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem', padding: '0 0.25rem' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* input */}
                  {selectedTicket.status === 'open' ? (
                    <div style={{ padding: '0.875rem 1rem', borderTop: `1px solid ${CARD_BORDER}` }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.06)', border: `1px solid ${CARD_BORDER}`, cursor: 'pointer', flexShrink: 0 }} title="Attach image">
                          <Paperclip style={{ width: '1rem', height: '1rem', color: TEXT2 }} />
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                        </label>
                        <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                          placeholder="Type a reply..." className="admin-chat-input"
                          style={{ flex: 1, height: '2.5rem', padding: '0 0.875rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.06)', border: `1px solid ${CARD_BORDER}`, color: TEXT1, fontSize: '0.875rem', outline: 'none' }} />
                        <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
                          style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', background: GREEN, border: 'none', color: 'white', cursor: newMessage.trim() ? 'pointer' : 'default', opacity: newMessage.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Send style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                      {uploadingImage && <p style={{ fontSize: '0.75rem', color: TEXT2, marginTop: '0.5rem' }}>Uploading...</p>}
                    </div>
                  ) : (
                    <div style={{ padding: '0.875rem 1rem', borderTop: `1px solid ${CARD_BORDER}`, textAlign: 'center' }}>
                      <p style={{ fontSize: '0.8125rem', color: TEXT2 }}>This ticket is closed.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>
      <style>{`
        @keyframes adminFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes adminMsgIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes adminPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); } 50% { box-shadow: 0 0 0 4px rgba(248,113,113,0.12); } }
        @keyframes adminDot { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        .admin-msg { animation: adminMsgIn 0.3s ease both; }
        .admin-pulse { animation: adminPulse 2.2s ease-in-out infinite; }
        .admin-dot { animation: adminDot 1.5s ease-in-out infinite; }
        .admin-ticket-row:hover { background: rgba(255,255,255,0.04) !important; }
        .admin-select option { background: rgb(24,24,36); color: white; }
        .admin-chat-input::placeholder { color: rgba(255,255,255,0.35); }
        .admin-chat-input:focus { border-color: rgba(74,222,128,0.4) !important; }
        @media (max-width: 900px) { .admin-stat-groups { grid-template-columns: 1fr !important; } }
        @media (max-width: 760px) { .admin-support-grid { grid-template-columns: 1fr !important; height: auto !important; } }
      `}</style>
    </div>
  )
}
