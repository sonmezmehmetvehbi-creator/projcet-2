'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  session: any
  tutorProfile: any
  profile: any
  isTutor: boolean
}

export default function SessionChatClient({ session, tutorProfile, profile, isTutor }: Props) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    const res = await fetch(`/api/tutoring/messages?sessionId=${session.id}`)
    const data = await res.json()
    if (data.messages) setMessages(data.messages)
  }

  async function sendMessage() {
    if (!input.trim() && !file) return
    setSending(true)
    try {
      let fileUrl = null, fileName = null
      if (file) {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/tutoring/upload-message-file', { method: 'POST', body: formData })
        const data = await res.json()
        fileUrl = data.url
        fileName = data.name
        setUploading(false)
      }
      await fetch('/api/tutoring/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, message: input.trim(), fileUrl, fileName, isTutor }),
      })
      setInput('')
      setFile(null)
      await fetchMessages()
    } catch {}
    setSending(false)
  }

  const statusColors: Record<string, string> = {
    pending: 'rgb(180,120,10)', confirmed: 'rgb(34,85,14)',
    completed: 'rgb(34,85,14)', declined: 'rgb(163,45,45)', disputed: 'rgb(163,45,45)'
  }
  const statusBgs: Record<string, string> = {
    pending: 'rgba(232,160,32,0.1)', confirmed: 'rgba(34,85,14,0.08)',
    completed: 'rgba(34,85,14,0.08)', declined: 'rgba(163,45,45,0.08)', disputed: 'rgba(163,45,45,0.08)'
  }

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <Link href="/tutoring/sessions" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'rgb(107,107,88)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> Back to Sessions
        </Link>

        {/* Session info card */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.25rem' }}>
                {session.subject} Session
              </h1>
              <p style={{ color: 'rgb(107,107,88)', fontSize: '0.9375rem' }}>with {tutorProfile?.display_name}</p>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, padding: '0.375rem 0.875rem', borderRadius: '9999px', background: statusBgs[session.status] ?? 'rgba(34,85,14,0.06)', color: statusColors[session.status] ?? 'rgb(34,85,14)' }}>
              {session.status === 'pending' ? '⏳ Awaiting tutor confirmation' :
               session.status === 'confirmed' ? '✅ Confirmed' :
               session.status === 'completed' ? '🎓 Completed' :
               session.status === 'declined' ? '❌ Declined' : session.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { label: 'Topic', value: session.topic },
              { label: 'Grade', value: session.grade },
              { label: 'Language', value: session.language },
              { label: 'Duration', value: session.session_length + ' minutes' },
              { label: 'Scheduled', value: new Date(session.scheduled_at).toLocaleString() },
              { label: 'Amount Paid', value: '$' + session.student_price },
            ].filter(i => i.value).map(item => (
              <div key={item.label} style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)' }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{item.label}</p>
                <p style={{ fontSize: '0.875rem', color: 'rgb(26,26,20)', fontWeight: 500 }}>{item.value}</p>
              </div>
            ))}
          </div>

          {session.wants_intro_call && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'rgb(37,99,235)', fontWeight: 600 }}>🤝 You requested a free 15-min intro call — your tutor will send the link via this chat</p>
            </div>
          )}

          {session.wants_continuing && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.04)', border: '1px solid rgba(34,85,14,0.1)', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'rgb(34,85,14)', fontWeight: 600 }}>🔁 You expressed interest in ongoing sessions</p>
            </div>
          )}

          {session.file_urls?.length > 0 && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>📎 Files you uploaded</p>
              {session.file_urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.875rem', color: 'rgb(34,85,14)', display: 'block', marginBottom: '0.25rem' }}>
                  📄 File {i + 1} →
                </a>
              ))}
            </div>
          )}

          {session.status === 'confirmed' && session.meet_link && (
            <a href={session.meet_link} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.875rem', background: 'rgb(34,85,14)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem' }}>
              🎥 Join Main Session →
            </a>
          )}

          {session.status === 'pending' && (
            <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.2)' }}>
              <p style={{ fontSize: '0.875rem', color: 'rgb(180,120,10)', fontWeight: 600, marginBottom: '0.375rem' }}>⏳ Waiting for tutor to confirm</p>
              <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)', lineHeight: 1.6 }}>
                Your tutor will review your request and send a Google Meet link. You can message them below while you wait.
              </p>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(34,85,14,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>
              {tutorProfile?.display_name?.[0] ?? '?'}
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'rgb(26,26,20)', fontSize: '0.9375rem' }}>{tutorProfile?.display_name}</p>
              <p style={{ fontSize: '0.75rem', color: 'rgb(107,107,88)' }}>Your tutor — messages are monitored by AceForge</p>
            </div>
          </div>

          <div style={{ height: '400px', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '2rem' }}>💬</p>
                <p style={{ color: 'rgb(107,107,88)', fontSize: '0.9375rem', textAlign: 'center' }}>
                  No messages yet. Say hi to your tutor!
                </p>
              </div>
            )}
            {messages.map(msg => {
              const isMe = !msg.is_tutor
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && (
                    <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.6875rem', flexShrink: 0, marginRight: '0.5rem', alignSelf: 'flex-end' }}>
                      {tutorProfile?.display_name?.[0] ?? '?'}
                    </div>
                  )}
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{ padding: '0.625rem 0.875rem', borderRadius: isMe ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem', background: isMe ? 'rgb(34,85,14)' : 'rgb(243,244,246)', color: isMe ? 'white' : 'rgb(26,26,20)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                      {msg.message && <p style={{ margin: 0 }}>{msg.message}</p>}
                      {msg.file_url && (
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: isMe ? 'rgba(255,255,255,0.9)' : 'rgb(34,85,14)', fontSize: '0.875rem', marginTop: msg.message ? '0.375rem' : 0 }}>
                          📎 {msg.file_name || 'View attachment'} →
                        </a>
                      )}
                    </div>
                    <p style={{ fontSize: '0.6875rem', color: 'rgb(156,163,175)', marginTop: '0.25rem', textAlign: isMe ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {file && (
            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid rgba(34,85,14,0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,85,14,0.04)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'rgb(34,85,14)', flex: 1 }}>📎 {file.name}</span>
              <button onClick={() => setFile(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgb(107,107,88)' }}>
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          )}

          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(34,85,14,0.08)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <button onClick={() => fileRef.current?.click()}
              style={{ padding: '0.625rem', borderRadius: '0.625rem', border: '1.5px solid rgba(34,85,14,0.2)', background: 'white', cursor: 'pointer', color: 'rgb(107,107,88)', display: 'flex', flexShrink: 0 }}>
              <Paperclip style={{ width: '1.125rem', height: '1.125rem' }} />
            </button>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Message your tutor..."
              style={{ flex: 1, padding: '0.625rem 0.875rem', borderRadius: '0.75rem', border: '1.5px solid rgba(34,85,14,0.2)', outline: 'none', fontSize: '0.9375rem', color: 'rgb(26,26,20)', background: 'white' }} />
            <button onClick={sendMessage} disabled={sending || uploading || (!input.trim() && !file)}
              style={{ padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: 'rgb(34,85,14)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, fontSize: '0.875rem', flexShrink: 0, opacity: sending || uploading ? 0.6 : 1 }}>
              <Send style={{ width: '1rem', height: '1rem' }} />
              {uploading ? 'Uploading...' : sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
