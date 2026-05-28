'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  profile: any
  session: any
  existingReview: any
}

export default function SessionClient({ profile, session, existingReview }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [disputeReason, setDisputeReason, ] = useState('')
  const [showDispute, setShowDispute] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [submittingDispute, setSubmittingDispute] = useState(false)
  const [reviewDone, setReviewDone] = useState(!!existingReview)
  const [error, setError] = useState('')

  const tutor = session.tutor_profiles
  const isCompleted = session.status === 'completed'
  const isConfirmed = session.status === 'confirmed'
  const isPending = session.status === 'pending'
  const isDisputed = session.status === 'disputed'

  async function submitReview() {
    if (rating === 0) { setError('Please select a rating.'); return }
    setSubmittingReview(true)
    try {
      const res = await fetch('/api/tutoring/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, tutorId: session.tutor_id, rating, comment }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReviewDone(true)
    } catch (err: any) { setError(err.message) }
    setSubmittingReview(false)
  }

  async function submitDispute() {
    if (!disputeReason.trim()) { setError('Please describe the issue.'); return }
    setSubmittingDispute(true)
    try {
      const res = await fetch('/api/tutoring/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, reason: disputeReason }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      router.refresh()
    } catch (err: any) { setError(err.message) }
    setSubmittingDispute(false)
  }

  const statusColor = isCompleted ? 'rgb(34,85,14)' : isConfirmed ? 'rgb(37,99,235)' : isDisputed ? 'rgb(163,45,45)' : 'rgb(180,120,10)'
  const statusBg = isCompleted ? 'rgba(34,85,14,0.08)' : isConfirmed ? 'rgba(37,99,235,0.08)' : isDisputed ? 'rgba(163,45,45,0.08)' : 'rgba(232,160,32,0.1)'

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'40rem', margin:'0 auto', padding:'2rem 1.5rem' }}>

        <Link href="/tutoring/sessions" style={{ fontSize:'0.875rem', color:'rgb(34,85,14)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'0.375rem', marginBottom:'1.5rem' }}>
          ← Back to sessions
        </Link>

        {/* Session card */}
        <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
            <div>
              <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.375rem' }}>
                {session.subject}
              </h1>
              <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>with {tutor?.display_name}</p>
            </div>
            <span style={{ fontSize:'0.8125rem', fontWeight:700, padding:'0.375rem 0.875rem', borderRadius:'9999px', background:statusBg, color:statusColor }}>
              {session.status}
            </span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
            {[
              { label:'Date & Time', value:new Date(session.scheduled_at).toLocaleString() },
              { label:'Duration', value:session.session_length + ' minutes' },
              { label:'Amount Paid', value:'$' + session.student_price },
              { label:'Language', value:session.language ?? 'English' },
            ].map(item => (
              <div key={item.label}>
                <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.25rem' }}>{item.label}</p>
                <p style={{ fontSize:'0.9375rem', fontWeight:600, color:'rgb(26,26,20)' }}>{item.value}</p>
              </div>
            ))}
          </div>

          {session.topic && (
            <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.03)', border:'1px solid rgba(34,85,14,0.08)', marginBottom:'1.25rem' }}>
              <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.375rem' }}>Topic</p>
              <p style={{ fontSize:'0.9375rem', color:'rgb(26,26,20)', lineHeight:1.6 }}>{session.topic}</p>
            </div>
          )}

          {session.meet_link && (isConfirmed || isCompleted) && (
            <a href={session.meet_link} target="_blank"
              className="btn-primary" style={{ display:'flex', justifyContent:'center', textDecoration:'none', marginBottom:'1rem' }}>
              🎥 Join Google Meet
            </a>
          )}

          {isPending && (
            <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'rgba(232,160,32,0.08)', border:'1px solid rgba(232,160,32,0.2)', textAlign:'center' }}>
              <p style={{ fontSize:'0.9375rem', color:'rgb(180,120,10)', fontWeight:600 }}>
                ⏳ Waiting for tutor to confirm and send Google Meet link
              </p>
            </div>
          )}
        </div>

        {/* Review section */}
        {isCompleted && (
          <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1rem' }}>
              {reviewDone ? '⭐ Your Review' : 'Leave a Review'}
            </h2>

            {error && (
              <div className="alert-error" style={{ marginBottom:'1rem' }}>
                <AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />
                {error}
              </div>
            )}

            {reviewDone ? (
              <div>
                <div style={{ display:'flex', gap:'0.25rem', marginBottom:'0.75rem' }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize:'1.5rem' }}>{s <= rating ? '⭐' : '☆'}</span>
                  ))}
                </div>
                {comment && <p style={{ fontSize:'0.9375rem', color:'rgb(26,26,20)', lineHeight:1.7 }}>{comment}</p>}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div>
                  <label className="label">Rating *</label>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setRating(s)}
                        style={{ fontSize:'2rem', background:'transparent', border:'none', cursor:'pointer', transition:'transform 0.1s', transform: s <= rating ? 'scale(1.1)' : 'scale(1)' }}>
                        {s <= rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Comment <span style={{ fontWeight:400, color:'rgb(107,107,88)', fontSize:'0.8125rem' }}>(optional)</span></label>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} className="input" rows={3} style={{ resize:'vertical' }}
                    placeholder="How was your session? What did you learn?" />
                </div>
                <button onClick={submitReview} disabled={submittingReview} className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dispute section */}
        {(isCompleted || isConfirmed) && !isDisputed && !session.dispute_filed && (
          <div className="card" style={{ padding:'1.5rem' }}>
            {!showDispute ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem' }}>
                <div>
                  <p style={{ fontWeight:600, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>Something went wrong?</p>
                  <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>File a dispute within 48 hours of your session</p>
                </div>
                <button onClick={() => setShowDispute(true)} style={{ padding:'0.5rem 1rem', borderRadius:'0.75rem', background:'rgba(163,45,45,0.06)', border:'1.5px solid rgba(163,45,45,0.2)', color:'rgb(163,45,45)', fontWeight:600, fontSize:'0.875rem', cursor:'pointer' }}>
                  File Dispute
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <h3 style={{ fontFamily:'Fraunces, Georgia, serif', fontWeight:700, color:'rgb(26,26,20)' }}>File a Dispute</h3>
                <div style={{ padding:'0.875rem', borderRadius:'0.875rem', background:'rgba(163,45,45,0.04)', border:'1px solid rgba(163,45,45,0.15)' }}>
                  <p style={{ fontSize:'0.8125rem', color:'rgb(163,45,45)', lineHeight:1.7 }}>
                    Disputes are reviewed within 3-5 business days. The session recording will be reviewed by our team. Please describe the issue clearly and honestly.
                  </p>
                </div>
                <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="input" rows={4} style={{ resize:'vertical' }}
                  placeholder="Describe what went wrong. e.g. tutor didn't show up, was unprepared, was rude, etc." />
                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <button onClick={() => setShowDispute(false)} className="btn-secondary" style={{ flex:1, justifyContent:'center' }}>Cancel</button>
                  <button onClick={submitDispute} disabled={submittingDispute} style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', padding:'0.75rem', borderRadius:'0.875rem', background:'rgba(163,45,45,0.08)', border:'2px solid rgba(163,45,45,0.3)', color:'rgb(163,45,45)', fontWeight:700, cursor:'pointer', fontSize:'0.9375rem' }}>
                    {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isDisputed && (
          <div style={{ padding:'1.25rem', borderRadius:'0.875rem', background:'rgba(163,45,45,0.06)', border:'1px solid rgba(163,45,45,0.2)' }}>
            <p style={{ fontWeight:700, color:'rgb(163,45,45)', marginBottom:'0.375rem' }}>⚠️ Dispute Filed</p>
            <p style={{ fontSize:'0.875rem', color:'rgb(163,45,45)' }}>Our team is reviewing your dispute. We'll get back to you within 3-5 business days.</p>
          </div>
        )}
      </div>
    </div>
  )
}
