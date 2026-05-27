'use client'

import { useState } from 'react'
import { X, AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  profile: any
  onClose: () => void
}

export default function TutoringModal({ profile, onClose }: Props) {
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [slot1, setSlot1] = useState('')
  const [slot2, setSlot2] = useState('')
  const [slot3, setSlot3] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !topic.trim() || !slot1.trim()) {
      setError('Please fill in subject, topic, and at least one time slot.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/tutoring-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, slot1, slot2, slot3, message }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
      zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center',
      padding:'1.5rem', backdropFilter:'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background:'white', borderRadius:'1.5rem',
        padding:'2rem', maxWidth:'30rem', width:'100%',
        boxShadow:'0 24px 64px rgba(0,0,0,0.15)',
        maxHeight:'90vh', overflowY:'auto',
        animation:'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        position:'relative',
      }} onClick={e => e.stopPropagation()}>

        {/* Top accent */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', background:'linear-gradient(90deg, rgb(34,85,14), rgb(122,182,72))', borderRadius:'1.5rem 1.5rem 0 0' }} />

        <button onClick={onClose} style={{ position:'absolute', top:'1.25rem', right:'1.25rem', background:'transparent', border:'none', cursor:'pointer', color:'rgb(107,107,88)', display:'flex' }}>
          <X style={{ width:'1.25rem', height:'1.25rem' }} />
        </button>

        {success ? (
          <div style={{ textAlign:'center', padding:'1rem 0' }}>
            <div style={{ width:'4rem', height:'4rem', borderRadius:'50%', background:'rgb(234,243,222)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
              <CheckCircle style={{ width:'2rem', height:'2rem', color:'rgb(59,109,17)' }} />
            </div>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
              Request Sent! 🎓
            </h2>
            <p style={{ color:'rgb(107,107,88)', lineHeight:1.7, marginBottom:'0.5rem' }}>
              We received your tutoring request. Check your email for confirmation.
            </p>
            <p style={{ color:'rgb(107,107,88)', fontSize:'0.875rem', marginBottom:'2rem' }}>
              We'll send you a Google Meet link within <strong>24-48 hours</strong>.
            </p>
            <button onClick={onClose} className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:'1.5rem', paddingTop:'0.5rem' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
                Request Tutoring 🎓
              </h2>
              <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>
                We'll schedule a Google Meet session for you within 24-48 hours.
              </p>
            </div>

            {error && (
              <div className="alert-error" style={{ marginBottom:'1.25rem' }}>
                <AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <div>
                <label className="label">Subject <span style={{ color:'rgb(163,45,45)' }}>*</span></label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  className="input" placeholder="e.g. Calculus, SAT Math, Biology" required />
              </div>

              <div>
                <label className="label">Topic <span style={{ color:'rgb(163,45,45)' }}>*</span></label>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                  className="input" placeholder="e.g. Integration by parts, Quadratic equations" required />
              </div>

              <div>
                <label className="label">
                  Preferred Time Slots <span style={{ color:'rgb(163,45,45)' }}>*</span>
                  <span style={{ fontWeight:400, color:'rgb(107,107,88)', fontSize:'0.8125rem', marginLeft:'0.25rem' }}>(at least 1)</span>
                </label>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  <input value={slot1} onChange={e => setSlot1(e.target.value)}
                    className="input" placeholder="e.g. Monday Jan 20, 3-5 PM EST" required />
                  <input value={slot2} onChange={e => setSlot2(e.target.value)}
                    className="input" placeholder="e.g. Tuesday Jan 21, 6-8 PM EST (optional)" />
                  <input value={slot3} onChange={e => setSlot3(e.target.value)}
                    className="input" placeholder="e.g. Wednesday Jan 22, 4-6 PM EST (optional)" />
                </div>
              </div>

              <div>
                <label className="label">
                  Additional Message
                  <span style={{ fontWeight:400, color:'rgb(107,107,88)', fontSize:'0.8125rem', marginLeft:'0.25rem' }}>(optional)</span>
                </label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  className="input" rows={3} style={{ resize:'vertical' }}
                  placeholder="Any specific topics you want to cover, your current level, etc." />
              </div>

              <div style={{ padding:'0.875rem 1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.1)' }}>
                <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)', lineHeight:1.6 }}>
                  📧 Confirmation will be sent to <strong>{profile?.email}</strong>. We'll reply with a Google Meet link within 24-48 hours.
                </p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                {loading ? 'Sending request...' : 'Request Tutoring Session 🎓'}
              </button>
            </form>
          </>
        )}
      </div>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  )
}