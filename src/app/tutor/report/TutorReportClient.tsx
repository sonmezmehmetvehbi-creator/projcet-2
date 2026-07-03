'use client'

import { useState } from 'react'

interface SessionOption {
  id: string
  subject: string
  scheduled_at: string
  studentName: string
}

const COMPLAINT_TYPES = [
  'No-show',
  'Rude/Inappropriate behavior',
  'Harassment',
  'False dispute',
  'Payment issues',
  'Other',
]

const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'
const ORANGE = 'rgb(234,88,12)'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 0.875rem', borderRadius: '0.75rem',
  border: '1.5px solid rgba(234,88,12,0.25)', background: 'white', color: INK,
  fontSize: '0.9375rem', boxSizing: 'border-box',
}
const label: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: INK, marginBottom: '0.5rem' }

export default function TutorReportClient({ sessions }: { sessions: SessionOption[] }) {
  const [sessionId, setSessionId] = useState('')
  const [complaintType, setComplaintType] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    setError('')
    if (!complaintType) { setError('Please select a complaint type.'); return }
    if (description.trim().length < 50) { setError('Please provide at least 50 characters of detail.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/tutor/report-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId || null, complaintType, description: description.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit report')
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    }
    setSubmitting(false)
  }

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh' }}>
      <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, marginBottom: '0.25rem' }}>Report a Student</h1>
        <p style={{ color: MUTED, marginBottom: '2rem' }}>Report inappropriate conduct or issues with a student. Our team reviews every report within 48 hours.</p>

        {done ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(34,85,14,0.2)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: 'rgb(34,85,14)', marginBottom: '0.5rem' }}>Report submitted</h2>
            <p style={{ color: MUTED }}>Your report has been received and will be reviewed within 48 hours. We've emailed you a confirmation.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(163,45,45,0.08)', border: '1px solid rgba(163,45,45,0.25)', color: 'rgb(163,45,45)', fontSize: '0.875rem', fontWeight: 600 }}>{error}</div>
            )}

            <div>
              <label style={label}>Session <span style={{ fontWeight: 400, color: MUTED }}>(optional)</span></label>
              <select value={sessionId} onChange={e => setSessionId(e.target.value)} style={inputStyle}>
                <option value="">Select a session…</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.studentName} — {new Date(s.scheduled_at).toLocaleDateString()} ({s.subject})</option>
                ))}
              </select>
              {sessions.length === 0 && <p style={{ fontSize: '0.75rem', color: MUTED, marginTop: '0.375rem' }}>You have no confirmed or completed sessions yet.</p>}
            </div>

            <div>
              <label style={label}>Complaint type *</label>
              <select value={complaintType} onChange={e => setComplaintType(e.target.value)} style={inputStyle}>
                <option value="">Select a type…</option>
                {COMPLAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={label}>Description * <span style={{ fontWeight: 400, color: MUTED }}>(min 50 characters)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6}
                placeholder="Describe what happened in as much detail as possible…"
                style={{ ...inputStyle, resize: 'vertical' }} />
              <p style={{ fontSize: '0.75rem', color: description.trim().length < 50 ? MUTED : 'rgb(34,85,14)', marginTop: '0.375rem' }}>
                {description.trim().length}/50 characters
              </p>
            </div>

            <button onClick={submit} disabled={submitting}
              style={{ padding: '0.875rem 1.5rem', borderRadius: '0.75rem', background: ORANGE, border: 'none', color: 'white', fontWeight: 700, fontSize: '0.9375rem', cursor: submitting ? 'wait' : 'pointer' }}>
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
