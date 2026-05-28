'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Send, CheckCircle } from 'lucide-react'

interface Props {
  tickets: any[]
  currentUserId: string
}

export default function AdminSupportClient({ tickets: initialTickets, currentUserId }: Props) {
  const [tickets, setTickets] = useState(initialTickets)
  const [filter, setFilter] = useState<'all'|'open'|'closed'>('open')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const filtered = tickets.filter(t => filter === 'all' ? true : t.status === filter)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedTicket) return
    loadMessages(selectedTicket.id)
    const channel = supabase
      .channel(`admin-support-${selectedTicket.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'support_messages', filter:`ticket_id=eq.${selectedTicket.id}` },
        (payload) => setMessages(prev => [...prev, payload.new]))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedTicket])

  async function loadMessages(ticketId: string) {
    const { data } = await supabase
      .from('support_messages')
      .select('*, profiles!support_messages_sender_id_fkey(display_name, is_admin)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    await supabase.from('support_messages').update({ read: true }).eq('ticket_id', ticketId).eq('is_admin', false)
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
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status:'closed' } : t))
    if (selectedTicket?.id === ticketId) setSelectedTicket((prev: any) => ({ ...prev, status:'closed' }))
  }

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'80rem', margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>Support Chat</h1>
            <p style={{ color:'rgb(107,107,88)' }}>{tickets.filter(t => t.status === 'open').length} open tickets</p>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            {(['all','open','closed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'0.5rem 1rem', borderRadius:'0.75rem', border:`1.5px solid ${filter === f ? 'rgb(26,26,20)' : 'rgba(34,85,14,0.2)'}`, background: filter === f ? 'rgb(26,26,20)' : 'white', color: filter === f ? 'white' : 'rgb(107,107,88)', fontWeight: filter === f ? 600 : 400, fontSize:'0.875rem', cursor:'pointer', textTransform:'capitalize' }}>
                {f} ({tickets.filter(t => f === 'all' ? true : t.status === f).length})
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'1.5rem', height:'72vh' }}>
          {/* Ticket list */}
          <div style={{ background:'white', borderRadius:'1rem', border:'1px solid rgba(34,85,14,0.08)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid rgba(34,85,14,0.08)', background:'rgba(34,85,14,0.02)' }}>
              <p style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'0.875rem', color:'rgb(26,26,20)' }}>Tickets</p>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {filtered.length === 0 && <div style={{ padding:'2rem', textAlign:'center', color:'rgb(107,107,88)', fontSize:'0.875rem' }}>No tickets</div>}
              {filtered.map(ticket => (
                <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                  style={{ width:'100%', padding:'1rem 1.25rem', textAlign:'left', background: selectedTicket?.id === ticket.id ? 'rgba(34,85,14,0.06)' : 'transparent', border:'none', borderBottom:'1px solid rgba(34,85,14,0.06)', cursor:'pointer', transition:'all 0.2s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.25rem' }}>
                    <div style={{ width:'2rem', height:'2rem', borderRadius:'50%', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.75rem', fontWeight:700, flexShrink:0 }}>
                      {ticket.profiles?.display_name?.[0] ?? '?'}
                    </div>
                    <div style={{ minWidth:0, flex:1 }}>
                      <p style={{ fontSize:'0.875rem', fontWeight:600, color:'rgb(26,26,20)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ticket.profiles?.display_name}</p>
                      <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ticket.subject}</p>
                    </div>
                    <span style={{ fontSize:'0.625rem', fontWeight:700, padding:'0.15rem 0.375rem', borderRadius:'9999px', background: ticket.status === 'open' ? 'rgba(34,85,14,0.1)' : 'rgba(107,107,88,0.1)', color: ticket.status === 'open' ? 'rgb(34,85,14)' : 'rgb(107,107,88)', flexShrink:0 }}>
                      {ticket.status}
                    </span>
                  </div>
                  <p style={{ fontSize:'0.6875rem', color:'rgba(107,107,88,0.7)', paddingLeft:'2.625rem' }}>{new Date(ticket.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div style={{ display:'flex', flexDirection:'column', background:'white', borderRadius:'1rem', border:'1px solid rgba(34,85,14,0.08)', overflow:'hidden' }}>
            {!selectedTicket ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'1rem', color:'rgb(107,107,88)' }}>
                <span style={{ fontSize:'3rem' }}>💬</span>
                <p>Select a ticket to start chatting</p>
              </div>
            ) : (
              <>
                <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid rgba(34,85,14,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(34,85,14,0.02)' }}>
                  <div>
                    <p style={{ fontWeight:700, color:'rgb(26,26,20)' }}>{selectedTicket.profiles?.display_name}</p>
                    <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>{selectedTicket.subject} · {selectedTicket.profiles?.email}</p>
                  </div>
                  {selectedTicket.status === 'open' && (
                    <button onClick={() => closeTicket(selectedTicket.id)}
                      style={{ display:'flex', alignItems:'center', gap:'0.375rem', padding:'0.5rem 0.875rem', borderRadius:'0.625rem', background:'rgba(34,85,14,0.08)', border:'1px solid rgba(34,85,14,0.2)', color:'rgb(34,85,14)', fontWeight:600, fontSize:'0.8125rem', cursor:'pointer' }}>
                      <CheckCircle style={{ width:'0.875rem', height:'0.875rem' }} /> Close
                    </button>
                  )}
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                  {messages.length === 0 && <div style={{ textAlign:'center', color:'rgb(107,107,88)', fontSize:'0.875rem', padding:'2rem' }}>No messages yet.</div>}
                  {messages.map(msg => (
                    <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems: msg.is_admin ? 'flex-end' : 'flex-start' }}>
                      {!msg.is_admin && <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', marginBottom:'0.25rem', paddingLeft:'0.25rem' }}>{selectedTicket.profiles?.display_name}</p>}
                      <div style={{
                        maxWidth:'70%', padding:'0.75rem 1rem',
                        borderRadius: msg.is_admin ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                        background: msg.is_admin ? 'rgb(26,26,20)' : 'rgba(34,85,14,0.08)',
                        color: msg.is_admin ? 'white' : 'rgb(26,26,20)',
                      }}>
                        <p style={{ fontSize:'0.9375rem', lineHeight:1.6 }}>{msg.message}</p>
                      </div>
                      <p style={{ fontSize:'0.6875rem', color:'rgb(107,107,88)', marginTop:'0.25rem' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {selectedTicket.status === 'open' ? (
                  <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid rgba(34,85,14,0.08)', display:'flex', gap:'0.75rem' }}>
                    <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                      placeholder="Reply to user..." className="input" style={{ flex:1 }} />
                    <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="btn-primary" style={{ padding:'0.625rem 1rem', flexShrink:0 }}>
                      <Send style={{ width:'1rem', height:'1rem' }} />
                    </button>
                  </div>
                ) : (
                  <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid rgba(34,85,14,0.08)', textAlign:'center' }}>
                    <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>Ticket is closed.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
