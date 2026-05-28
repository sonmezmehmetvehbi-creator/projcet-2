'use client'

import { useState } from 'react'

interface Props {
  disputes: any[]
}

export default function AdminDisputesClient({ disputes }: Props) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending')
  const [resolving, setResolving] = useState<string | null>(null)
  const [resolution, setResolution] = useState<Record<string, string>>({})
  const [note, setNote] = useState<Record<string, string>>({})

  const filtered = disputes.filter(d =>
    filter === 'all' ? true :
    filter === 'pending' ? d.dispute_status === 'pending' :
    d.dispute_status === 'resolved'
  )

  async function resolve(sessionId: string, decision: 'refund' | 'no_refund') {
    setResolving(sessionId)
    try {
      const res = await fetch('/api/admin/resolve-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, decision, note: note[sessionId] ?? '' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      window.location.reload()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setResolving(null)
  }

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh' }}>
      <div style={{ maxWidth:'64rem', margin:'0 auto', padding:'2rem 1.5rem' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
              Disputes
            </h1>
            <p style={{ color:'rgb(107,107,88)' }}>
              {disputes.filter(d => d.dispute_status === 'pending').length} pending review
            </p>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            {(['all','pending','resolved'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'0.5rem 1rem', borderRadius:'0.75rem', border:`1.5px solid ${filter === f ? 'rgb(163,45,45)' : 'rgba(34,85,14,0.2)'}`, background: filter === f ? 'rgba(163,45,45,0.06)' : 'white', color: filter === f ? 'rgb(163,45,45)' : 'rgb(107,107,88)', fontWeight: filter === f ? 600 : 400, fontSize:'0.875rem', cursor:'pointer', textTransform:'capitalize' }}>
                {f} {f !== 'all' && `(${disputes.filter(d => f === 'pending' ? d.dispute_status === 'pending' : d.dispute_status === 'resolved').length})`}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="card" style={{ padding:'3rem', textAlign:'center', color:'rgb(107,107,88)' }}>
            No {filter} disputes 🎉
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {filtered.map(d => (
            <div key={d.id} className="card" style={{ padding:'1.5rem', border: d.dispute_status === 'pending' ? '2px solid rgba(163,45,45,0.2)' : '1px solid rgba(34,85,14,0.08)' }}>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:'1rem', marginBottom:'1.25rem' }}>
                {[
                  { label:'Student', value: d.profiles?.display_name + ' (' + d.profiles?.email + ')' },
                  { label:'Tutor', value: d.tutor_profiles?.display_name },
                  { label:'Subject', value: d.subject },
                  { label:'Session Date', value: new Date(d.scheduled_at).toLocaleString() },
                  { label:'Amount Paid', value: '$' + d.student_price },
                  { label:'Tutor Payout', value: '$' + d.tutor_payout },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize:'0.6875rem', fontWeight:700, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.25rem' }}>{item.label}</p>
                    <p style={{ fontSize:'0.875rem', fontWeight:600, color:'rgb(26,26,20)' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'rgba(163,45,45,0.04)', border:'1px solid rgba(163,45,45,0.12)', marginBottom:'1.25rem' }}>
                <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(163,45,45)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.375rem' }}>
                  Dispute Reason
                </p>
                <p style={{ fontSize:'0.9375rem', color:'rgb(26,26,20)', lineHeight:1.7 }}>{d.dispute_reason}</p>
              </div>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:'0.5rem' }}>
                <span style={{ fontSize:'0.8125rem', fontWeight:700, padding:'0.375rem 0.875rem', borderRadius:'9999px', background: d.dispute_status === 'pending' ? 'rgba(232,160,32,0.1)' : 'rgba(34,85,14,0.08)', color: d.dispute_status === 'pending' ? 'rgb(180,120,10)' : 'rgb(34,85,14)' }}>
                  {d.dispute_status === 'pending' ? '⏳ Pending Review' : '✅ Resolved'}
                </span>
                {d.dispute_resolved_at && (
                  <span style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>
                    Resolved {new Date(d.dispute_resolved_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {d.dispute_status === 'pending' && (
                <div>
                  <label className="label">Note to student (included in resolution email)</label>
                  <textarea
                    value={note[d.id] ?? ''}
                    onChange={e => setNote(prev => ({ ...prev, [d.id]: e.target.value }))}
                    className="input" rows={2} style={{ resize:'vertical', marginBottom:'0.875rem' }}
                    placeholder="Explain your decision to the student..."
                  />
                  <div style={{ display:'flex', gap:'0.75rem' }}>
                    <button
                      onClick={() => resolve(d.id, 'refund')}
                      disabled={resolving === d.id}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', padding:'0.75rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.08)', border:'2px solid rgba(34,85,14,0.3)', color:'rgb(34,85,14)', fontWeight:700, cursor:'pointer', fontSize:'0.9375rem' }}>
                      ✅ Approve Refund
                    </button>
                    <button
                      onClick={() => resolve(d.id, 'no_refund')}
                      disabled={resolving === d.id}
                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', padding:'0.75rem', borderRadius:'0.875rem', background:'rgba(163,45,45,0.06)', border:'2px solid rgba(163,45,45,0.2)', color:'rgb(163,45,45)', fontWeight:700, cursor:'pointer', fontSize:'0.9375rem' }}>
                      ❌ Deny Refund
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
