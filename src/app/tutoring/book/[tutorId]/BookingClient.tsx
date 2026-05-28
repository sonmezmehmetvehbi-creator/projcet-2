'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SESSION_LENGTHS = [
  { value: 30, label: '30 minutes', desc: 'Quick focused session' },
  { value: 60, label: '1 hour', desc: 'Standard session' },
  { value: 90, label: '1.5 hours', desc: 'Deep dive session' },
]

interface Props {
  profile: any
  tutor: any
  availability: any[]
}

export default function BookingClient({ profile, tutor, availability }: Props) {
  const router = useRouter()
  const [subject, setSubject] = useState(tutor.subjects?.[0] ?? '')
  const [topic, setTopic] = useState('')
  const [sessionLength, setSessionLength] = useState(60)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [language, setLanguage] = useState('English')
  const [message, setMessage] = useState('')
  const [agreedToRecording, setAgreedToRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isPremium = profile?.is_premium ?? false
  const baseRate = isPremium ? 34.99 : 49.99
  const sessionPrice = sessionLength === 30 ? baseRate / 2 : sessionLength === 90 ? baseRate * 1.5 : baseRate

  async function handleBook() {
    if (!subject || !topic || !selectedDate || !selectedTime) {
      setError('Please fill in all required fields.')
      return
    }
    if (!agreedToRecording) {
      setError('Please consent to session recording to proceed.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString()

      const res = await fetch('/api/tutoring/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutor.id,
          subject,
          topic,
          sessionLength,
          scheduledAt,
          language,
          message,
          studentPrice: sessionPrice,
          tutorPayout: sessionLength === 30 ? 15 : sessionLength === 90 ? 45 : 30,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSuccess(true)
      setTimeout(() => router.push('/tutoring/sessions'), 2000)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (success) return (
    <div style={{ paddingTop:'6rem', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'6rem 1.5rem 3rem' }}>
      <div className="card" style={{ padding:'3rem', maxWidth:'32rem', width:'100%', textAlign:'center' }}>
        <div style={{ width:'4rem', height:'4rem', borderRadius:'50%', background:'rgb(234,243,222)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
          <CheckCircle style={{ width:'2rem', height:'2rem', color:'rgb(59,109,17)' }} />
        </div>
        <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
          Session Requested! 🎓
        </h2>
        <p style={{ color:'rgb(107,107,88)', lineHeight:1.7 }}>
          Your tutoring session has been requested. The tutor will confirm within 24 hours and send you a Google Meet link.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'44rem', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Tutor card */}
        <div className="card" style={{ padding:'1.5rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ width:'3.5rem', height:'3.5rem', borderRadius:'50%', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.25rem', fontWeight:700, flexShrink:0 }}>
            {tutor.display_name?.[0] ?? '?'}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:'Fraunces, Georgia, serif', fontWeight:700, fontSize:'1.125rem', color:'rgb(26,26,20)' }}>{tutor.display_name}</p>
            <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>{tutor.subjects?.join(', ')}</p>
            {tutor.rating > 0 && <p style={{ fontSize:'0.875rem', color:'rgb(180,120,10)' }}>⭐ {tutor.rating} ({tutor.total_reviews} reviews)</p>}
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.25rem', color:'rgb(34,85,14)' }}>${baseRate}/hr</p>
            {isPremium && <p style={{ fontSize:'0.75rem', color:'rgb(34,85,14)' }}>Premium rate ⚡</p>}
          </div>
        </div>

        <div className="card" style={{ padding:'2rem' }}>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1.5rem' }}>
            Book a Session
          </h1>

          {error && (
            <div className="alert-error" style={{ marginBottom:'1.25rem' }}>
              <AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />
              {error}
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

            <div>
              <label className="label">Subject *</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="input">
                {tutor.subjects?.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="label">What do you need help with? *</label>
              <textarea value={topic} onChange={e => setTopic(e.target.value)} className="input" rows={3} style={{ resize:'vertical' }}
                placeholder="e.g. I'm struggling with quadratic equations and need help understanding the quadratic formula..." />
            </div>

            <div>
              <label className="label">Session Length *</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem' }}>
                {SESSION_LENGTHS.map(sl => {
                  const price = sl.value === 30 ? baseRate / 2 : sl.value === 90 ? baseRate * 1.5 : baseRate
                  return (
                    <button key={sl.value} type="button" onClick={() => setSessionLength(sl.value)}
                      style={{ padding:'0.875rem 0.5rem', borderRadius:'0.75rem', border:`2px solid ${sessionLength === sl.value ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)'}`, background: sessionLength === sl.value ? 'rgba(34,85,14,0.06)' : 'white', cursor:'pointer', textAlign:'center', transition:'all 0.2s' }}>
                      <p style={{ fontWeight:700, fontSize:'0.9375rem', color: sessionLength === sl.value ? 'rgb(34,85,14)' : 'rgb(26,26,20)', marginBottom:'0.25rem' }}>{sl.label}</p>
                      <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', marginBottom:'0.25rem' }}>{sl.desc}</p>
                      <p style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1rem', color:'rgb(34,85,14)' }}>${price.toFixed(2)}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div>
                <label className="label">Preferred Date *</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input" />
              </div>
              <div>
                <label className="label">Preferred Time *</label>
                <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="input" />
              </div>
            </div>

            {availability.length > 0 && (
              <div style={{ padding:'0.875rem 1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.03)', border:'1px solid rgba(34,85,14,0.1)' }}>
                <p style={{ fontSize:'0.8125rem', fontWeight:600, color:'rgb(34,85,14)', marginBottom:'0.375rem' }}>Tutor availability ({availability[0]?.timezone}):</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem' }}>
                  {availability.map((a: any, i: number) => (
                    <span key={i} style={{ fontSize:'0.75rem', padding:'0.2rem 0.5rem', borderRadius:'9999px', background:'rgba(34,85,14,0.08)', color:'rgb(34,85,14)' }}>
                      {DAYS[a.day_of_week]} {a.start_time}–{a.end_time}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label">Language preference</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="input">
                {tutor.languages?.map((l: string) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Additional notes <span style={{ fontWeight:400, color:'rgb(107,107,88)', fontSize:'0.8125rem' }}>(optional)</span></label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} className="input" rows={2} style={{ resize:'vertical' }}
                placeholder="Anything else the tutor should know..." />
            </div>

            {/* Price summary */}
            <div style={{ padding:'1.25rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.12)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                <span style={{ fontSize:'0.9375rem', color:'rgb(107,107,88)' }}>Session ({sessionLength} min)</span>
                <span style={{ fontFamily:'Syne, sans-serif', fontWeight:700, color:'rgb(26,26,20)' }}>${sessionPrice.toFixed(2)}</span>
              </div>
              {isPremium && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                  <span style={{ fontSize:'0.875rem', color:'rgb(34,85,14)' }}>Premium discount ⚡</span>
                  <span style={{ fontSize:'0.875rem', color:'rgb(34,85,14)', fontWeight:600 }}>-$15.00/hr</span>
                </div>
              )}
              <div style={{ borderTop:'1px solid rgba(34,85,14,0.1)', paddingTop:'0.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:700, color:'rgb(26,26,20)' }}>Total due now</span>
                <span style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.25rem', color:'rgb(34,85,14)' }}>${sessionPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Recording consent */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'1rem', borderRadius:'0.875rem', background:'rgba(37,99,235,0.04)', border:'1px solid rgba(37,99,235,0.15)' }}>
              <input type="checkbox" checked={agreedToRecording} onChange={e => setAgreedToRecording(e.target.checked)}
                style={{ width:'1.125rem', height:'1.125rem', accentColor:'rgb(34,85,14)', flexShrink:0, marginTop:'0.125rem', cursor:'pointer' }} />
              <label style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)', lineHeight:1.6, cursor:'pointer' }} onClick={() => setAgreedToRecording(!agreedToRecording)}>
                📹 I consent to this session being recorded for quality assurance and dispute resolution. Recordings are only reviewed in case of a dispute and deleted after 30 days.
              </label>
            </div>

            <button onClick={handleBook} disabled={loading} className="btn-primary"
              style={{ width:'100%', justifyContent:'center', padding:'1rem', fontSize:'1.0625rem' }}>
              {loading ? 'Processing...' : `Request & Pay $${sessionPrice.toFixed(2)} 🎓`}
            </button>

            <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)', textAlign:'center' }}>
              🔒 Secure payment via Stripe · Full refund if tutor doesn't show up
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
