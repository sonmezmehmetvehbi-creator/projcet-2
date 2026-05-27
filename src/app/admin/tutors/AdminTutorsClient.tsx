'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react'

interface Props {
  applications: any[]
}

export default function AdminTutorsClient({ applications }: Props) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const filtered = applications.filter(a => filter === 'all' ? true : a.status === filter)

  async function updateStatus(id: string, status: 'approved' | 'rejected', userId: string, email: string, name: string) {
    setLoading(id)
    try {
      const res = await fetch('/api/admin/tutor-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorProfileId: id, status, userId, email, name, note }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      window.location.reload()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoading(null)
  }

  const statusColor = (s: string) => s === 'approved' ? 'rgb(34,85,14)' : s === 'rejected' ? 'rgb(163,45,45)' : 'rgb(180,120,10)'
  const statusBg = (s: string) => s === 'approved' ? 'rgba(34,85,14,0.08)' : s === 'rejected' ? 'rgba(163,45,45,0.08)' : 'rgba(232,160,32,0.1)'
  const statusEmoji = (s: string) => s === 'approved' ? '✅' : s === 'rejected' ? '❌' : '⏳'

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh' }}>
      <div style={{ maxWidth:'72rem', margin:'0 auto', padding:'2rem 1.5rem' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
              Tutor Applications
            </h1>
            <p style={{ color:'rgb(107,107,88)' }}>{applications.filter(a => a.status === 'pending').length} pending review</p>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            {(['all','pending','approved','rejected'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'0.5rem 1rem', borderRadius:'0.75rem', border:`1.5px solid ${filter === f ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.2)'}`, background: filter === f ? 'rgba(34,85,14,0.08)' : 'white', color: filter === f ? 'rgb(34,85,14)' : 'rgb(107,107,88)', fontWeight: filter === f ? 600 : 400, fontSize:'0.875rem', cursor:'pointer', textTransform:'capitalize' }}>
                {f} {f !== 'all' && `(${applications.filter(a => a.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gap:'1rem' }}>
          {filtered.length === 0 && (
            <div className="card" style={{ padding:'3rem', textAlign:'center', color:'rgb(107,107,88)' }}>
              No {filter} applications
            </div>
          )}
          {filtered.map(app => (
            <div key={app.id} className="card" style={{ padding:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem', flexWrap:'wrap' }}>
                    <h3 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.125rem', fontWeight:700, color:'rgb(26,26,20)' }}>
                      {app.display_name}
                    </h3>
                    <span style={{ fontSize:'0.75rem', fontWeight:600, padding:'0.2rem 0.625rem', borderRadius:'9999px', background: statusBg(app.status), color: statusColor(app.status) }}>
                      {statusEmoji(app.status)} {app.status}
                    </span>
                  </div>
                  <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'0.5rem' }}>
                    {app.profiles?.email}
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem', marginBottom:'0.75rem' }}>
                    {app.subjects?.map((s: string) => (
                      <span key={s} style={{ fontSize:'0.75rem', padding:'0.2rem 0.5rem', borderRadius:'9999px', background:'rgba(34,85,14,0.06)', color:'rgb(34,85,14)', fontWeight:600 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:'1rem', fontSize:'0.8125rem', color:'rgb(107,107,88)', flexWrap:'wrap' }}>
                    <span>🌐 {app.languages?.join(', ')}</span>
                    <span>📅 Applied {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', minWidth:'160px' }}>
                  <button onClick={() => setSelected(selected?.id === app.id ? null : app)}
                    className="btn-secondary" style={{ fontSize:'0.875rem', padding:'0.5rem 1rem', justifyContent:'center' }}>
                    <Eye style={{ width:'0.875rem', height:'0.875rem' }} />
                    {selected?.id === app.id ? 'Hide' : 'Review'}
                  </button>
                  {app.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(app.id, 'approved', app.user_id, app.profiles?.email, app.display_name)}
                        disabled={loading === app.id}
                        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', padding:'0.5rem 1rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.08)', border:'1.5px solid rgba(34,85,14,0.3)', color:'rgb(34,85,14)', fontWeight:600, fontSize:'0.875rem', cursor:'pointer', transition:'all 0.2s' }}>
                        <CheckCircle style={{ width:'0.875rem', height:'0.875rem' }} />
                        Approve
                      </button>
                      <button onClick={() => updateStatus(app.id, 'rejected', app.user_id, app.profiles?.email, app.display_name)}
                        disabled={loading === app.id}
                        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', padding:'0.5rem 1rem', borderRadius:'0.75rem', background:'rgba(163,45,45,0.06)', border:'1.5px solid rgba(163,45,45,0.2)', color:'rgb(163,45,45)', fontWeight:600, fontSize:'0.875rem', cursor:'pointer', transition:'all 0.2s' }}>
                        <XCircle style={{ width:'0.875rem', height:'0.875rem' }} />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded review panel */}
              {selected?.id === app.id && (
                <div style={{ marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid rgba(34,85,14,0.08)' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
                    <div>
                      <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.5rem' }}>Bio</p>
                      <p style={{ fontSize:'0.875rem', color:'rgb(26,26,20)', lineHeight:1.7 }}>{app.bio || 'Not provided'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.5rem' }}>Documents</p>
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                        {app.cv_url && <a href={app.cv_url} target="_blank" style={{ fontSize:'0.875rem', color:'rgb(34,85,14)', textDecoration:'none' }}>📄 View CV/Resume</a>}
                        {app.certificate_url && <a href={app.certificate_url} target="_blank" style={{ fontSize:'0.875rem', color:'rgb(34,85,14)', textDecoration:'none' }}>🏅 View Certificate</a>}
                      </div>
                    </div>
                  </div>

                  {app.status === 'pending' && (
                    <div>
                      <label className="label">Note to tutor (optional — included in decision email)</label>
                      <textarea value={note} onChange={e => setNote(e.target.value)}
                        className="input" rows={2} style={{ resize:'vertical', marginBottom:'1rem' }}
                        placeholder="e.g. Welcome to AceForge! or We reviewed your application and..." />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}