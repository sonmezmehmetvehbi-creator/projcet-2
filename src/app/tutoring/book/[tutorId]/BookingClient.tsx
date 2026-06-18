'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Upload, X, FileUp, Zap } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useStudentTheme } from '@/app/contexts/StudentThemeContext'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SESSION_LENGTHS = [
  { value: 30, label: '30 minutes', desc: 'Quick focused session' },
  { value: 60, label: '1 hour', desc: 'Standard session' },
  { value: 90, label: '1.5 hours', desc: 'Deep dive session' },
]

function getExpressFee(date: string, time: string): { fee: number; label: string; tier: string } {
  if (!date || !time) return { fee: 0, label: '', tier: 'standard' }
  const sessionTime = new Date(`${date}T${time}`)
  const now = new Date()
  const hoursUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (hoursUntil < 0) return { fee: 0, label: '', tier: 'standard' }
  if (hoursUntil < 6) return { fee: 40, label: 'Under 6 hours — Emergency booking', tier: 'emergency' }
  if (hoursUntil < 12) return { fee: 25, label: '6–12 hours — Urgent booking', tier: 'urgent' }
  if (hoursUntil < 24) return { fee: 15, label: '12–24 hours — Express booking', tier: 'express' }
  return { fee: 0, label: 'Standard booking (24hr+ notice)', tier: 'standard' }
}

interface Props {
  profile: any
  tutor: any
  availability: any[]
}

function BookingForm({ profile, tutor, availability }: Props) {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const fileRef = useRef<HTMLInputElement>(null)
  const { theme } = useStudentTheme()
  const isDark = theme === 'dark'
  const bg = isDark ? 'rgb(15,15,25)' : 'rgb(250,250,247)'
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'white'
  const textPrimary = isDark ? 'white' : 'rgb(26,26,20)'
  const textSecondary = isDark ? 'rgba(255,255,255,0.5)' : 'rgb(107,107,88)'

  const [subject, setSubject] = useState(tutor.subjects?.[0] ?? '')
  const [topic, setTopic] = useState('')
  const [grade, setGrade] = useState('9-10')
  const [sessionLength, setSessionLength] = useState(60)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [language, setLanguage] = useState(tutor.languages?.[0] ?? 'English')
  const [message, setMessage] = useState('')
  const [wantsContinuing, setWantsContinuing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState('')
  const [agreedToRecording, setAgreedToRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'details' | 'payment'>('details')
  const [clientSecret, setClientSecret] = useState('')

  const isPremium = profile?.is_premium ?? false
  const baseRate = isPremium ? 34.99 : 49.99
  const express = getExpressFee(selectedDate, selectedTime)
  const expressFeeForLength = express.fee * (sessionLength === 30 ? 0.5 : sessionLength === 90 ? 1.5 : 1)
  const baseSessionPrice = sessionLength === 30 ? baseRate / 2 : sessionLength === 90 ? (isPremium ? 54.99 : 69.99) : baseRate
  const totalPrice = baseSessionPrice + expressFeeForLength

  const tierColors: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    standard: { bg: 'rgba(34,85,14,0.04)', border: 'rgba(34,85,14,0.12)', color: 'rgb(34,85,14)', icon: '✅' },
    express: { bg: 'rgba(232,160,32,0.06)', border: 'rgba(232,160,32,0.25)', color: 'rgb(180,120,10)', icon: '⚡' },
    urgent: { bg: 'rgba(220,80,20,0.06)', border: 'rgba(220,80,20,0.25)', color: 'rgb(200,75,20)', icon: '🔥' },
    emergency: { bg: 'rgba(163,45,45,0.06)', border: 'rgba(163,45,45,0.25)', color: 'rgb(163,45,45)', icon: '🚨' },
  }
  const tierStyle = tierColors[express.tier]

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const tooBig = files.filter(f => f.size > 20 * 1024 * 1024)
    if (tooBig.length > 0) { setUploadError('Some files exceed 20MB limit.'); return }
    setUploadedFiles(prev => [...prev, ...files].slice(0, 5))
    setUploadError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeFile(i: number) {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleContinueToPayment() {
    if (!subject || !topic || !selectedDate || !selectedTime) {
      setError('Please fill in all required fields.'); return
    }
    if (!agreedToRecording) {
      setError('Please consent to session recording to proceed.'); return
    }
    const sessionTime = new Date(`${selectedDate}T${selectedTime}`)
    if (sessionTime < new Date()) {
      setError('Please select a future date and time.'); return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/tutoring/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          tutorName: tutor.display_name,
          subject,
          sessionLength,
          tutorId: tutor.id,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setClientSecret(data.clientSecret)
      setStep('payment')
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function handlePayAndBook() {
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement }
      })

      if (stripeError) throw new Error(stripeError.message)
      if (paymentIntent?.status !== 'succeeded') throw new Error('Payment failed')

      // Upload files
      const fileUrls: string[] = []
      for (const file of uploadedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/tutoring/upload-file', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.url) fileUrls.push(data.url)
      }

      // Create booking
      const res = await fetch('/api/tutoring/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutor.id,
          subject, topic, grade, sessionLength,
          scheduledAt: new Date(`${selectedDate}T${selectedTime}`).toISOString(),
          language, message, wantsContinuing, fileUrls,
          studentPrice: Math.round(totalPrice * 100) / 100,
          tutorPayout: sessionLength === 30 ? 15 : sessionLength === 90 ? 45 : 30,
          expressTier: express.tier,
          expressFee: expressFeeForLength,
          stripePaymentIntentId: paymentIntent.id,
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
    <div className={isDark ? 'student-dark' : ''} style={{ paddingTop: '6rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 3rem', background: bg }}>
      <div className="card" style={{ padding: '3rem', maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgb(234,243,222)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <CheckCircle style={{ width: '2rem', height: '2rem', color: 'rgb(59,109,17)' }} />
        </div>
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: textPrimary, marginBottom: '0.75rem' }}>
          Session Booked & Paid! 🎓
        </h2>
        <p style={{ color: textSecondary, lineHeight: 1.7 }}>
          Payment successful! Your tutor will confirm within 24 hours and send a Google Meet link.
        </p>
      </div>
    </div>
  )

  return (
    <div className={isDark ? 'student-dark' : ''} style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem', background: bg }}>
      <div style={{ maxWidth: '44rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Tutor card */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', fontWeight: 700, flexShrink: 0 }}>
            {tutor.display_name?.[0] ?? '?'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.125rem', color: textPrimary }}>{tutor.display_name}</p>
            <p style={{ fontSize: '0.875rem', color: textSecondary }}>{tutor.subjects?.join(', ')}</p>
            {tutor.rating > 0 && <p style={{ fontSize: '0.875rem', color: 'rgb(180,120,10)' }}>⭐ {tutor.rating} ({tutor.total_reviews} reviews)</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: 'rgb(34,85,14)' }}>${baseRate}/hr</p>
            {isPremium && <p style={{ fontSize: '0.75rem', color: 'rgb(34,85,14)' }}>Premium rate ⚡</p>}
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid rgba(34,85,14,0.08)' }}>
          {[{ id: 'details', label: '1. Session Details' }, { id: 'payment', label: '2. Payment' }].map(s => (
            <div key={s.id} style={{ flex: 1, padding: '0.625rem 1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: step === s.id ? 700 : 400, color: step === s.id ? 'rgb(34,85,14)' : 'rgb(107,107,88)', borderBottom: step === s.id ? '2px solid rgb(34,85,14)' : '2px solid transparent', marginBottom: '-2px' }}>
              {s.label}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {error && (
            <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />{error}
            </div>
          )}

          {step === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: textPrimary }}>Session Details</h1>

              {/* Continuing */}
              <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.02)', border: '1px solid rgba(34,85,14,0.08)', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                <input type="checkbox" checked={wantsContinuing} onChange={e => setWantsContinuing(e.target.checked)}
                  style={{ width: '1.125rem', height: '1.125rem', accentColor: 'rgb(34,85,14)', flexShrink: 0, marginTop: '0.125rem', cursor: 'pointer' }} />
                <div onClick={() => setWantsContinuing(!wantsContinuing)} style={{ cursor: 'pointer' }}>
                  <p style={{ fontWeight: 600, color: textPrimary, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>🔁 Interested in ongoing sessions</p>
                  <p style={{ fontSize: '0.8125rem', color: textSecondary, lineHeight: 1.6 }}>Let the tutor know you want regular sessions.</p>
                </div>
              </div>

              <div>
                <label className="label">Subject *</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} className="input">
                  {tutor.subjects?.map((s: string) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Grade Level *</label>
                  <select value={grade} onChange={e => setGrade(e.target.value)} className="input">
                    <option value="K-5">K–5 (Elementary)</option>
                    <option value="6-8">6–8 (Middle School)</option>
                    <option value="9-10">9–10 (High School)</option>
                    <option value="11-12">11–12 (High School)</option>
                    <option value="college">College / University</option>
                  </select>
                </div>
                <div>
                  <label className="label">Language *</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="input">
                    {tutor.languages?.map((l: string) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">What do you need help with? *</label>
                <textarea value={topic} onChange={e => setTopic(e.target.value)} className="input" rows={3} style={{ resize: 'vertical' }}
                  placeholder="e.g. I'm struggling with quadratic equations..." />
              </div>

              <div>
                <label className="label">Session Length *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                  {SESSION_LENGTHS.map(sl => {
                    const price = sl.value === 30 ? baseRate / 2 : sl.value === 90 ? (isPremium ? 54.99 : 69.99) : baseRate
                    const expFee = express.fee * (sl.value === 30 ? 0.5 : sl.value === 90 ? 1.5 : 1)
                    return (
                      <button key={sl.value} type="button" onClick={() => setSessionLength(sl.value)}
                        style={{ padding: '0.875rem 0.5rem', borderRadius: '0.75rem', border: `2px solid ${sessionLength === sl.value ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)'}`, background: sessionLength === sl.value ? 'rgba(34,85,14,0.06)' : cardBg, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: sessionLength === sl.value ? 'rgb(34,85,14)' : 'rgb(26,26,20)', marginBottom: '0.25rem' }}>{sl.label}</p>
                        <p style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>{sl.desc}</p>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'rgb(34,85,14)' }}>${(price + expFee).toFixed(2)}</p>
                        {expFee > 0 && <p style={{ fontSize: '0.6875rem', color: tierStyle.color }}>+${expFee.toFixed(2)} express</p>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date & time */}
              <div>
                <label className="label">Date & Time *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} className="input" />
                  <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="input" />
                </div>
                {selectedDate && selectedTime && (
                  <div style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', background: tierStyle.bg, border: `1px solid ${tierStyle.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: express.tier !== 'standard' ? '0.375rem' : 0 }}>
                      <span>{tierStyle.icon}</span>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: tierStyle.color }}>{express.label}</p>
                    </div>
                    {express.tier !== 'standard' && (
                      <p style={{ fontSize: '0.8125rem', color: tierStyle.color, marginLeft: '1.5rem' }}>+${expressFeeForLength.toFixed(2)} express surcharge added</p>
                    )}
                  </div>
                )}
                {(!selectedDate || !selectedTime) && (
                  <div style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(232,160,32,0.04)', border: '1px solid rgba(232,160,32,0.15)' }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgb(180,120,10)', marginBottom: '0.5rem' }}>⚡ Express pricing:</p>
                    {[
                      { label: '24+ hours notice', fee: 'No extra charge', color: 'rgb(34,85,14)' },
                      { label: '12–24 hours notice', fee: '+$15', color: 'rgb(180,120,10)' },
                      { label: '6–12 hours notice', fee: '+$25', color: 'rgb(200,75,20)' },
                      { label: 'Under 6 hours', fee: '+$40', color: 'rgb(163,45,45)' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8125rem', color: textSecondary }}>{item.label}</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: item.color }}>{item.fee}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {availability.length > 0 && (
                <div>
                  <div style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.1)', marginBottom: '0.5rem' }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgb(34,85,14)', marginBottom: '0.375rem' }}>Tutor availability:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {availability.map((a: any, i: number) => (
                        <span key={i} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.08)', color: 'rgb(34,85,14)' }}>
                          {DAYS[a.day_of_week]} {a.start_time}–{a.end_time}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '0.875rem', background: 'rgba(234,179,8,0.08)', border: '1.5px solid rgba(234,179,8,0.3)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ flexShrink: 0 }}>⚠️</span>
                    <p style={{ fontSize: '0.8125rem', color: 'rgb(133,100,0)', lineHeight: 1.5 }}>
                      Sessions requested outside these hours may be declined. Your payment will be automatically refunded if declined.
                    </p>
                  </div>
                </div>
              )}

              {/* File upload */}
              <div>
                <label className="label">Upload files for your tutor <span style={{ fontWeight: 400, color: textSecondary, fontSize: '0.8125rem' }}>(optional)</span></label>
                {uploadedFiles.length < 5 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '0.75rem', border: '2px dashed rgba(34,85,14,0.2)', cursor: 'pointer', background: 'rgba(34,85,14,0.02)', marginBottom: '0.75rem' }}>
                    <Upload style={{ width: '1.25rem', height: '1.25rem', color: textSecondary, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary, marginBottom: '0.125rem' }}>Click to upload files</p>
                      <p style={{ fontSize: '0.75rem', color: textSecondary }}>Any file type up to 20MB</p>
                    </div>
                    <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileAdd} />
                  </label>
                )}
                {uploadError && <p style={{ fontSize: '0.8125rem', color: 'rgb(163,45,45)', marginBottom: '0.5rem' }}>{uploadError}</p>}
                {uploadedFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.04)', border: '1px solid rgba(34,85,14,0.15)', marginBottom: '0.5rem' }}>
                    <FileUp style={{ width: '1rem', height: '1rem', color: 'rgb(34,85,14)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: textPrimary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <span style={{ fontSize: '0.75rem', color: textSecondary }}>{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                    <button type="button" onClick={() => removeFile(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textSecondary, display: 'flex', padding: '0.25rem' }}>
                      <X style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="label">Additional notes <span style={{ fontWeight: 400, color: textSecondary, fontSize: '0.8125rem' }}>(optional)</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} className="input" rows={2} style={{ resize: 'vertical' }}
                  placeholder="Anything else the tutor should know..." />
              </div>

              {/* Price summary */}
              <div style={{ padding: '1.25rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.04)', border: '1px solid rgba(34,85,14,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9375rem', color: textSecondary }}>Session ({sessionLength} min)</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: textPrimary }}>${baseSessionPrice.toFixed(2)}</span>
                </div>
                {expressFeeForLength > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: tierStyle.color, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Zap style={{ width: '0.875rem', height: '0.875rem' }} /> Express surcharge
                    </span>
                    <span style={{ fontSize: '0.875rem', color: tierStyle.color, fontWeight: 700 }}>+${expressFeeForLength.toFixed(2)}</span>
                  </div>
                )}
                {isPremium && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'rgb(34,85,14)' }}>Premium discount ⚡</span>
                    <span style={{ fontSize: '0.875rem', color: 'rgb(34,85,14)', fontWeight: 600 }}>-$15.00/hr</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid rgba(34,85,14,0.1)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: textPrimary }}>Total</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: 'rgb(34,85,14)' }}>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⭐</span>
                <p style={{ fontSize: '0.8125rem', color: 'rgb(34,85,14)', fontWeight: 600 }}>
                  Complete this session to earn +{sessionLength === 30 ? 50 : sessionLength === 90 ? 150 : 100} XP!
                </p>
              </div>

              {/* Recording consent */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', borderRadius: '0.875rem', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.15)' }}>
                <input type="checkbox" checked={agreedToRecording} onChange={e => setAgreedToRecording(e.target.checked)}
                  style={{ width: '1.125rem', height: '1.125rem', accentColor: 'rgb(34,85,14)', flexShrink: 0, marginTop: '0.125rem', cursor: 'pointer' }} />
                <label style={{ fontSize: '0.8125rem', color: textSecondary, lineHeight: 1.6, cursor: 'pointer' }} onClick={() => setAgreedToRecording(!agreedToRecording)}>
                  📹 I consent to this session being recorded for quality assurance and dispute resolution.
                </label>
              </div>

              <button onClick={handleContinueToPayment} disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.0625rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.875rem', background: express.tier === 'emergency' ? 'rgb(163,45,45)' : express.tier === 'urgent' ? 'rgb(200,75,20)' : 'rgb(34,85,14)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                {loading ? 'Processing...' : `Continue to Payment — $${totalPrice.toFixed(2)} →`}
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: textPrimary }}>Payment</h1>

              <div style={{ padding: '1.25rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.04)', border: '1px solid rgba(34,85,14,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <span style={{ color: textSecondary }}>{subject} with {tutor.display_name}</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: 'rgb(34,85,14)' }}>${totalPrice.toFixed(2)}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: textSecondary }}>{sessionLength} min · {new Date(`${selectedDate}T${selectedTime}`).toLocaleString()}</p>
              </div>

              <div>
                <label className="label">Card Details *</label>
                <div style={{ padding: '0.875rem 1rem', borderRadius: '0.75rem', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(34,85,14,0.2)'}`, background: cardBg }}>
                  <CardElement options={{
                    style: {
                      base: { fontSize: '16px', color: isDark ? '#ffffff' : 'rgb(26,26,20)', '::placeholder': { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgb(107,107,88)' } },
                      invalid: { color: 'rgb(163,45,45)' },
                    },
                  }} />
                </div>
              </div>

              <div style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)' }}>
                <p style={{ fontSize: '0.8125rem', color: textSecondary, lineHeight: 1.6 }}>
                  🔒 Secured by Stripe. Your card details are never stored on our servers. Full refund if tutor doesn't show.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setStep('details')}
                  style={{ flex: 1, padding: '0.875rem', borderRadius: '0.875rem', border: '1.5px solid rgba(34,85,14,0.2)', background: cardBg, color: textSecondary, fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}>
                  ← Back
                </button>
                <button onClick={handlePayAndBook} disabled={loading || !stripe}
                  style={{ flex: 2, padding: '0.875rem', borderRadius: '0.875rem', background: 'rgb(34,85,14)', border: 'none', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {loading ? 'Processing payment...' : `💳 Pay $${totalPrice.toFixed(2)} & Book`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BookingClient({ profile, tutor, availability }: Props) {
  return (
    <Elements stripe={stripePromise}>
      <BookingForm profile={profile} tutor={tutor} availability={availability} />
    </Elements>
  )
}
