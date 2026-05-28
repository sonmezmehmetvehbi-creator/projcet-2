'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Send, CheckCircle } from 'lucide-react'

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
  const [tab, setTab] = useState<'overview' | 'support' | 'tutors' | 'users'>('overview')
  const [statPeriod, setStatPeriod] = useState<'today' | 'week' | 'month' | 'alltime'>('today')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [liveTickets, setLiveTickets] = useState(tickets)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

 useEffect(() => {
    if (!selectedTicket) return
    loadMessages(selectedTicket.id)

    const pollInterval = setInterval(() => {
      loadMessages(selectedTicket.id)
    }, 3000)

    return () => { clearInterval(pollInterval) }
  }, [selectedTicket])

  async function loadMessages(ticketId: string) {
    const res = await fetch(`/api/admin/get-messages?ticketId=${ticketId}`)
    const data = await res.json()
    setMessages(data.messages ?? [])
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedTicket) return
    setSending(true)
    const msg = {
      id: Date.now().toString(),
      ticket_id: selectedTicket.id,
      sender_id: currentUserId,
      message: newMessage.trim(),
      is_admin: true,
      created_at: new Date().toISOString(),
    }
    const { data } = await supabase.from('support_messages').insert(msg).select().single()
    setMessages(prev => [...prev, data ?? msg])
    setNewMessage('')
    setSending(false)
  }

  async function closeTicket(ticketId: string) {
    await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', ticketId)
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
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.25rem' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'rgb(107,107,88)' }}>Welcome back, {profile?.display_name?.split(' ')[0]}.</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '2rem', borderBottom: '2px solid rgba(34,85,14,0.08)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '0.625rem 1.25rem', fontSize: '0.9375rem', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'rgb(26,26,20)' : 'rgb(107,107,88)', background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: tab === t.id ? '2px solid rgb(26,26,20)' : '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            {/* Period selector */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {([
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'alltime', label: 'All Time' },
              ] as const).map(p => (
                <button key={p.id} onClick={() => setStatPeriod(p.id)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '9999px', border: `1.5px solid ${statPeriod === p.id ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.2)'}`, background: statPeriod === p.id ? 'rgb(34,85,14)' : 'white', color: statPeriod === p.id ? 'white' : 'rgb(107,107,88)', fontWeight: statPeriod === p.id ? 600 : 400, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Syne, sans-serif' }}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Stat cards with animation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {STAT_CARDS.map((s, i) => (
                <div key={s.label} className="card" style={{
                  padding: '1.5rem', textAlign: 'center',
                  background: s.bg,
                  border: `1px solid ${s.color}22`,
                  animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
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

            {/* Alert cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '1rem' }}>
              {stats.pendingTutors > 0 && (
                <Link href="/admin/tutors" style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '1.25rem', border: '2px solid rgba(163,45,45,0.25)', background: 'rgba(163,45,45,0.03)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>⏳</span>
                      <div>
                        <p style={{ fontWeight: 700, color: 'rgb(163,45,45)', fontSize: '0.9375rem' }}>
                          {stats.pendingTutors} tutor application{stats.pendingTutors > 1 ? 's' : ''} waiting
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)' }}>Click to review →</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              {stats.openTickets > 0 && (
                <button onClick={() => setTab('support')} style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}>
                  <div className="card" style={{ padding: '1.25rem', border: '2px solid rgba(163,45,45,0.25)', background: 'rgba(163,45,45,0.03)', transition: 'all 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>🎧</span>
                      <div>
                        <p style={{ fontWeight: 700, color: 'rgb(163,45,45)', fontSize: '0.9375rem' }}>
                          {stats.openTickets} open support ticket{stats.openTickets > 1 ? 's' : ''}
                        </p>
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

        {/* SUPPORT */}
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
                    {messages.map(msg => (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.is_admin ? 'flex-end' : 'flex-start' }}>
                        {!msg.is_admin && <p style={{ fontSize: '0.75rem', color: 'rgb(107,107,88)', marginBottom: '0.25rem', paddingLeft: '0.25rem' }}>{selectedTicket.profiles?.display_name}</p>}
                        {msg.is_admin && <p style={{ fontSize: '0.75rem', color: 'rgb(34,85,14)', fontWeight: 700, marginBottom: '0.25rem', paddingRight: '0.25rem' }}>You (Admin)</p>}
                        <div style={{
                          maxWidth: '70%', padding: '0.75rem 1rem',
                          borderRadius: msg.is_admin ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                          background: msg.is_admin ? 'rgb(26,26,20)' : 'rgba(34,85,14,0.08)',
                          color: msg.is_admin ? 'white' : 'rgb(26,26,20)',
                        }}>
                          <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>{msg.message}</p>
                        </div>
                        <p style={{ fontSize: '0.6875rem', color: 'rgb(107,107,88)', marginTop: '0.25rem' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  {selectedTicket.status === 'open' ? (
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(34,85,14,0.08)', display: 'flex', gap: '0.75rem' }}>
                      <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                        placeholder="Reply to user..." className="input" style={{ flex: 1 }} />
                      <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="btn-primary" style={{ padding: '0.625rem 1rem', flexShrink: 0 }}>
                        <Send style={{ width: '1rem', height: '1rem' }} />
                      </button>
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

        {/* TUTOR APPS */}
        {tab === 'tutors' && (
          <div>
            {pendingTutorList.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'rgb(107,107,88)' }}>
                No pending tutor applications 🎉
              </div>
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
                    <Link href="/admin/tutors" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>
                      Review Application →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS */}
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

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
