'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  applications: any[]
}

export default function AdminTutorsClient({ applications: initialApps }: Props) {
  const [applications, setApplications] = useState(initialApps)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const filtered = applications.filter(a => filter === 'all' ? true : a.status === filter)

  async function verifyCredentials(id: string) {
    setLoading(id)
    try {
      const res = await fetch('/api/admin/tutor-verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId: id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setApplications(prev => prev.map(a => a.id === id ? { ...a, credential_verified: true } : a))
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoading(null)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected', userId: string, email: string, name: string) {
    if (!confirm(`Are you sure you want to ${status === 'approved' ? 'APPROVE' : 'REJECT'} ${name}?`)) return
    setLoading(id)
    try {
      const res = await fetch('/api/admin/tutor-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorProfileId: id, status, userId, email, name, note }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      setSelected(null)
      setNote('')
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoading(null)
  }

  const statusColor = (s: string) => s === 'approved' ? 'rgb(34,85,14)' : s === 'rejected' ? 'rgb(163,45,45)' : 'rgb(180,120,10)'
  const statusBg = (s: string) => s === 'approved' ? 'rgba(34,85,14,0.08)' : s === 'rejected' ? 'rgba(163,45,45,0.08)' : 'rgba(232,160,32,0.1)'
  const statusEmoji = (s: string) => s === 'approved' ? '✅' : s === 'rejected' ? '❌' : '⏳'

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.25rem' }}>
              Tutor Applications
            </h1>
            <p style={{ color: 'rgb(107,107,88)' }}>{applications.filter(a => a.status === 'pending').length} pending review</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: `1.5px solid ${filter === f ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.2)'}`, background: filter === f ? 'rgba(34,85,14,0.08)' : 'white', color: filter === f ? 'rgb(34,85,14)' : 'rgb(107,107,88)', fontWeight: filter === f ? 600 : 400, fontSize: '0.875rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                {f} ({applications.filter(a => f === 'all' ? true : a.status === f).length})
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'rgb(107,107,88)' }}>
            No {filter} applications 🎉
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(app => (
            <div key={app.id} className="card" style={{ padding: '1.5rem', border: app.status === 'pending' ? '2px solid rgba(232,160,32,0.2)' : '1px solid rgba(34,85,14,0.08)' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'rgb(26,26,20)' }}>
                      {app.display_name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.625rem', borderRadius: '9999px', background: statusBg(app.status), color: statusColor(app.status) }}>
                      {statusEmoji(app.status)} {app.status}
                    </span>
                    {app.credential_verified && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '9999px', background: 'rgb(37,99,235)', color: 'white' }}>
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'rgb(107,107,88)', marginBottom: '0.5rem' }}>{app.profiles?.email}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                    {app.subjects?.map((s: string) => (
                      <span key={s} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', color: 'rgb(34,85,14)', fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'rgb(107,107,88)', flexWrap: 'wrap' }}>
                    <span>🌐 {app.languages?.join(', ')}</span>
                    <span>📅 {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {app.status === 'approved' && !app.credential_verified && (
                    <button onClick={() => verifyCredentials(app.id)} disabled={loading === app.id}
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', background: 'rgb(37,99,235)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                      {loading === app.id ? '…' : '✓ Verify Credentials'}
                    </button>
                  )}
                  <button onClick={() => setSelected(selected === app.id ? null : app.id)}
                    className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {selected === app.id ? <ChevronUp style={{ width: '0.875rem', height: '0.875rem' }} /> : <ChevronDown style={{ width: '0.875rem', height: '0.875rem' }} />}
                    {selected === app.id ? 'Collapse' : 'Review All Info'}
                  </button>
                </div>
              </div>

              {/* Expanded panel */}
              {selected === app.id && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(34,85,14,0.08)' }}>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

                    {/* Personal Info */}
                    <div style={{ padding: '1.25rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgb(34,85,14)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>👤 Personal Info</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                          { label: 'Full Name', value: app.display_name },
                          { label: 'Email', value: app.profiles?.email },
                          { label: 'Languages', value: app.languages?.join(', ') },
                          { label: 'Bio', value: app.bio },
                        { label: 'LinkedIn', value: app.linkedin_url },
                        ].map(item => item.value && (
                          <div key={item.label}>
                            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                            <p style={{ fontSize: '0.875rem', color: 'rgb(26,26,20)', lineHeight: 1.6 }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Qualifications */}
                    <div style={{ padding: '1.25rem', borderRadius: '0.875rem', background: 'rgba(37,99,235,0.03)', border: '1px solid rgba(37,99,235,0.1)' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgb(37,99,235)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>🎓 Qualifications</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subjects</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                            {app.subjects?.map((s: string) => (
                              <span key={s} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(37,99,235,0.08)', color: 'rgb(37,99,235)', fontWeight: 600 }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hourly Rate</p>
                          <p style={{ fontSize: '0.875rem', color: 'rgb(26,26,20)' }}>${app.hourly_rate}/hr</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applied</p>
                          <p style={{ fontSize: '0.875rem', color: 'rgb(26,26,20)' }}>{new Date(app.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div style={{ padding: '1.25rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgb(34,85,14)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>💰 Payment Info</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                          { label: 'Venmo', value: app.venmo },
                          { label: 'PayPal', value: app.paypal },
                          { label: 'Zelle', value: app.zelle },
                        ].map(item => item.value && (
                          <div key={item.label}>
                            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                            <p style={{ fontSize: '0.875rem', color: 'rgb(26,26,20)' }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Documents */}
                    <div style={{ padding: '1.25rem', borderRadius: '0.875rem', background: 'rgba(180,120,10,0.03)', border: '1px solid rgba(180,120,10,0.15)' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgb(180,120,10)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>📎 Documents</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {app.cv_url && (
                          <a href={app.cv_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'white', border: '1px solid rgba(180,120,10,0.2)', color: 'rgb(180,120,10)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                            📄 View CV / Resume
                          </a>
                        )}
                        {app.certificate_url && (
                          <a href={app.certificate_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'white', border: '1px solid rgba(180,120,10,0.2)', color: 'rgb(180,120,10)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                            🏅 View Certificate
                          </a>
                        )}
                        {app.cv_url && (
                          <a href={app.cv_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'white', border: '1px solid rgba(180,120,10,0.2)', color: 'rgb(180,120,10)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                            🎥 View Intro Video
                          </a>
                        )}
                        {app.id_verified !== undefined && (
                          <div style={{ padding: '0.5rem 0.875rem', borderRadius: '0.625rem', background: app.id_verified ? 'rgba(34,85,14,0.06)' : 'rgba(163,45,45,0.06)', border: `1px solid ${app.id_verified ? 'rgba(34,85,14,0.2)' : 'rgba(163,45,45,0.2)'}` }}>
                            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: app.id_verified ? 'rgb(34,85,14)' : 'rgb(163,45,45)' }}>
                              {app.id_verified ? '✅ ID Verified' : '⚠️ ID Not Verified'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Decision */}
                  {app.status === 'pending' && (
                    <div style={{ padding: '1.5rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.02)', border: '1px solid rgba(34,85,14,0.1)' }}>
                      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '1rem', fontSize: '1rem' }}>
                        Make a Decision
                      </p>
                      <div>
                        <label className="label">Note to tutor <span style={{ fontWeight: 400, color: 'rgb(107,107,88)' }}>(optional — included in email)</span></label>
                        <textarea value={note} onChange={e => setNote(e.target.value)}
                          className="input" rows={3} style={{ resize: 'vertical', marginBottom: '1rem' }}
                          placeholder="e.g. Welcome to AceForge! We're excited to have you on board. or We reviewed your application carefully..." />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button onClick={() => updateStatus(app.id, 'approved', app.user_id, app.profiles?.email, app.display_name)}
                          disabled={loading === app.id}
                          style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '0.875rem', background: 'rgb(34,85,14)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                          {loading === app.id ? 'Processing...' : '✅ Approve Application'}
                        </button>
                        <button onClick={() => updateStatus(app.id, 'rejected', app.user_id, app.profiles?.email, app.display_name)}
                          disabled={loading === app.id}
                          style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.08)', border: '2px solid rgba(163,45,45,0.3)', color: 'rgb(163,45,45)', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <XCircle style={{ width: '1rem', height: '1rem' }} />
                          {loading === app.id ? 'Processing...' : '❌ Reject Application'}
                        </button>
                      </div>
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
