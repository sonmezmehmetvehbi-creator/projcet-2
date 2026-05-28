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

export default function AdminDashboardClient({ profile, stats, recentUsers, tickets, pendingTutorList, currentUserId }: Props) {
  const [tab, setTab] = useState<'overview' | 'support' | 'tutors' | 'users'>('overview')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [liveTickets, setLiveTickets] = useState(tickets)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedTicket) return
    loadMessages(selectedTicket.id)

    // Realtime subscription
    const channel = supabase
      .channel(`ticket-${selectedTicket.id}`)
      .on('postgres_changes', {
        event:'INSERT',
        schema:'public',
        table:'support_messages',
        filter:`ticket_id=eq.${selectedTicket.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedTicket])

  async function loadMessages(ticketId: string) {
    const { data } = await supabase
      .from('support_messages')
      .select('*, profiles!support_messages_sender_id_fkey(display_name, avatar_url, is_admin)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])

    // Mark as read
    await supabase.from('support_messages')
      .update({ read: true })
      .eq('ticket_id', ticketId)
      .eq('is_admin', false)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedTicket) return
    setSending(true)
    await supabase.from('support_messages').insert({
      ticket_id: selectedTicket.id,
      sender_id: currentUserId,
      message: newMessage.trim(),
      is_admin: true,
    })
    setNewMessage('')
    setSending(false)
  }

  async function closeTicket(ticketId: string) {
    await supabase.from('support_tickets').update({ status:'closed' }).eq('id', ticketId)
    setLiveTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status:'closed' } : t))
    if (selectedTicket?.id === ticketId) setSelectedTicket(null)
  }

  const STAT_CARDS = [
    { label:'Total Users', value:stats.totalUsers, emoji:'👥', color:'rgb(37,99,235)' },
    { label:'Active Today', value:stats.activeToday, emoji:'🟢', color:'rgb(34,85,14)' },
    { label:'Premium Users', value:stats.premiumUsers, emoji:'⚡', color:'rgb(217,119,6)' },
    { label:'Total Sessions', value:stats.totalSessions, emoji:'📚', color:'rgb(34,85,14)' },
    { label:'Questions Gen', value:stats.totalQuestions, emoji:'❓', color:'rgb(107,107,88)' },
    { label:'Worksheets Gen', value:stats.totalWorksheets, emoji:'📄', color:'rgb(107,107,88)' },
    { label:'Tutoring Sessions', value:stats.totalTutoringSessions, emoji:'🎓', color:'rgb(180,120,10)' },
    { label:'Pending Tutors', value:stats.pendingTutors, emoji:'⏳', color:'rgb(163,45,45)' },
    { label:'Open Tickets', value:stats.openTickets, emoji:'💬', color:'rgb(163,45,45)' },
  ]

  const TABS = [
    { id:'overview', label:'Overview' },
    { id:'support', label:`Support ${stats.openTickets > 0 ? `(${stats.openTickets})` : ''}` },
    { id:'tutors', label:`Tutor Approvals ${stats.pendingTutors > 0 ? `(${stats.pendingTutors})` : ''}` },
    { id:'users', label:'Recent Users' },
  ] as const

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'80rem', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom:'2rem' }}>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
            Admin Dashboard
          </h1>
          <p style={{ color:'rgb(107,107,88)' }}>Welcome back, {profile?.display_name?.split(' ')[0]}. Here is what is happening.</p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0', marginBottom:'2rem', borderBottom:'2px solid rgba(34,85,14,0.08)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding:'0.625rem 1.25rem', fontSize:'0.9375rem', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'rgb(26,26,20)' : 'rgb(107,107,88)', background:'transparent', border:'none', cursor:'pointer', borderBottom: tab === t.id ? '2px solid rgb(26,26,20)' : '2px solid transparent', marginBottom:'-2px', whiteSpace:'nowrap', transition:'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
              {STAT_CARDS.map(s => (
                <div key={s.label} className="card" style={{ padding:'1.25rem', textAlign:'center' }}>
                  <div style={{ fontSize:'1.5rem', marginBottom:'0.375rem' }}>{s.emoji}</div>
                  <div style={{ fontFamily:'Syne, sans-serif', fontSize:'1.75rem', fontWeight:800, color:s.color, marginBottom:'0.25rem' }}>{s.value.toLocaleString()}</div>
                  <div style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'1rem' }}>
              {[
                { href:'/admin/tutors', label:'Review Tutor Applications', emoji:'🎓', count:stats.pendingTutors, urgent: stats.pendingTutors > 0 },
                { href:'/admin/disputes', label:'Review Disputes', emoji:'⚠️', count:0, urgent:false },
              ].map(action => (
                <Link key={action.href} href={action.href} style={{ textDecoration:'none' }}>
                  <div className="card" style={{ padding:'1.25rem', border: action.urgent ? '2px solid rgba(163,45,45,0.3)' : '1px solid rgba(34,85,14,0.08)', background: action.urgent ? 'rgba(163,45,45,0.03)' : 'white', cursor:'pointer', transition:'all 0.2s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <span style={{ fontSize:'1.5rem' }}>{action.emoji}</span>
                      <div>
                        <p style={{ fontWeight:600, color:'rgb(26,26,20)', fontSize:'0.9375rem' }}>{action.label}</p>
                        {action.count > 0 && <p style={{ fontSize:'0.8125rem', color:'rgb(163,45,45)', fontWeight:600 }}>{action.count} pending</p>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SUPPORT CHAT */}
        {tab === 'support' && (
          <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'1.5rem', height:'70vh' }}>

            {/* Ticket list */}
            <div style={{ display:'flex', flexDirection:'column', gap:'0', background:'white', borderRadius:'1rem', border:'1px solid rgba(34,85,14,0.08)', overflow:'hidden' }}>
              <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid rgba(34,85,14,0.08)', background:'rgba(34,85,14,0.02)' }}>
                <p style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'0.875rem', color:'rgb(26,26,20)' }}>Support Tickets</p>
                <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)' }}>{liveTickets.filter(t => t.status === 'open').length} open</p>
              </div>
              <div style={{ flex:1, overflowY:'auto' }}>
                {liveTickets.length === 0 && (
                  <div style={{ padding:'2rem', textAlign:'center', color:'rgb(107,107,88)', fontSize:'0.875rem' }}>
                    No tickets yet 🎉
                  </div>
                )}
                {liveTickets.map(ticket => (
                  <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                    style={{ width:'100%', padding:'1rem 1.25rem', textAlign:'left', background: selectedTicket?.id === ticket.id ? 'rgba(34,85,14,0.06)' : 'transparent', border:'none', borderBottom:'1px solid rgba(34,85,14,0.06)', cursor:'pointer', transition:'all 0.2s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem' }}>
                      <div style={{ width:'1.75rem', height:'1.75rem', borderRadius:'50%', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.75rem', fontWeight:700, flexShrink:0 }}>
                        {ticket.profiles?.display_name?.[0] ?? '?'}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:'0.875rem', fontWeight:600, color:'rgb(26,26,20)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {ticket.profiles?.display_name ?? 'User'}
                        </p>
                        <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {ticket.subject}
                        </p>
                      </div>
                      <span style={{ marginLeft:'auto', fontSize:'0.625rem', fontWeight:700, padding:'0.15rem 0.375rem', borderRadius:'9999px', background: ticket.status === 'open' ? 'rgba(34,85,14,0.1)' : 'rgba(107,107,88,0.1)', color: ticket.status === 'open' ? 'rgb(34,85,14)' : 'rgb(107,107,88)', flexShrink:0 }}>
                        {ticket.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat area */}
            <div style={{ display:'flex', flexDirection:'column', background:'white', borderRadius:'1rem', border:'1px solid rgba(34,85,14,0.08)', overflow:'hidden' }}>
              {!selectedTicket ? (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1rem', color:'rgb(107,107,88)' }}>
                  <span style={{ fontSize:'3rem' }}>💬</span>
                  <p style={{ fontWeight:600 }}>Select a ticket to start chatting</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid rgba(34,85,14,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(34,85,14,0.02)' }}>
                    <div>
                      <p style={{ fontWeight:700, color:'rgb(26,26,20)', fontSize:'0.9375rem' }}>{selectedTicket.profiles?.display_name}</p>
                      <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>{selectedTicket.subject} · {selectedTicket.profiles?.email}</p>
                    </div>
                    {selectedTicket.status === 'open' && (
                      <button onClick={() => closeTicket(selectedTicket.id)}
                        style={{ display:'flex', alignItems:'center', gap:'0.375rem', padding:'0.5rem 0.875rem', borderRadius:'0.625rem', background:'rgba(34,85,14,0.08)', border:'1px solid rgba(34,85,14,0.2)', color:'rgb(34,85,14)', fontWeight:600, fontSize:'0.8125rem', cursor:'pointer' }}>
                        <CheckCircle style={{ width:'0.875rem', height:'0.875rem' }} /> Close Ticket
                      </button>
                    )}
                  </div>

                  {/* Messages */}
                  <div style={{ flex:1, overflowY:'auto', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                    {messages.length === 0 && (
                      <div style={{ textAlign:'center', color:'rgb(107,107,88)', fontSize:'0.875rem', padding:'2rem' }}>
                        No messages yet. Start the conversation!
                      </div>
                    )}
                    {messages.map(msg => (
                      <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems: msg.is_admin ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth:'70%', padding:'0.75rem 1rem', borderRadius: msg.is_admin ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                          background: msg.is_admin ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.06)',
                          color: msg.is_admin ? 'white' : 'rgb(26,26,20)',
                        }}>
                          <p style={{ fontSize:'0.9375rem', lineHeight:1.6 }}>{msg.message}</p>
                        </div>
                        <p style={{ fontSize:'0.6875rem', color:'rgb(107,107,88)', marginTop:'0.25rem', paddingLeft:'0.25rem' }}>
                          {msg.is_admin ? 'Admin' : selectedTicket.profiles?.display_name} · {new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  {selectedTicket.status === 'open' ? (
                    <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid rgba(34,85,14,0.08)', display:'flex', gap:'0.75rem' }}>
                      <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                        placeholder="Type a message..."
                        className="input"
                        style={{ flex:1 }}
                      />
                      <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
                        className="btn-primary" style={{ padding:'0.625rem 1rem', flexShrink:0 }}>
                        <Send style={{ width:'1rem', height:'1rem' }} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid rgba(34,85,14,0.08)', textAlign:'center' }}>
                      <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>This ticket is closed.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* TUTOR APPROVALS */}
        {tab === 'tutors' && (
          <div>
            {pendingTutorList.length === 0 ? (
              <div className="card" style={{ padding:'3rem', textAlign:'center', color:'rgb(107,107,88)' }}>
                No pending tutor applications 🎉
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {pendingTutorList.map(t => (
                  <div key={t.id} className="card" style={{ padding:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
                    <div>
                      <p style={{ fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>{t.display_name}</p>
                      <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'0.375rem' }}>{t.profiles?.email}</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem' }}>
                        {t.subjects?.map((s: string) => (
                          <span key={s} style={{ fontSize:'0.75rem', padding:'0.2rem 0.5rem', borderRadius:'9999px', background:'rgba(34,85,14,0.06)', color:'rgb(34,85,14)', fontWeight:600 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <Link href="/admin/tutors" className="btn-primary" style={{ textDecoration:'none', fontSize:'0.875rem' }}>
                      Review Application →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECENT USERS */}
        {tab === 'users' && (
          <div className="card" style={{ overflow:'hidden' }}>
            <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid rgba(34,85,14,0.08)' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.125rem', fontWeight:700, color:'rgb(26,26,20)' }}>Recent Signups</h2>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'rgba(34,85,14,0.02)' }}>
                  {['Name','Email','Plan','Joined'].map(h => (
                    <th key={h} style={{ padding:'0.875rem 1.5rem', textAlign:'left', fontSize:'0.75rem', fontWeight:700, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => (
                  <tr key={u.id} style={{ borderTop:'1px solid rgba(34,85,14,0.06)', background: i % 2 === 0 ? 'white' : 'rgba(34,85,14,0.01)' }}>
                    <td style={{ padding:'1rem 1.5rem', fontSize:'0.9375rem', fontWeight:600, color:'rgb(26,26,20)' }}>{u.display_name ?? '—'}</td>
                    <td style={{ padding:'1rem 1.5rem', fontSize:'0.875rem', color:'rgb(107,107,88)' }}>{u.email}</td>
                    <td style={{ padding:'1rem 1.5rem' }}>
                      <span style={{ fontSize:'0.75rem', fontWeight:700, padding:'0.2rem 0.625rem', borderRadius:'9999px', background: u.is_premium ? 'rgba(217,119,6,0.1)' : 'rgba(34,85,14,0.06)', color: u.is_premium ? 'rgb(217,119,6)' : 'rgb(34,85,14)' }}>
                        {u.is_premium ? 'Premium ⚡' : 'Free'}
                      </span>
                    </td>
                    <td style={{ padding:'1rem 1.5rem', fontSize:'0.875rem', color:'rgb(107,107,88)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
