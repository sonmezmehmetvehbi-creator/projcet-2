'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, X, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useTutorTheme } from '@/app/tutor/dashboard/TutorThemeContext'

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
  const { theme: tutorTheme } = useTutorTheme()
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log('[SessionChatClient] isTutor:', isTutor)
  }, [])

  useEffect(() => {
    fetchMessages()
    const supabase = createClient()
    const channel = supabase
      .channel(`session-messages-${session.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'session_messages',
        filter: `session_id=eq.${session.id}`,
      }, () => {
        fetchMessages()
      })
      .subscribe()

    const pollInterval = setInterval(fetchMessages, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
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

  // Theme: when isTutor, use tutor dark/light; otherwise student green/white
  const isDark = isTutor && tutorTheme === 'dark'
  const isLight = isTutor && tutorTheme === 'light'

  const accent = isTutor
    ? (isDark ? 'rgb(99,102,241)' : 'rgb(234,88,12)')
    : 'rgb(34,85,14)'

  const pageBg = isTutor
    ? (isDark ? 'rgb(15,15,30)' : 'linear-gradient(135deg, #fff5ef, #fff8f5)')
    : 'rgb(250,250,247)'

  const cardBg = isTutor
    ? (isDark ? 'rgba(255,255,255,0.04)' : 'white')
    : 'white'

  const cardBorder = isTutor
    ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(234,88,12,0.1)')
    : 'rgba(34,85,14,0.08)'

  const text1 = isTutor
    ? (isDark ? 'white' : 'rgb(26,26,20)')
    : 'rgb(26,26,20)'

  const text2 = isTutor
    ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,20,0.7)')
    : 'rgb(107,107,88)'

  const text3 = isTutor
    ? (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,20,0.5)')
    : 'rgb(107,107,88)'

  const detailCardBg = isTutor
    ? (isDark ? 'rgba(99,102,241,0.05)' : 'rgba(234,88,12,0.03)')
    : 'rgba(34,85,14,0.03)'

  const detailCardBorder = isTutor
    ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(234,88,12,0.1)')
    : 'rgba(34,85,14,0.08)'

  const chatHeaderBorder = isTutor
    ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(234,88,12,0.1)')
    : 'rgba(34,85,14,0.08)'

  const avatarBg = isTutor
    ? (isDark ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #ea580c, #f97316)')
    : 'rgb(34,85,14)'

  const myMsgBg = isTutor
    ? (isDark ? 'rgb(99,102,241)' : 'rgb(234,88,12)')
    : 'rgb(34,85,14)'

  const otherMsgBg = isTutor
    ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgb(243,244,246)')
    : 'rgb(243,244,246)'

  const otherMsgColor = isTutor
    ? (isDark ? 'white' : 'rgb(26,26,20)')
    : 'rgb(26,26,20)'

  const inputBg = isTutor
    ? (isDark ? 'rgba(255,255,255,0.05)' : 'white')
    : 'white'

  const inputBorderStyle = isTutor
    ? (isDark ? '1.5px solid rgba(99,102,241,0.3)' : `1.5px solid rgba(234,88,12,0.25)`)
    : '1.5px solid rgba(34,85,14,0.2)'

  const attachBtnBorder = isTutor
    ? (isDark ? '1.5px solid rgba(99,102,241,0.3)' : '1.5px solid rgba(234,88,12,0.2)')
    : '1.5px solid rgba(34,85,14,0.2)'

  const attachBtnBg = isTutor
    ? (isDark ? 'rgba(255,255,255,0.05)' : 'white')
    : 'white'

  const sendBtnBg = isTutor
    ? (isDark ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #ea580c, #f97316)')
    : 'rgb(34,85,14)'

  const backLinkColor = isTutor
    ? (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,20,0.5)')
    : 'rgb(107,107,88)'

  const statusColors: Record<string, string> = {
    pending: 'rgb(180,120,10)', confirmed: isTutor ? accent : 'rgb(34,85,14)',
    completed: isTutor ? accent : 'rgb(34,85,14)', declined: 'rgb(163,45,45)', disputed: 'rgb(163,45,45)'
  }
  const statusBgs: Record<string, string> = {
    pending: 'rgba(232,160,32,0.1)', confirmed: isTutor ? `${accent}18` : 'rgba(34,85,14,0.08)',
    completed: isTutor ? `${accent}18` : 'rgba(34,85,14,0.08)', declined: 'rgba(163,45,45,0.08)', disputed: 'rgba(163,45,45,0.08)'
  }

  // isMe: if isTutor, tutor's own messages (is_tutor=true) are "mine"; else student's own (is_tutor=false) are "mine"
  const getIsMe = (msg: any) => isTutor ? msg.is_tutor : !msg.is_tutor

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '2rem', background: pageBg }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <Link href={isTutor ? '/tutor/dashboard' : '/tutoring/sessions'}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: backLinkColor, textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> {isTutor ? 'Back to Dashboard' : 'Back to Sessions'}
        </Link>

        {/* Session info card */}
        <div style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '1rem', background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: isTutor && isDark ? 'none' : '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: text1, marginBottom: '0.25rem' }}>
                {session.subject} Session
              </h1>
              <p style={{ color: text2, fontSize: '0.9375rem' }}>with {tutorProfile?.display_name}</p>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, padding: '0.375rem 0.875rem', borderRadius: '9999px', background: statusBgs[session.status] ?? detailCardBg, color: statusColors[session.status] ?? accent }}>
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
              <div key={item.label} style={{ padding: '0.75rem', borderRadius: '0.75rem', background: detailCardBg, border: `1px solid ${detailCardBorder}` }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{item.label}</p>
                <p style={{ fontSize: '0.875rem', color: text1, fontWeight: 500 }}>{item.value}</p>
              </div>
            ))}
          </div>

          {session.wants_intro_call && session.intro_call_link ? (
            <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(37,99,235,0.06)', border: '2px solid rgba(37,99,235,0.25)', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'rgb(37,99,235)', marginBottom: '0.5rem' }}>🤝 Free 15-Min Intro Call</p>
              {session.intro_call_date && (
                <p style={{ fontSize: '0.875rem', color: 'rgb(37,99,235)', marginBottom: '0.625rem' }}>
                  📅 {new Date(session.intro_call_date).toLocaleString()}
                </p>
              )}
              <a href={session.intro_call_link} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: 'rgb(37,99,235)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
                🎥 Join Intro Call →
              </a>
            </div>
          ) : session.wants_intro_call ? (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'rgb(37,99,235)', fontWeight: 600 }}>
                🤝 {isTutor ? 'Student requested a free 15-min intro call — fill in the intro call link when confirming' : 'You requested a free 15-min intro call — your tutor will send the link when they confirm'}
              </p>
            </div>
          ) : null}

          {session.wants_continuing && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.04)', border: '1px solid rgba(34,85,14,0.1)', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'rgb(34,85,14)', fontWeight: 600 }}>🔁 {isTutor ? 'Student is interested in ongoing sessions' : 'You expressed interest in ongoing sessions'}</p>
            </div>
          )}

          {session.file_urls?.length > 0 && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: detailCardBg, border: `1px solid ${detailCardBorder}`, marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>📎 {isTutor ? 'Files student uploaded' : 'Files you uploaded'}</p>
              {session.file_urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.875rem', color: accent, display: 'block', marginBottom: '0.25rem' }}>
                  📄 File {i + 1} →
                </a>
              ))}
            </div>
          )}

          {session.status === 'confirmed' && session.meet_link && (
            <a href={session.meet_link} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.875rem', background: isTutor ? sendBtnBg : 'rgb(34,85,14)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem', marginTop: '0.5rem' }}>
              🎥 Join Main Session →
            </a>
          )}

          {session.status === 'pending' && (
            <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.2)' }}>
              <p style={{ fontSize: '0.875rem', color: 'rgb(180,120,10)', fontWeight: 600, marginBottom: '0.375rem' }}>
                {isTutor ? '⏳ Awaiting your confirmation — go to dashboard to accept' : '⏳ Waiting for tutor to confirm'}
              </p>
              {!isTutor && (
                <p style={{ fontSize: '0.8125rem', color: 'rgb(107,107,88)', lineHeight: 1.6 }}>
                  Your tutor will review your request and send a Google Meet link. You can message them below while you wait.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Chat */}
        <div style={{ borderRadius: '1rem', overflow: 'hidden', background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: isTutor && isDark ? 'none' : '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${chatHeaderBorder}`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>
              {tutorProfile?.display_name?.[0] ?? '?'}
            </div>
            <div>
              <p style={{ fontWeight: 700, color: text1, fontSize: '0.9375rem' }}>{tutorProfile?.display_name}</p>
              <p style={{ fontSize: '0.75rem', color: text2 }}>{isTutor ? 'Session chat — monitored by AceForge' : 'Your tutor — messages are monitored by AceForge'}</p>
            </div>
          </div>

          <div style={{ height: '400px', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: isTutor && isDark ? 'rgba(0,0,0,0.15)' : undefined }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '2rem' }}>💬</p>
                <p style={{ color: text2, fontSize: '0.9375rem', textAlign: 'center' }}>
                  {isTutor ? 'No messages yet. Introduce yourself to your student!' : 'No messages yet. Say hi to your tutor!'}
                </p>
              </div>
            )}
            {messages.map(msg => {
              const isMe = getIsMe(msg)
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && (
                    <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.6875rem', flexShrink: 0, marginRight: '0.5rem', alignSelf: 'flex-end' }}>
                      {(isTutor ? profile?.display_name?.[0] : tutorProfile?.display_name?.[0]) ?? '?'}
                    </div>
                  )}
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{ padding: '0.625rem 0.875rem', borderRadius: isMe ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem', background: isMe ? myMsgBg : otherMsgBg, color: isMe ? 'white' : otherMsgColor, fontSize: '0.9375rem', lineHeight: 1.5 }}>
                      {msg.message && <p style={{ margin: 0 }}>{msg.message}</p>}
                      {msg.file_url && (
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: isMe ? 'rgba(255,255,255,0.9)' : accent, fontSize: '0.875rem', marginTop: msg.message ? '0.375rem' : 0 }}>
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
            <div style={{ padding: '0.5rem 1rem', borderTop: `1px solid ${chatHeaderBorder}`, display: 'flex', alignItems: 'center', gap: '0.5rem', background: detailCardBg }}>
              <span style={{ fontSize: '0.8125rem', color: accent, flex: 1 }}>📎 {file.name}</span>
              <button onClick={() => setFile(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: text2 }}>
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          )}

          <div style={{ padding: '1rem 1.25rem', borderTop: `1px solid ${chatHeaderBorder}`, display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <button onClick={() => fileRef.current?.click()}
              style={{ padding: '0.625rem', borderRadius: '0.625rem', border: attachBtnBorder, background: attachBtnBg, cursor: 'pointer', color: text2, display: 'flex', flexShrink: 0 }}>
              <Paperclip style={{ width: '1.125rem', height: '1.125rem' }} />
            </button>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={isTutor ? 'Message your student...' : 'Message your tutor...'}
              style={{ flex: 1, padding: '0.625rem 0.875rem', borderRadius: '0.75rem', border: inputBorderStyle, outline: 'none', fontSize: '0.9375rem', color: text1, background: inputBg }} />
            <button onClick={sendMessage} disabled={sending || uploading || (!input.trim() && !file)}
              style={{ padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: sendBtnBg, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, fontSize: '0.875rem', flexShrink: 0, opacity: sending || uploading ? 0.6 : 1 }}>
              <Send style={{ width: '1rem', height: '1rem' }} />
              {uploading ? 'Uploading...' : sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
