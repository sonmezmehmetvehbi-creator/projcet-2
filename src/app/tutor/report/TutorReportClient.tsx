'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'

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

const INDIGO = 'rgb(99,102,241)'
const PURPLE = 'rgb(139,92,246)'
const TEXT1 = 'white'
const TEXT2 = 'rgba(255,255,255,0.6)'
const SUCCESS = 'rgb(74,222,128)'
const ERROR = 'rgb(248,113,113)'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 0.875rem', borderRadius: '0.75rem',
  border: '1.5px solid rgba(99,102,241,0.25)', background: 'rgba(255,255,255,0.06)', color: TEXT1,
  fontSize: '0.9375rem', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark',
}
const label: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }

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
    <div className="tr-fade" style={{ paddingTop: '5rem', minHeight: '100vh' }}>
      <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle style={{ width: '1.25rem', height: '1.25rem', color: ERROR }} />
          </div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: TEXT1 }}>Report a Student</h1>
        </div>
        <p style={{ color: TEXT2, marginBottom: '2rem', lineHeight: 1.6 }}>Reports are reviewed within 48 hours. False reports may result in account action.</p>

        {done ? (
          <div className="tr-pop-card" style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '1rem' }}>
            <div className="tr-pop" style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <CheckCircle style={{ width: '1.75rem', height: '1.75rem', color: SUCCESS }} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: TEXT1, marginBottom: '0.5rem' }}>Report submitted</h2>
            <p style={{ color: TEXT2, lineHeight: 1.6 }}>Your report has been received and will be reviewed within 48 hours. We've emailed you a confirmation.</p>
          </div>
        ) : (
          <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '1rem' }}>
            {error && (
              <div className="tr-err" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: ERROR, fontSize: '0.875rem', fontWeight: 600 }}>
                <X style={{ width: '1rem', height: '1rem', flexShrink: 0 }} /> {error}
              </div>
            )}

            <div>
              <label style={label}>Session <span style={{ fontWeight: 400, color: TEXT2 }}>(optional)</span></label>
              <select value={sessionId} onChange={e => setSessionId(e.target.value)} className="tr-select" style={inputStyle}>
                <option value="">Select a session…</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.studentName} — {new Date(s.scheduled_at).toLocaleDateString()} ({s.subject})</option>
                ))}
              </select>
              {sessions.length === 0 && <p style={{ fontSize: '0.75rem', color: TEXT2, marginTop: '0.375rem' }}>You have no confirmed or completed sessions yet.</p>}
            </div>

            <div>
              <label style={label}>Complaint type *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {COMPLAINT_TYPES.map(t => {
                  const active = complaintType === t
                  return (
                    <button key={t} type="button" onClick={() => setComplaintType(t)} className="tr-pill"
                      style={{ padding: '0.5rem 1rem', borderRadius: '9999px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: active ? 700 : 500, transition: 'transform 0.15s, background 0.15s, border-color 0.15s', border: `1.5px solid ${active ? INDIGO : 'rgba(99,102,241,0.4)'}`, background: active ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.1)', color: active ? 'white' : 'rgba(255,255,255,0.55)' }}>
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={label}>Description * <span style={{ fontWeight: 400, color: TEXT2 }}>(min 50 characters)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6}
                placeholder="Describe what happened in as much detail as possible…"
                className="tr-textarea" style={{ ...inputStyle, resize: 'vertical' }} />
              <p style={{ fontSize: '0.75rem', color: description.trim().length < 50 ? TEXT2 : SUCCESS, marginTop: '0.375rem', textAlign: 'right' }}>
                {description.trim().length}/50 characters
              </p>
            </div>

            <button onClick={submit} disabled={submitting} className="tr-cta">
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes trFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes trErr { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes trPop { 0% { opacity: 0; transform: scale(0.6); } 60% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
        .tr-fade { animation: trFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .tr-err { animation: trErr 0.3s ease both; }
        .tr-pop { animation: trPop 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .tr-select:focus, .tr-textarea:focus { border-color: rgba(99,102,241,0.6) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .tr-select option { background: rgb(20,20,35); color: white; }
        .tr-textarea::placeholder { color: rgba(255,255,255,0.35); }
        .tr-pill:active { transform: scale(0.95); }
        .tr-cta {
          padding: 0.875rem 1.5rem; border-radius: 0.75rem; border: none; color: white; font-weight: 700; font-size: 0.9375rem; cursor: pointer;
          background: linear-gradient(135deg, ${INDIGO}, ${PURPLE}); transition: filter 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .tr-cta:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
        .tr-cta:disabled { cursor: wait; opacity: 0.7; }
      `}</style>
    </div>
  )
}
