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
  const [tab, setTab] = useState<'overview' | 'support' | 'tutors' | 'users'>('overview')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [liveTickets, setLiveTickets] = useState(tickets)
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
        setLiveTickets((prev: any[]) => prev)
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
    loadMessages(selectedTicket.id)
    const interval = setInterval(() => loadMessages(selectedTicket.id), 3000)
    return () => clearInterval(interval)
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

  const STAT_CARDS = [
    { label: 'Total Users', value: stats.totalUsers, emoji: '👥', color: 'rgb(37,99,235)', bg: 'rgba(37,99,235,0.06)' },
    { label: 'Active Today', value: stats.activeToday, emoji: '🟢', color: 'rgb(34,85,14)', bg: 'rgba(34,85,14,0.06)' },
    { label: 'Premium Users', value: stats.premiumUsers, emoji: '⚡', color: 'rgb(217,119,6)', bg: 'rgba(217,119,6,0.06)' },
    { label: 'Total Sessions', value: stats.totalSessions, emoji: '📚', color: 'rgb(34,85,14)', bg: 'rgba(34,85,14,0.06)' },
    { label: 'Questions Generated', value: stats.totalQuestions, emoji: '❓', color: 'rgb(107,107,88)', bg: 'rgba(107,107,88,0.06)' },
    { label: 'Worksheets Generated', value: stats.totalWorksheets, emoji: '📄', color: 'rgb(107,107,88)', bg: 'rgba(107,107,88,0.06)' },
    { label: 'Tutoring Sessions', value: stats.totalTutoringSessions, emoji: '🎓', color: 'rgb(180,120,10)', bg: 'rgba(180,120,10,0.06)' },
    { label: 'Pending Tutor Apps', value: stats.pendingTutors, emoji: '⏳', color: 'rgb(163,45,45)', bg: 'rgba(163,45,45,0.06)' },
    { label: 'Open Support Tickets', value: stats.openTickets, emoji: '🎧', color: 'rgb(163,45,45)', bg: 'rgba(163,45,45,0.06)' },
  ]

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'support', label: `🎧 Support ${stats.openTickets > 0 ? `(${stats.openTickets})` : ''}` },
    { id: 'tutors', label: `🎓 Tutor Apps ${stats.pendingTutors > 0 ? `(${stats.pendingTutors})` : ''}` },
    { id: 'users', label: '👥 Users' },
  ] as const

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem', background: 'rgb(250,250,247)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.25rem' }}>Admin Dashboard</h1>
          <p style={{ color: 'rgb(107,107,88)' }}>Welcome back, {profile?.display_name?.split(' ')[0]}.</p>
        </div>

        <div style={{ display: 'flex', gap: '0', marginBottom: '2rem', borderBottom: '2px solid rgba(34,85,14,0.08)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.9375rem', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'rgb(26,26,20)' : 'rgb(107,107,88)', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: tab === t.id ? '2px solid rgb(26,26,20)' : '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {STAT_CARDS.map((s, i) => (
                <div key={s.label} className="card" style={{ padding: '1.5rem', textAlign: 'center', background: s.bg, border: `1px solid ${s.color}22`, animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both`, transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${s.color}22` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{s.emoji}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, color: s.color, marginBottom: '0.375rem', lineHeight: 1 }}>
                    <AnimatedNumber value={s.value} duration={800 + i * 50} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgb(107,107,88)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '1rem' }}>
              {stats.pendingTutors > 0 && (
                <Link href="/admin/tutors" style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '1.25rem', border: '2px solid rgba(163,45,45,0.25)', background: 'rgba(163,45,45,0.03)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>⏳</span>
                      <div>
                        <p style={{ fontWeight: 700, color: 'rgb(163,45,45)' }}>{stats.pendingTutors} tutor application{stats.pendingTutors > 1 ? 's' : ''} waiting</p>
                        <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)' }}>Click to review →</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              {stats.openTickets > 0 && (
                <button onClick={() => setTab('support')} style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}>
                  <div className="card" style={{ padding: '1.25rem', border: '2px solid rgba(163,45,45,0.25)', background: 'rgba(163,45,45,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>🎧</span>
                      <div>
                        <p style={{ fontWeight: 700, color: 'rgb(163,45,45)' }}>{stats.openTickets} open support ticket{stats.openTickets > 1 ? 's' : ''}</p>
                        <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)' }}>Click to respond →</p>
                      </div>
                    </div>
                  </div>
                </button>
              )}
              {stats.pendingTutors === 0 && stats.openTickets === 0 && (
                <div className="card" style={{ padding: '1.25rem', border: '1px solid rgba(34,85,14,0.1)', background: 'rgba(34,85,14,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <p style={{ fontWeight: 600, color: 'rgb(34,85,14)' }}>All caught up! Nothing pending.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'support' && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', height: '72vh' }}>
            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid rgba(34,85,14,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(34,85,14,0.08)', background: 'rgba(34,85,14,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: 'rgb(26,26,20)' }}>Support Tickets</p>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgb(34,85,14)' }}>{liveTickets.filter(t => t.status === 'open').length} open</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {liveTickets.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'rgb(107,107,88)', fontSize: '0.875rem' }}>No tickets yet 🎉</div>}
                {liveTickets.map(ticket => (
                  <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                    style={{ width: '100%', padding: '1rem 1.25rem', textAlign: 'left', background: selectedTicket?.id === ticket.id ? 'rgba(34,85,14,0.06)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(34,85,14,0.06)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                        {ticket.profiles?.display_name?.[0] ?? '?'}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgb(26,26,20)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.profiles?.display_name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'rgb(107,107,88)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.subject}</p>
                      </div>
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.15rem 0.375rem', borderRadius: '9999px', background: ticket.status === 'open' ? 'rgba(34,85,14,0.1)' : 'rgba(107,107,88,0.1)', color: ticket.status === 'open' ? 'rgb(34,85,14)' : 'rgb(107,107,88)', flexShrink: 0 }}>
                        {ticket.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.6875rem', color: 'rgba(107,107,88,0.7)', paddingLeft: '2.625rem' }}>{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '1rem', border: '1px solid rgba(34,85,14,0.08)', overflow: 'hidden' }}>
              {!selectedTicket ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'rgb(107,107,88)' }}>
                  <span style={{ fontSize: '3rem' }}>🎧</span>
                  <p>Select a ticket to start helping</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(34,85,14,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(34,85,14,0.02)' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: 'rgb(26,26,20)' }}>{selectedTicket.profiles?.display_name}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)' }}>{selectedTicket.subject} · {selectedTicket.profiles?.email}</p>
                    </div>
                    {selectedTicket.status === 'open' && (
                      <button onClick={() => closeTicket(selectedTicket.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(34,85,14,0.08)', border: '1px solid rgba(34,85,14,0.2)', color: 'rgb(34,85,14)', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                        <CheckCircle style={{ width: '0.875rem', height: '0.875rem' }} /> Close Ticket
                      </button>
                    )}
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.length === 0 && <div style={{ textAlign: 'center', color: 'rgb(107,107,88)', fontSize: '0.875rem', padding: '2rem' }}>No messages yet.</div>}
                    {messages.map((msg, i) => {
                      const isMine = msg.is_admin === true
                      return (
                        <div key={msg.id ?? i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                          {!isMine && <p style={{ fontSize: '0.75rem', color: 'rgb(107,107,88)', marginBottom: '0.25rem', paddingLeft: '0.25rem' }}>{selectedTicket.profiles?.display_name}</p>}
                          {isMine && <p style={{ fontSize: '0.75rem', color: 'rgb(34,85,14)', fontWeight: 700, marginBottom: '0.25rem', paddingRight: '0.25rem' }}>You (Admin)</p>}
                          <div style={{
                            maxWidth: '70%',
                            padding: msg.image_url && !msg.message ? '0.375rem' : '0.75rem 1rem',
                            borderRadius: isMine ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                            background: isMine ? 'rgb(26,26,20)' : 'rgba(34,85,14,0.08)',
                            color: isMine ? 'white' : 'rgb(26,26,20)',
                            overflow: 'hidden',
                          }}>
                            {msg.image_url && (
                              <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                                <img src={msg.image_url} alt="screenshot" style={{ maxWidth: '100%', borderRadius: '0.625rem', display: 'block', maxHeight: '300px', objectFit: 'contain' }} />
                              </a>
                            )}
                            {msg.message && <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginTop: msg.image_url ? '0.5rem' : 0 }}>{msg.message}</p>}
                          </div>
                          <p style={{ fontSize: '0.6875rem', color: 'rgb(107,107,88)', marginTop: '0.25rem' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  {selectedTicket.status === 'open' ? (
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(34,85,14,0.08)' }}>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                          placeholder="Reply to user..." className="input" style={{ flex: 1 }} />
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.06)', border: '1.5px solid rgba(34,85,14,0.2)', cursor: 'pointer', flexShrink: 0 }}>
                          🖼️<input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                        </label>
                        <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="btn-primary" style={{ padding: '0.625rem 1rem', flexShrink: 0 }}>
                          <Send style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                      {uploadingImage && <p style={{ fontSize: '0.75rem', color: 'rgb(107,107,88)', marginTop: '0.5rem' }}>Uploading...</p>}
                    </div>
                  ) : (
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(34,85,14,0.08)', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.875rem', color: 'rgb(107,107,88)' }}>This ticket is closed.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'tutors' && (
          <div>
            {pendingTutorList.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'rgb(107,107,88)' }}>No pending tutor applications 🎉</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingTutorList.map(t => (
                  <div key={t.id} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.25rem' }}>{t.display_name}</p>
                      <p style={{ fontSize: '0.875rem', color: 'rgb(107,107,88)', marginBottom: '0.375rem' }}>{t.profiles?.email}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {t.subjects?.map((s: string) => (
                          <span key={s} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', color: 'rgb(34,85,14)', fontWeight: 600 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <Link href="/admin/tutors" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>Review →</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(34,85,14,0.08)' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'rgb(26,26,20)' }}>Recent Signups</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(34,85,14,0.02)' }}>
                  {['Name', 'Email', 'Plan', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => (
                  <tr key={u.id} style={{ borderTop: '1px solid rgba(34,85,14,0.06)', background: i % 2 === 0 ? 'white' : 'rgba(34,85,14,0.01)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9375rem', fontWeight: 600, color: 'rgb(26,26,20)' }}>{u.display_name ?? '—'}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'rgb(107,107,88)' }}>{u.email}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '9999px', background: u.is_premium ? 'rgba(217,119,6,0.1)' : 'rgba(34,85,14,0.06)', color: u.is_premium ? 'rgb(217,119,6)' : 'rgb(34,85,14)' }}>
                        {u.is_premium ? 'Premium ⚡' : 'Free'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'rgb(107,107,88)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}
