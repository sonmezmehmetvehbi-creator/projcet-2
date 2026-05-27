'use client'

import { useState } from 'react'
import { Star, DollarSign, Calendar, Clock, User, Edit, Save, X, Plus } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SUBJECTS = ['SAT Math', 'ACT Math', 'Algebra', 'Geometry', 'Calculus', 'Pre-Calculus', 'Statistics', 'SAT Reading & Writing', 'ACT English']
const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'Europe/London', 'Europe/Paris', 'Asia/Istanbul', 'Asia/Dubai']

interface Props {
  profile: any
  tutorProfile: any
  sessions: any[]
  reviews: any[]
  payouts: any[]
  availability: any[]
}

export default function TutorDashboardClient({ profile, tutorProfile, sessions, reviews, payouts, availability: initialAvailability }: Props) {
  const [tab, setTab] = useState<'overview' | 'sessions' | 'reviews' | 'earnings' | 'profile' | 'availability'>('overview')
  const [editingProfile, setEditingProfile] = useState(false)
  const [bio, setBio] = useState(tutorProfile?.bio ?? '')
  const [subjects, setSubjects] = useState<string[]>(tutorProfile?.subjects ?? [])
  const [hourlyRate, setHourlyRate] = useState(tutorProfile?.hourly_rate ?? 30)
  const [availability, setAvailability] = useState(initialAvailability)
  const [timezone, setTimezone] = useState(initialAvailability[0]?.timezone ?? 'America/New_York')
  const [saving, setSaving] = useState(false)
  const [meetLink, setMeetLink] = useState<Record<string, string>>({})
  const [confirmingSession, setConfirmingSession] = useState<string | null>(null)

  const upcoming = sessions.filter(s => s.status === 'confirmed' && new Date(s.scheduled_at) > new Date())
  const pending = sessions.filter(s => s.status === 'pending')
  const completed = sessions.filter(s => s.status === 'completed')
  const totalEarned = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const pendingPayout = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '—'

  function toggleSubject(sub: string) {
    setSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub])
  }

  function addSlot() {
    setAvailability(prev => [...prev, { id: Date.now().toString(), day_of_week: 1, start_time: '09:00', end_time: '17:00', timezone }])
  }

  function removeSlot(id: string) {
    setAvailability(prev => prev.filter((a: any) => a.id !== id))
  }

  function updateSlot(id: string, field: string, value: any) {
    setAvailability(prev => prev.map((a: any) => a.id === id ? { ...a, [field]: value } : a))
  }

  async function saveProfile() {
    setSaving(true)
    try {
      await fetch('/api/tutor/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, subjects, hourlyRate, availability, timezone, tutorId: tutorProfile.id }),
      })
      setEditingProfile(false)
    } catch {}
    setSaving(false)
  }

  async function confirmSession(sessionId: string) {
    const link = meetLink[sessionId]
    if (!link) { alert('Please enter a Google Meet link first'); return }
    setConfirmingSession(sessionId)
    try {
      await fetch('/api/tutor/confirm-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, meetLink: link }),
      })
      window.location.reload()
    } catch {}
    setConfirmingSession(null)
  }

  async function completeSession(sessionId: string) {
    try {
      await fetch('/api/tutor/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      window.location.reload()
    } catch {}
  }

  const TABS = [
    { id:'overview', label:'Overview' },
    { id:'sessions', label:`Sessions ${pending.length > 0 ? '(' + pending.length + ' pending)' : ''}` },
    { id:'reviews', label:'Reviews' },
    { id:'earnings', label:'Earnings' },
    { id:'availability', label:'Availability' },
    { id:'profile', label:'My Profile' },
  ] as const

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh' }}>
      <div style={{ maxWidth:'72rem', margin:'0 auto', padding:'2rem 1.5rem' }}>

        <div style={{ display:'flex', alignItems:'center', gap:'1.25rem', marginBottom:'2rem', flexWrap:'wrap' }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} style={{ width:'4rem', height:'4rem', borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(34,85,14,0.2)' }} />
          ) : (
            <div style={{ width:'4rem', height:'4rem', borderRadius:'50%', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.5rem', fontWeight:700 }}>
              {profile?.display_name?.[0] ?? '?'}
            </div>
          )}
          <div>
            <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)' }}>
              {tutorProfile?.display_name} 🎓
            </h1>
            <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>Tutor Dashboard</span>
              <span style={{ fontSize:'0.75rem', fontWeight:700, padding:'0.2rem 0.625rem', borderRadius:'9999px', background:'rgba(34,85,14,0.08)', color:'rgb(34,85,14)' }}>
                ✅ Approved
              </span>
              {avgRating !== '—' && (
                <span style={{ fontSize:'0.875rem', color:'rgb(180,120,10)', display:'flex', alignItems:'center', gap:'0.25rem' }}>
                  ⭐ {avgRating} ({reviews.length} reviews)
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:'0', marginBottom:'2rem', borderBottom:'2px solid rgba(34,85,14,0.08)', overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding:'0.625rem 1.25rem', fontSize:'0.9375rem', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'rgb(34,85,14)' : 'rgb(107,107,88)', background:'transparent', border:'none', cursor:'pointer', borderBottom: tab === t.id ? '2px solid rgb(34,85,14)' : '2px solid transparent', marginBottom:'-2px', whiteSpace:'nowrap', transition:'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
              {[
                { label:'Total Earned', value:'$' + totalEarned.toFixed(2), emoji:'💰', color:'rgb(34,85,14)' },
                { label:'Pending Payout', value:'$' + pendingPayout.toFixed(2), emoji:'⏳', color:'rgb(180,120,10)' },
                { label:'Sessions Done', value:completed.length, emoji:'✅', color:'rgb(34,85,14)' },
                { label:'Avg Rating', value: avgRating === '—' ? '—' : avgRating + '⭐', emoji:'⭐', color:'rgb(180,120,10)' },
                { label:'Upcoming', value:upcoming.length, emoji:'📅', color:'rgb(37,99,235)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding:'1.25rem', textAlign:'center' }}>
                  <div style={{ fontSize:'1.75rem', marginBottom:'0.5rem' }}>{s.emoji}</div>
                  <div style={{ fontFamily:'Syne, sans-serif', fontSize:'1.5rem', fontWeight:800, color:s.color, marginBottom:'0.25rem' }}>{s.value}</div>
                  <div style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', fontFamily:'Syne, sans-serif', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {pending.length > 0 && (
              <div className="card" style={{ padding:'1.5rem', marginBottom:'1.5rem', border:'2px solid rgba(232,160,32,0.3)', background:'rgba(232,160,32,0.03)' }}>
                <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.125rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1rem' }}>
                  ⏳ Sessions Awaiting Your Confirmation ({pending.length})
                </h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {pending.map(s => (
                    <div key={s.id} style={{ padding:'1rem', borderRadius:'0.875rem', background:'white', border:'1px solid rgba(232,160,32,0.2)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap' }}>
                        <div>
                          <p style={{ fontWeight:600, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>{s.profiles?.display_name ?? 'Student'}</p>
                          <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'0.25rem' }}>{s.subject} — {s.topic}</p>
                          <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>📅 {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min</p>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', minWidth:'200px' }}>
                          <input value={meetLink[s.id] ?? ''} onChange={e => setMeetLink(prev => ({ ...prev, [s.id]: e.target.value }))}
                            placeholder="Paste Google Meet link" className="input" style={{ fontSize:'0.8125rem' }} />
                          <button onClick={() => confirmSession(s.id)} disabled={confirmingSession === s.id}
                            className="btn-primary" style={{ fontSize:'0.875rem', justifyContent:'center', padding:'0.5rem 1rem' }}>
                            {confirmingSession === s.id ? 'Confirming...' : '✅ Confirm Session'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div className="card" style={{ padding:'1.5rem' }}>
                <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.125rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1rem' }}>
                  📅 Upcoming Sessions
                </h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {upcoming.map(s => (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.03)', border:'1px solid rgba(34,85,14,0.1)', flexWrap:'wrap', gap:'0.75rem' }}>
                      <div>
                        <p style={{ fontWeight:600, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>{s.profiles?.display_name ?? 'Student'}</p>
                        <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>{s.subject} · {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min</p>
                      </div>
                      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                        {s.meet_link && (
                          <a href={s.meet_link} target="_blank" className="btn-primary" style={{ fontSize:'0.875rem', padding:'0.5rem 1rem', textDecoration:'none' }}>
                            🎥 Join Meet
                          </a>
                        )}
                        <button onClick={() => completeSession(s.id)} className="btn-secondary" style={{ fontSize:'0.875rem', padding:'0.5rem 1rem' }}>
                          ✅ Mark Complete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'sessions' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {sessions.length === 0 && (
              <div className="card" style={{ padding:'3rem', textAlign:'center', color:'rgb(107,107,88)' }}>
                No sessions yet. Students will book you once your profile is live.
              </div>
            )}
            {sessions.map(s => {
              const statusColor = s.status === 'completed' ? 'rgb(34,85,14)' : s.status === 'confirmed' ? 'rgb(37,99,235)' : s.status === 'disputed' ? 'rgb(163,45,45)' : 'rgb(180,120,10)'
              const statusBg = s.status === 'completed' ? 'rgba(34,85,14,0.08)' : s.status === 'confirmed' ? 'rgba(37,99,235,0.08)' : s.status === 'disputed' ? 'rgba(163,45,45,0.08)' : 'rgba(232,160,32,0.1)'
              return (
                <div key={s.id} className="card" style={{ padding:'1.25rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.375rem' }}>
                        <p style={{ fontWeight:600, color:'rgb(26,26,20)' }}>{s.profiles?.display_name ?? 'Student'}</p>
                        <span style={{ fontSize:'0.6875rem', fontWeight:700, padding:'0.2rem 0.5rem', borderRadius:'9999px', background:statusBg, color:statusColor }}>
                          {s.status}
                        </span>
                      </div>
                      <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'0.25rem' }}>{s.subject} — {s.topic}</p>
                      <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>
                        📅 {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min · ${s.tutor_payout}
                      </p>
                    </div>
                    {s.status === 'pending' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', minWidth:'200px' }}>
                        <input value={meetLink[s.id] ?? ''} onChange={e => setMeetLink(prev => ({ ...prev, [s.id]: e.target.value }))}
                          placeholder="Google Meet link" className="input" style={{ fontSize:'0.8125rem' }} />
                        <button onClick={() => confirmSession(s.id)} className="btn-primary" style={{ fontSize:'0.875rem', justifyContent:'center', padding:'0.5rem' }}>
                          Confirm
                        </button>
                      </div>
                    )}
                    {s.status === 'confirmed' && s.meet_link && (
                      <a href={s.meet_link} target="_blank" className="btn-primary" style={{ fontSize:'0.875rem', padding:'0.5rem 1rem', textDecoration:'none' }}>
                        🎥 Join
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'reviews' && (
          <div>
            {reviews.length === 0 ? (
              <div className="card" style={{ padding:'3rem', textAlign:'center', color:'rgb(107,107,88)' }}>
                No reviews yet. Complete your first session to start receiving reviews.
              </div>
            ) : (
              <>
                <div className="card" style={{ padding:'1.5rem', marginBottom:'1.5rem', textAlign:'center', background:'linear-gradient(135deg, rgba(34,85,14,0.03), rgba(122,182,72,0.04))' }}>
                  <div style={{ fontSize:'3rem', fontWeight:800, color:'rgb(34,85,14)', fontFamily:'Syne, sans-serif' }}>{avgRating}</div>
                  <div style={{ fontSize:'1.5rem', marginBottom:'0.5rem' }}>{'⭐'.repeat(Math.round(Number(avgRating)))}</div>
                  <p style={{ color:'rgb(107,107,88)' }}>Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {reviews.map(r => (
                    <div key={r.id} className="card" style={{ padding:'1.25rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'2.25rem', height:'2.25rem', borderRadius:'50%', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:600, fontSize:'0.875rem' }}>
                          {r.profiles?.display_name?.[0] ?? '?'}
                        </div>
                        <div>
                          <p style={{ fontWeight:600, fontSize:'0.9375rem', color:'rgb(26,26,20)' }}>{r.profiles?.display_name ?? 'Student'}</p>
                          <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)' }}>{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                        <div style={{ marginLeft:'auto', fontSize:'1.125rem' }}>{'⭐'.repeat(r.rating)}</div>
                      </div>
                      {r.comment && <p style={{ fontSize:'0.9375rem', color:'rgb(26,26,20)', lineHeight:1.7 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'earnings' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
              <div className="card" style={{ padding:'1.5rem', textAlign:'center' }}>
                <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.5rem' }}>Total Earned</p>
                <p style={{ fontFamily:'Syne, sans-serif', fontSize:'2.5rem', fontWeight:800, color:'rgb(34,85,14)' }}>${totalEarned.toFixed(2)}</p>
              </div>
              <div className="card" style={{ padding:'1.5rem', textAlign:'center' }}>
                <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.5rem' }}>Pending Payout</p>
                <p style={{ fontFamily:'Syne, sans-serif', fontSize:'2.5rem', fontWeight:800, color:'rgb(180,120,10)' }}>${pendingPayout.toFixed(2)}</p>
              </div>
            </div>
            <div className="card" style={{ padding:'1.5rem' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.125rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1rem' }}>Payout History</h2>
              {payouts.length === 0 ? (
                <p style={{ color:'rgb(107,107,88)', textAlign:'center', padding:'2rem' }}>No payouts yet</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {payouts.map(p => (
                    <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1rem', borderRadius:'0.75rem', background: p.status === 'paid' ? 'rgba(34,85,14,0.04)' : 'rgba(232,160,32,0.04)', border:'1px solid ' + (p.status === 'paid' ? 'rgba(34,85,14,0.1)' : 'rgba(232,160,32,0.15)') }}>
                      <div>
                        <p style={{ fontWeight:600, fontSize:'0.9375rem', color:'rgb(26,26,20)' }}>${p.amount.toFixed(2)}</p>
                        <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>
                          {p.paid_at ? 'Paid ' + new Date(p.paid_at).toLocaleDateString() + ' via ' + p.paid_via : 'Pending'}
                        </p>
                      </div>
                      <span style={{ fontSize:'0.75rem', fontWeight:700, padding:'0.2rem 0.625rem', borderRadius:'9999px', background: p.status === 'paid' ? 'rgba(34,85,14,0.08)' : 'rgba(232,160,32,0.12)', color: p.status === 'paid' ? 'rgb(34,85,14)' : 'rgb(180,120,10)' }}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'availability' && (
          <div className="card" style={{ padding:'2rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)' }}>Weekly Availability</h2>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input" style={{ fontSize:'0.8125rem', width:'auto' }}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1.25rem' }}>
              {availability.map((a: any) => (
                <div key={a.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:'0.75rem', alignItems:'end' }}>
                  <div>
                    <label className="label" style={{ fontSize:'0.75rem' }}>Day</label>
                    <select value={a.day_of_week} onChange={e => updateSlot(a.id, 'day_of_week', parseInt(e.target.value))} className="input">
                      {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" style={{ fontSize:'0.75rem' }}>From</label>
                    <input type="time" value={a.start_time} onChange={e => updateSlot(a.id, 'start_time', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label" style={{ fontSize:'0.75rem' }}>To</label>
                    <input type="time" value={a.end_time} onChange={e => updateSlot(a.id, 'end_time', e.target.value)} className="input" />
                  </div>
                  <button onClick={() => removeSlot(a.id)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgb(163,45,45)', padding:'0.5rem', alignSelf:'flex-end' }}>
                    <X style={{ width:'1.25rem', height:'1.25rem' }} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={addSlot} className="btn-secondary" style={{ fontSize:'0.875rem' }}>
                <Plus style={{ width:'1rem', height:'1rem' }} /> Add Slot
              </button>
              <button onClick={saveProfile} disabled={saving} className="btn-primary" style={{ fontSize:'0.875rem' }}>
                {saving ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div className="card" style={{ padding:'2rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)' }}>Your Public Profile</h2>
              {!editingProfile ? (
                <button onClick={() => setEditingProfile(true)} className="btn-secondary" style={{ fontSize:'0.875rem' }}>
                  <Edit style={{ width:'0.875rem', height:'0.875rem' }} /> Edit Profile
                </button>
              ) : (
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button onClick={() => setEditingProfile(false)} className="btn-secondary" style={{ fontSize:'0.875rem' }}>
                    <X style={{ width:'0.875rem', height:'0.875rem' }} /> Cancel
                  </button>
                  <button onClick={saveProfile} disabled={saving} className="btn-primary" style={{ fontSize:'0.875rem' }}>
                    <Save style={{ width:'0.875rem', height:'0.875rem' }} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
              <div>
                <label className="label">Bio / About You</label>
                {editingProfile ? (
                  <textarea value={bio} onChange={e => setBio(e.target.value)} className="input" rows={5} style={{ resize:'vertical' }} />
                ) : (
                  <p style={{ fontSize:'0.9375rem', color:'rgb(26,26,20)', lineHeight:1.7, padding:'0.75rem 1rem', background:'rgba(34,85,14,0.03)', borderRadius:'0.75rem' }}>
                    {bio || 'No bio yet'}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Subjects</label>
                {editingProfile ? (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                    {SUBJECTS.map(sub => (
                      <button key={sub} type="button" onClick={() => toggleSubject(sub)}
                        style={{ padding:'0.375rem 0.875rem', borderRadius:'9999px', border:'1.5px solid ' + (subjects.includes(sub) ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.2)'), background: subjects.includes(sub) ? 'rgba(34,85,14,0.08)' : 'white', color: subjects.includes(sub) ? 'rgb(34,85,14)' : 'rgb(107,107,88)', fontSize:'0.875rem', fontWeight: subjects.includes(sub) ? 600 : 400, cursor:'pointer' }}>
                        {sub}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem' }}>
                    {subjects.map(s => (
                      <span key={s} style={{ padding:'0.375rem 0.875rem', borderRadius:'9999px', background:'rgba(34,85,14,0.08)', color:'rgb(34,85,14)', fontSize:'0.875rem', fontWeight:600 }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="label">Hourly Rate</label>
                <div style={{ padding:'0.875rem 1rem', background:'rgba(34,85,14,0.04)', borderRadius:'0.875rem', border:'1px solid rgba(34,85,14,0.1)' }}>
                  <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'0.25rem' }}>
                    Your base rate: <strong style={{ color:'rgb(34,85,14)' }}>${hourlyRate}/hr</strong>
                  </p>
                  <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>
                    Students pay: Free users $49.99/hr · Premium users $34.99/hr
                  </p>
                  <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', marginTop:'0.25rem' }}>
                    Custom rates available at Tutor Level 3
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
