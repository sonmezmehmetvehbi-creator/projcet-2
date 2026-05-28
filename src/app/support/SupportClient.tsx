'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Send, Plus, AlertCircle } from 'lucide-react'

interface Props {
  profile: any
  tickets: any[]
}

const ISSUE_CATEGORIES = [
  'Billing & Subscription',
  'Technical Issue',
  'Account Problem',
  'Tutoring Issue',
  'Content / Question Quality',
  'Feature Request',
  'Other',
]

export default function SupportClient({ profile, tickets: initialTickets }: Props) {
  const [tickets, setTickets] = useState(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('')
  const [firstMessage, setFirstMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedTicket) return
    loadMessages(selectedTicket.id)
    const channel = supabase
      .channel(`support-${selectedTicket.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'support_messages',
        filter: `ticket_id=eq.${selectedTicket.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
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
  }

  async function createTicket() {
    if (!category) { setError('Please select a category.'); return }
    if (!subject.trim()) { setError('Please enter a subject.'); return }
    if (!firstMessage.trim()) { setError('Please describe your issue.'); return }
    setCreating(true)
    setError('')
    try {
      const fullSubject = `[${category}] ${subject.trim()}`
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({ user_id: profile.id, subject: fullSubject, status: 'open' })
        .select()
        .single()

      if (ticketError) throw ticketError

      const { error: msgError } = await supabase.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_id: profile.id,
        message: firstMessage.trim(),
        is_admin: false,
      })

      if (msgError) throw msgError

      setTickets(prev => [ticket, ...prev])
      setSelectedTicket(ticket)
      setShowNewTicket(false)
      setSubject('')
      setCategory('')
      setFirstMessage('')
    } catch (err: any) {
      setError(err.message)
    }
    setCreating(false)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedTicket) return
    setSending(true)
    await supabase.from('support_messages').insert({
      ticket_id: selectedTicket.id,
      sender_id: profile.id,
      message: newMessage.trim(),
      is_admin: false,
    })
    setNewMessage('')
    setSending(false)
  }

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.25rem' }}>
              Help & Support 🎧
            </h1>
            <p style={{ color: 'rgb(107,107,88)' }}>Our team typically replies within a few hours.</p>
          </div>
          <button onClick={() => setShowNewTicket(true)} className="btn-primary">
            <Plus style={{ width: '1rem', height: '1rem' }} /> New Ticket
          </button>
        </div>

        {showNewTicket && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '2px solid rgba(34,85,14,0.2)' }}>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '1rem' }}>
              New Support Ticket
            </h2>
            {error && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />{error}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="label">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="input">
                  <option value="">Select a category...</option>
                  {ISSUE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} className="input"
                  placeholder="Brief summary of your issue..." />
              </div>
              <div>
                <label className="label">Tell us more *</label>
                <textarea value={firstMessage} onChange={e => setFirstMessage(e.target.value)}
                  className="input" rows={4} style={{ resize: 'vertical' }}
                  placeholder="Describe what happened, what you expected, and any relevant details..." />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { setShowNewTicket(false); setError('') }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button onClick={createTicket} disabled={creating} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  {creating ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tickets.length === 0 && !showNewTicket ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎧</div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.75rem' }}>
              How can we help?
            </h2>
            <p style={{ color: 'rgb(107,107,88)', marginBottom: '1.5rem' }}>
              Having an issue or question? Open a ticket and we will get back to you within a few hours.
            </p>
            <button onClick={() => setShowNewTicket(true)} className="btn-primary" style={{ display: 'inline-flex' }}>
              <Plus style={{ width: '1rem', height: '1rem' }} /> Open a Ticket
            </button>
          </div>
        ) : tickets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', height: '65vh' }}>

            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid rgba(34,85,14,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(34,85,14,0.08)', background: 'rgba(34,85,14,0.02)' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: 'rgb(26,26,20)' }}>Your Tickets</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {tickets.map(ticket => (
                  <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                    style={{ width: '100%', padding: '0.875rem 1rem', textAlign: 'left', background: selectedTicket?.id === ticket.id ? 'rgba(34,85,14,0.06)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(34,85,14,0.06)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgb(26,26,20)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {ticket.subject}
                      </p>
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.15rem 0.375rem', borderRadius: '9999px', background: ticket.status === 'open' ? 'rgba(34,85,14,0.1)' : 'rgba(107,107,88,0.1)', color: ticket.status === 'open' ? 'rgb(34,85,14)' : 'rgb(107,107,88)', flexShrink: 0 }}>
                        {ticket.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'rgb(107,107,88)', marginTop: '0.25rem' }}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '1rem', border: '1px solid rgba(34,85,14,0.08)', overflow: 'hidden' }}>
              {!selectedTicket ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: 'rgb(107,107,88)' }}>
                  <span style={{ fontSize: '3rem' }}>💬</span>
                  <p>Select a ticket to view the conversation</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(34,85,14,0.08)', background: 'rgba(34,85,14,0.02)' }}>
                    <p style={{ fontWeight: 700, color: 'rgb(26,26,20)' }}>{selectedTicket.subject}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)' }}>
                      {selectedTicket.status === 'open' ? '🟢 Open — we will reply soon' : '⚫ Closed'}
                    </p>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'rgb(107,107,88)', fontSize: '0.875rem', padding: '2rem' }}>
                        No messages yet.
                      </div>
                    )}
                    {messages.map(msg => (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.is_admin ? 'flex-start' : 'flex-end' }}>
                        {msg.is_admin && (
                          <p style={{ fontSize: '0.75rem', color: 'rgb(34,85,14)', fontWeight: 700, marginBottom: '0.25rem', paddingLeft: '0.25rem' }}>
                            🎧 AceForge Support
                          </p>
                        )}
                        <div style={{
                          maxWidth: '70%', padding: '0.75rem 1rem',
                          borderRadius: msg.is_admin ? '1rem 1rem 1rem 0.25rem' : '1rem 1rem 0.25rem 1rem',
                          background: msg.is_admin ? 'rgba(34,85,14,0.08)' : 'rgb(34,85,14)',
                          color: msg.is_admin ? 'rgb(26,26,20)' : 'white',
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
                        placeholder="Type your message..." className="input" style={{ flex: 1 }} />
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
      </div>
    </div>
  )
}
