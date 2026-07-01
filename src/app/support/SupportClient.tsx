'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Send, Plus, AlertCircle } from 'lucide-react'
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

export default function SupportClient({ profile, tickets: initialTickets, currentUserId, isTutor = false }: Props) {
  // Tutors get the dark-purple tutor theme; the provider toggle (useTutorTheme)
  // keeps this in sync with the navbar. Students keep the green/light theme.
  const { theme } = useTutorTheme()
  const isDark = isTutor && theme === 'dark'

  const accent = isTutor ? (isDark ? 'rgb(99,102,241)' : 'rgb(234,88,12)') : 'rgb(34,85,14)'
  const text1 = isTutor ? (isDark ? 'white' : 'var(--af-text)') : 'var(--af-text)'
  const text2 = isTutor ? (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,20,0.6)') : 'var(--af-text-muted)'
  const cardBg = isTutor ? (isDark ? 'rgba(255,255,255,0.04)' : 'white') : 'white'
  const cardBorder = isTutor ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(234,88,12,0.12)') : 'var(--af-border)'
  const panelHeaderBg = isTutor ? (isDark ? 'rgba(99,102,241,0.08)' : 'rgba(234,88,12,0.03)') : 'rgba(34,85,14,0.02)'
  const rowBorder = isTutor ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(234,88,12,0.06)') : 'rgba(34,85,14,0.06)'
  const selectedBg = isTutor ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(234,88,12,0.08)') : 'rgba(34,85,14,0.06)'
  const inputBg = isTutor ? (isDark ? 'rgba(255,255,255,0.05)' : 'white') : undefined
  const inputColor = isTutor ? (isDark ? 'white' : 'var(--af-text)') : undefined
  const inputBorder = isTutor ? (isDark ? '1.5px solid rgba(99,102,241,0.3)' : '1.5px solid rgba(234,88,12,0.25)') : undefined
  const primaryBtnBg = isTutor ? (isDark ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #ea580c, #f97316)') : undefined
  const myMsgBg = isTutor ? (isDark ? 'rgb(99,102,241)' : 'rgb(234,88,12)') : 'rgb(34,85,14)'
  const adminMsgBg = isTutor ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgb(243,244,246)') : 'var(--af-border)'
  const adminMsgColor = isTutor ? (isDark ? 'white' : 'var(--af-text)') : 'var(--af-text)'
  // Inline styles for tutor theme that override the green/light global CSS classes.
  const inputStyle = isTutor ? { background: inputBg, color: inputColor, border: inputBorder } : undefined
  const primaryBtnStyle = isTutor ? { background: primaryBtnBg, border: 'none', color: 'white' } : undefined

  const [tickets, setTickets] = useState(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
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
  const supabase = createClient()

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

  async function createTicket() {
    if (!category) { setError('Please select a category.'); return }
    if (!subject.trim()) { setError('Please enter a subject.'); return }
    if (!firstMessage.trim()) { setError('Please describe your issue.'); return }
    setCreating(true)
    setError('')
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({ user_id: profile.id, subject: `[${category}] ${subject.trim()}`, status: 'open' })
        .select()
        .single()
      if (ticketError) throw ticketError
      await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, message: firstMessage.trim() }),
      })
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

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: text1, marginBottom: '0.25rem' }}>Help & Support 🎧</h1>
            <p style={{ color: text2 }}>Our team typically replies within a few hours.</p>
          </div>
          <button onClick={() => setShowNewTicket(true)} className="btn-primary" style={primaryBtnStyle}>
            <Plus style={{ width: '1rem', height: '1rem' }} /> New Ticket
          </button>
        </div>

        {showNewTicket && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: cardBg, border: `2px solid ${cardBorder}` }}>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: text1, marginBottom: '1rem' }}>New Support Ticket</h2>
            {error && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />{error}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
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
                <label className="label" style={{ color: text2 }}>Tell us more *</label>
                <textarea value={firstMessage} onChange={e => setFirstMessage(e.target.value)} className="input" rows={4} style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Describe what happened and any relevant details..." />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { setShowNewTicket(false); setError('') }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button onClick={createTicket} disabled={creating} className="btn-primary" style={{ flex: 2, justifyContent: 'center', ...primaryBtnStyle }}>
                  {creating ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tickets.length === 0 && !showNewTicket ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', background: cardBg, border: `1px solid ${cardBorder}` }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎧</div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: text1, marginBottom: '0.75rem' }}>How can we help?</h2>
            <p style={{ color: text2, marginBottom: '1.5rem' }}>Open a ticket and we will get back to you within a few hours.</p>
            <button onClick={() => setShowNewTicket(true)} className="btn-primary" style={{ display: 'inline-flex', ...primaryBtnStyle }}>
              <Plus style={{ width: '1rem', height: '1rem' }} /> Open a Ticket
            </button>
          </div>
        ) : tickets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', height: '65vh' }}>

            <div style={{ background: cardBg, borderRadius: '1rem', border: `1px solid ${cardBorder}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${cardBorder}`, background: panelHeaderBg }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: text1 }}>Your Tickets</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {tickets.map(ticket => (
                  <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                    style={{ width: '100%', padding: '0.875rem 1rem', textAlign: 'left', background: selectedTicket?.id === ticket.id ? selectedBg : 'transparent', border: 'none', borderBottom: `1px solid ${rowBorder}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ticket.subject}</p>
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.15rem 0.375rem', borderRadius: '9999px', background: ticket.status === 'open' ? `${accent}1a` : 'rgba(107,107,88,0.1)', color: ticket.status === 'open' ? accent : text2, flexShrink: 0 }}>
                        {ticket.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: text2, marginTop: '0.25rem' }}>{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', background: cardBg, borderRadius: '1rem', border: `1px solid ${cardBorder}`, overflow: 'hidden' }}>
              {!selectedTicket ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: text2 }}>
                  <span style={{ fontSize: '3rem' }}>💬</span>
                  <p>Select a ticket to view the conversation</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${cardBorder}`, background: panelHeaderBg }}>
                    <p style={{ fontWeight: 700, color: text1 }}>{selectedTicket.subject}</p>
                    <p style={{ fontSize: '0.8125rem', color: text2 }}>
                      {selectedTicket.status === 'open' ? '🟢 Open — we will reply soon' : '⚫ Closed'}
                    </p>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.length === 0 && (
                      <div style={{ textAlign: 'center', color: text2, fontSize: '0.875rem', padding: '2rem' }}>
                        No messages yet. We will reply shortly!
                      </div>
                    )}
                    {messages.map((msg, i) => {
                      const isMine = !msg.is_admin
                      return (
                        <div key={msg.id ?? i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                          {!isMine && (
                            <p style={{ fontSize: '0.75rem', color: accent, fontWeight: 700, marginBottom: '0.25rem', paddingLeft: '0.25rem' }}>
                              🎧 AceForge Support
                            </p>
                          )}
                          <div style={{
                            maxWidth: '70%',
                            padding: msg.image_url && !msg.message ? '0.375rem' : '0.75rem 1rem',
                            borderRadius: isMine ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                            background: isMine ? myMsgBg : adminMsgBg,
                            color: isMine ? 'white' : adminMsgColor,
                            overflow: 'hidden',
                          }}>
                            {msg.image_url && (
                              <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                                <img src={msg.image_url} alt="screenshot" style={{ maxWidth: '100%', borderRadius: '0.625rem', display: 'block', maxHeight: '300px', objectFit: 'contain' }} />
                              </a>
                            )}
                            {msg.message && <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginTop: msg.image_url ? '0.5rem' : 0 }}>{msg.message}</p>}
                          </div>
                          <p style={{ fontSize: '0.6875rem', color: text2, marginTop: '0.25rem' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {selectedTicket.status === 'open' ? (
                    <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${cardBorder}` }}>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                          placeholder="Type your message..." className="input" style={{ flex: 1, ...inputStyle }} />
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: isTutor ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(234,88,12,0.06)') : 'rgba(34,85,14,0.06)', border: inputBorder ?? '1.5px solid rgba(34,85,14,0.2)', cursor: 'pointer', flexShrink: 0 }} title="Send screenshot">
                          🖼️
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                        </label>
                        <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="btn-primary" style={{ padding: '0.625rem 1rem', flexShrink: 0, ...primaryBtnStyle }}>
                          <Send style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                      {uploadingImage && <p style={{ fontSize: '0.75rem', color: text2, marginTop: '0.5rem' }}>Uploading image...</p>}
                    </div>
                  ) : (
                    <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${cardBorder}`, textAlign: 'center' }}>
                      <p style={{ fontSize: '0.875rem', color: text2 }}>This ticket is closed.</p>
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
