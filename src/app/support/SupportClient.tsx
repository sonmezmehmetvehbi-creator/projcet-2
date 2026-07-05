'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { createClient } from '@/lib/supabase'
import { Send, Plus, AlertCircle, Headphones, Paperclip, X } from 'lucide-react'
import { useTutorTheme } from '@/app/tutor/dashboard/TutorThemeContext'

interface Props {
  profile: any
  tickets: any[]
  currentUserId: string
  isTutor?: boolean
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

// Relative timestamps for the ticket list ("2h ago").
function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// Day label for message date separators.
function dayLabel(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}) })
}

export default function SupportClient({ profile, tickets: initialTickets, currentUserId, isTutor = false }: Props) {
  // Tutors get the dark-purple tutor theme; the provider toggle (useTutorTheme)
  // keeps this in sync with the navbar. Students keep the green/light theme.
  const { theme } = useTutorTheme()
  const isDark = isTutor && theme === 'dark'

  const accent = isTutor ? (isDark ? 'rgb(99,102,241)' : 'rgb(234,88,12)') : 'rgb(34,85,14)'
  const text1 = isTutor ? (isDark ? 'white' : 'var(--af-text)') : 'var(--af-text)'
  const text2 = isTutor ? (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,20,0.6)') : 'var(--af-text-muted)'
  const cardBg = isTutor ? (isDark ? 'rgba(255,255,255,0.04)' : 'white') : 'white'
  const cardBorder = isTutor ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(234,88,12,0.12)') : 'rgba(34,85,14,0.08)'
  const panelHeaderBg = isTutor ? (isDark ? 'rgba(99,102,241,0.08)' : 'rgba(234,88,12,0.03)') : 'white'
  const rowBorder = isTutor ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(234,88,12,0.06)') : 'rgba(34,85,14,0.06)'
  const selectedBg = isTutor ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(234,88,12,0.08)') : 'rgba(34,85,14,0.04)'
  const pageBg = isTutor ? 'transparent' : 'rgb(250,250,247)'
  const inputBg = isTutor ? (isDark ? 'rgba(255,255,255,0.05)' : 'white') : undefined
  const inputColor = isTutor ? (isDark ? 'white' : 'var(--af-text)') : undefined
  const inputBorder = isTutor ? (isDark ? '1.5px solid rgba(99,102,241,0.3)' : '1.5px solid rgba(234,88,12,0.25)') : undefined
  const primaryBtnBg = isTutor ? (isDark ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #ea580c, #f97316)') : undefined
  const myMsgBg = isTutor ? (isDark ? 'rgb(99,102,241)' : 'rgb(234,88,12)') : 'rgb(34,85,14)'
  const adminMsgBg = isTutor ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgb(243,244,246)') : 'white'
  const adminMsgColor = isTutor ? (isDark ? 'white' : 'var(--af-text)') : 'var(--af-text)'
  const adminMsgBorder = isTutor ? 'transparent' : 'rgba(34,85,14,0.1)'
  // Inline styles for tutor theme that override the green/light global CSS classes.
  const inputStyle = isTutor ? { background: inputBg, color: inputColor, border: inputBorder } : undefined
  const primaryBtnStyle = isTutor ? { background: primaryBtnBg, border: 'none', color: 'white' } : undefined

  const [tickets, setTickets] = useState(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open')
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('')
  const [firstMessage, setFirstMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

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
      .channel(`support-messages-${ticketId}`)
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

  async function createTicket() {
    if (!category) { setError('Please select a category.'); return }
    if (!subject.trim()) { setError('Please enter a subject.'); return }
    if (!firstMessage.trim()) { setError('Please describe your issue.'); return }
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: `[${category}] ${subject.trim()}`, message: firstMessage.trim() }),
      })
      const data = await res.json()
      if (data.error === 'support_banned') {
        setError('Your access to support has been suspended. Email us directly at contactinfo21342@gmail.com')
        setCreating(false)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Failed to create ticket')
      const ticket = data.ticket
      setTickets(prev => [ticket, ...prev])
      setSelectedTicket(ticket)
      setFilter('open')
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
    const text = newMessage.trim()
    setNewMessage('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
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

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  // ── New ticket modal (shared across empty & list states) ──
  const newTicketModal = showNewTicket && (
    <div className="support-overlay" style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
      onClick={() => { setShowNewTicket(false); setError('') }}>
      <div className="support-modal" onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '32rem', background: cardBg, borderRadius: '1.25rem', border: `1px solid ${cardBorder}`, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: text1 }}>New Support Ticket</h2>
          <button onClick={() => { setShowNewTicket(false); setError('') }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: text2, display: 'flex' }}>
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>
        {error && (
          <div className="alert-error support-shake" style={{ marginBottom: '1rem' }}>
            <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />{error}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label" style={{ color: text2 }}>Category *</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input" style={inputStyle}>
              <option value="">Select a category...</option>
              {ISSUE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label" style={{ color: text2 }}>Subject *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="input" style={inputStyle} placeholder="Brief summary of your issue..." />
          </div>
          <div>
            <label className="label" style={{ color: text2 }}>Description *</label>
            <textarea value={firstMessage} onChange={e => setFirstMessage(e.target.value)} className="input" rows={4} style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Describe what happened and any relevant details..." />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button onClick={() => { setShowNewTicket(false); setError('') }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button onClick={createTicket} disabled={creating} className="btn-primary" style={{ flex: 2, justifyContent: 'center', ...primaryBtnStyle }}>
              {creating ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`animate-fade-in ${isDark ? 'support-tutor-dark' : ''}`} style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '3rem', background: pageBg }}>
      {isDark && <style>{`.support-tutor-dark .input::placeholder { color: ${text2}; opacity: 1; }`}</style>}
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.5rem 1.5rem' }}>

        {tickets.length === 0 ? (
          /* ── Single column: no tickets ── */
          <div style={{ background: cardBg, borderRadius: '1.5rem', border: `1px solid ${cardBorder}`, padding: '4.5rem 2rem', textAlign: 'center', maxWidth: '36rem', margin: '2rem auto' }}>
            <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Headphones style={{ width: '2rem', height: '2rem', color: accent }} />
            </div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: text1, marginBottom: '0.625rem' }}>No tickets yet</h2>
            <p style={{ color: text2, marginBottom: '1.75rem', lineHeight: 1.6 }}>Have a question or running into trouble? Open a ticket and our team will get back to you within a few hours.</p>
            <button onClick={() => setShowNewTicket(true)} className="btn-primary" style={{ display: 'inline-flex', ...primaryBtnStyle }}>
              <Plus style={{ width: '1rem', height: '1rem' }} /> New Ticket
            </button>
          </div>
        ) : (
          /* ── Two column: list + chat ── */
          <div className="support-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', height: 'calc(100vh - 9rem)', minHeight: '32rem' }}>

            {/* ── LEFT: ticket list ── */}
            <div className="support-list" style={{ background: cardBg, borderRadius: '1.25rem', border: `1px solid ${cardBorder}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.125rem 1.25rem 0.875rem', borderBottom: `1px solid ${rowBorder}`, background: panelHeaderBg }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                  <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: text1 }}>Support</h1>
                  <button onClick={() => setShowNewTicket(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 700, color: 'white', background: primaryBtnBg ?? accent, border: 'none', borderRadius: '0.625rem', padding: '0.4rem 0.75rem', cursor: 'pointer' }}>
                    <Plus style={{ width: '0.875rem', height: '0.875rem' }} /> New Ticket
                  </button>
                </div>
                {/* filter pills */}
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {(['open', 'closed', 'all'] as const).map(f => {
                    const active = filter === f
                    return (
                      <button key={f} onClick={() => setFilter(f)}
                        style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', padding: '0.4rem 0', borderRadius: '9999px', cursor: 'pointer', border: `1px solid ${active ? accent : rowBorder}`, background: active ? `${accent}14` : 'transparent', color: active ? accent : text2, transition: 'all 0.15s' }}>
                        {f}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredTickets.length === 0 ? (
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: text2, fontSize: '0.875rem' }}>
                    No {filter === 'all' ? '' : filter} tickets.
                  </div>
                ) : filteredTickets.map(ticket => {
                  const isSel = selectedTicket?.id === ticket.id
                  const isOpen = ticket.status === 'open'
                  const hasUnread = Boolean(ticket.has_unread || (ticket.unread_count ?? 0) > 0)
                  return (
                    <button key={ticket.id} onClick={() => setSelectedTicket(ticket)} className="support-ticket-row"
                      style={{ width: '100%', padding: '0.875rem 1.125rem', textAlign: 'left', background: isSel ? selectedBg : 'transparent', border: 'none', borderBottom: `1px solid ${rowBorder}`, borderLeft: `3px solid ${isSel ? accent : 'transparent'}`, cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s', display: 'block' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ticket.subject}</p>
                        {hasUnread && <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: accent, flexShrink: 0, marginTop: '0.25rem' }} />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'capitalize', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: isOpen ? `${accent}1a` : 'rgba(107,107,88,0.12)', color: isOpen ? accent : text2 }}>
                          {ticket.status}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: text2 }}>{relativeTime(ticket.created_at)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── RIGHT: chat ── */}
            <div className="support-chat" style={{ display: 'flex', flexDirection: 'column', background: cardBg, borderRadius: '1.25rem', border: `1px solid ${cardBorder}`, overflow: 'hidden' }}>
              {!selectedTicket ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.125rem', color: text2, padding: '2rem', textAlign: 'center' }}>
                  <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', background: `${accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Headphones style={{ width: '2rem', height: '2rem', color: accent }} />
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: text1 }}>Select a ticket to view messages</p>
                  <button onClick={() => setShowNewTicket(true)} className="btn-secondary" style={{ display: 'inline-flex' }}>
                    <Plus style={{ width: '1rem', height: '1rem' }} /> Or create a new one
                  </button>
                </div>
              ) : (
                <>
                  {/* header */}
                  <div style={{ padding: '1.125rem 1.5rem', borderBottom: `1px solid ${rowBorder}`, background: panelHeaderBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedTicket.subject}</p>
                      <p style={{ fontSize: '0.75rem', color: text2, marginTop: '0.15rem' }}>Opened {relativeTime(selectedTicket.created_at)}</p>
                    </div>
                    <span style={{ flexShrink: 0, fontSize: '0.6875rem', fontWeight: 700, textTransform: 'capitalize', padding: '0.3rem 0.75rem', borderRadius: '9999px', background: selectedTicket.status === 'open' ? `${accent}1a` : 'rgba(107,107,88,0.12)', color: selectedTicket.status === 'open' ? accent : text2 }}>
                      {selectedTicket.status === 'open' ? '● Open' : 'Closed'}
                    </span>
                  </div>

                  {/* thread */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', color: text2, fontSize: '0.875rem', padding: '2rem' }}>
                        No messages yet. We will reply shortly!
                      </div>
                    )}
                    {messages.map((msg, i) => {
                      const isMine = !msg.is_admin
                      const prev = messages[i - 1]
                      const showDate = !prev || new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString()
                      return (
                        <Fragment key={msg.id ?? i}>
                          {showDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' }}>
                              <div style={{ flex: 1, height: '1px', background: rowBorder }} />
                              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: text2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{dayLabel(msg.created_at)}</span>
                              <div style={{ flex: 1, height: '1px', background: rowBorder }} />
                            </div>
                          )}
                          <div className="support-msg" style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                            {!isMine && (
                              <p style={{ fontSize: '0.75rem', color: accent, fontWeight: 700, marginBottom: '0.25rem', paddingLeft: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Headphones style={{ width: '0.8125rem', height: '0.8125rem' }} /> AceForge Support
                              </p>
                            )}
                            <div style={{
                              maxWidth: '78%',
                              padding: msg.image_url && !msg.message ? '0.375rem' : '0.75rem 1rem',
                              borderRadius: isMine ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                              background: isMine ? myMsgBg : adminMsgBg,
                              color: isMine ? 'white' : adminMsgColor,
                              border: isMine ? 'none' : `1px solid ${adminMsgBorder}`,
                              overflow: 'hidden',
                            }}>
                              {msg.image_url && (
                                <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                                  <img src={msg.image_url} alt="screenshot" style={{ maxWidth: '100%', borderRadius: '0.625rem', display: 'block', maxHeight: '300px', objectFit: 'contain' }} />
                                </a>
                              )}
                              {msg.message && <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginTop: msg.image_url ? '0.5rem' : 0 }}>{msg.message}</p>}
                            </div>
                            <p style={{ fontSize: '0.6875rem', color: text2, marginTop: '0.25rem', padding: '0 0.25rem' }}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </Fragment>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* input */}
                  {selectedTicket.status === 'open' ? (
                    <div style={{ padding: '1rem 1.25rem', borderTop: `1px solid ${rowBorder}`, background: cardBg }}>
                      <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: isTutor ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(234,88,12,0.06)') : 'rgba(34,85,14,0.06)', border: inputBorder ?? `1.5px solid ${accent}33`, cursor: 'pointer', flexShrink: 0 }} title="Attach a screenshot">
                          <Paperclip style={{ width: '1.125rem', height: '1.125rem', color: accent }} />
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                        </label>
                        <textarea ref={inputRef} value={newMessage} rows={1}
                          onChange={e => setNewMessage(e.target.value)}
                          onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 72) + 'px' }}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                          placeholder="Type your message..." className="input" style={{ flex: 1, resize: 'none', minHeight: '2.75rem', maxHeight: '72px', paddingTop: '0.7rem', lineHeight: 1.4, ...inputStyle }} />
                        <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="btn-primary" style={{ width: '2.75rem', height: '2.75rem', padding: 0, justifyContent: 'center', flexShrink: 0, opacity: newMessage.trim() ? 1 : 0.5, ...primaryBtnStyle }}>
                          <Send style={{ width: '1.125rem', height: '1.125rem' }} />
                        </button>
                      </div>
                      {uploadingImage && <p style={{ fontSize: '0.75rem', color: text2, marginTop: '0.5rem' }}>Uploading...</p>}
                    </div>
                  ) : (
                    <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${rowBorder}`, textAlign: 'center' }}>
                      <p style={{ fontSize: '0.875rem', color: text2 }}>This ticket is closed.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {newTicketModal}

      <style>{`
        @keyframes supportMsgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes supportModalIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes supportShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .support-msg { animation: supportMsgIn 0.3s ease both; }
        .support-modal { animation: supportModalIn 0.28s cubic-bezier(0.16,1,0.3,1) both; }
        .support-shake { animation: supportShake 0.4s ease both; }
        .support-ticket-row:hover { background: ${selectedBg} !important; }
        @media (max-width: 760px) {
          .support-grid { grid-template-columns: 1fr !important; height: auto !important; }
          .support-list { max-height: 20rem; }
          .support-chat { height: 70vh; }
        }
      `}</style>
    </div>
  )
}
