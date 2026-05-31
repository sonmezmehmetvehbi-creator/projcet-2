'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props { appeals: any[] }

export default function AdminAppealsClient({ appeals: initialAppeals }: Props) {
  const [appeals, setAppeals] = useState(initialAppeals)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = appeals.filter(a => filter === 'all' ? true : a.status === filter)

  async function handleDecision(appeal: any, decision: 'approved' | 'rejected') {
    const isFinalRejection = decision === 'rejected'
    if (!confirm(`${decision === 'approved' ? 'APPROVE' : 'REJECT'} this appeal${isFinalRejection ? ' (FINAL decision)' : ''}?`)) return
    setLoading(appeal.id)
    try {
      const res = await fetch('/api/admin/appeal-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appealId: appeal.id, decision, email: appeal.email, name: appeal.name, note }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAppeals(prev => prev.map(a => a.id === appeal.id ? { ...a, status: decision } : a))
      setSelected(null)
      setNote('')
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoading(null)
  }

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.25rem' }}>Tutor Appeals</h1>
            <p style={{ color: 'rgb(107,107,88)' }}>{appeals.filter(a => a.status === 'pending').length} pending review</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: `1.5px solid ${filter === f ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.2)'}`, background: filter === f ? 'rgba(34,85,14,0.08)' : 'white', color: filter === f ? 'rgb(34,85,14)' : 'rgb(107,107,88)', fontWeight: filter === f ? 600 : 400, fontSize: '0.875rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                {f} ({appeals.filter(a => f === 'all' ? true : a.status === f).length})
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'rgb(107,107,88)' }}>
            No {filter} appeals 🎉
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(appeal => (
            <div key={appeal.id} className="card" style={{ padding: '1.5rem', border: appeal.status === 'pending' ? '2px solid rgba(232,160,32,0.2)' : '1px solid rgba(34,85,14,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'rgb(26,26,20)' }}>{appeal.name}</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.625rem', borderRadius: '9999px',
                      background: appeal.status === 'approved' ? 'rgba(34,85,14,0.08)' : appeal.status === 'rejected' ? 'rgba(163,45,45,0.08)' : 'rgba(232,160,32,0.1)',
                      color: appeal.status === 'approved' ? 'rgb(34,85,14)' : appeal.status === 'rejected' ? 'rgb(163,45,45)' : 'rgb(180,120,10)' }}>
                      {appeal.status === 'approved' ? '✅' : appeal.status === 'rejected' ? '❌' : '⏳'} {appeal.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'rgb(107,107,88)', marginBottom: '0.5rem' }}>{appeal.email}</p>
                  <p style={{ fontSize: '0.875rem', color: 'rgb(107,107,88)' }}>📅 {new Date(appeal.created_at).toLocaleDateString()}</p>
                </div>
                {appeal.status === 'pending' && (
                  <button onClick={() => setSelected(selected === appeal.id ? null : appeal.id)}
                    className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                    {selected === appeal.id ? 'Collapse' : 'Review'}
                  </button>
                )}
              </div>

              {selected === appeal.id && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(34,85,14,0.08)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Reason for Appeal</p>
                      <p style={{ fontSize: '0.9375rem', color: 'rgb(26,26,20)', lineHeight: 1.7 }}>{appeal.reason}</p>
                    </div>
                    {appeal.additional && (
                      <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Additional Information</p>
                        <p style={{ fontSize: '0.9375rem', color: 'rgb(26,26,20)', lineHeight: 1.7 }}>{appeal.additional}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '1.25rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.02)', border: '1px solid rgba(34,85,14,0.1)', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.75rem' }}>⚠️ This is the applicant's final appeal. Your decision is permanent.</p>
                    <label className="label">Note to applicant <span style={{ fontWeight: 400, color: 'rgb(107,107,88)' }}>(optional)</span></label>
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                      className="input" rows={3} style={{ resize: 'vertical' }}
                      placeholder="Explain your decision to the applicant..." />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={() => handleDecision(appeal, 'approved')} disabled={loading === appeal.id}
                      style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '0.875rem', background: 'rgb(34,85,14)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>
                      <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                      {loading === appeal.id ? 'Processing...' : '✅ Approve Appeal'}
                    </button>
                    <button onClick={() => handleDecision(appeal, 'rejected')} disabled={loading === appeal.id}
                      style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.08)', border: '2px solid rgba(163,45,45,0.3)', color: 'rgb(163,45,45)', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>
                      <XCircle style={{ width: '1rem', height: '1rem' }} />
                      {loading === appeal.id ? 'Processing...' : '❌ Final Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
