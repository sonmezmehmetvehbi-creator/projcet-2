'use client'
import AdSlot from '@/components/ui/AdSlot'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, FileText, Plus, Zap, Download } from 'lucide-react'
import type { Profile } from '@/types'
import { Suspense } from 'react'

const LEVELS = [
  { level: 1, name: 'Freshman', emoji: '📚', xpRequired: 0 },
  { level: 2, name: 'Apprentice', emoji: '✏️', xpRequired: 150 },
  { level: 3, name: 'Scholar', emoji: '🎓', xpRequired: 400 },
  { level: 4, name: 'Analyst', emoji: '🔍', xpRequired: 800 },
  { level: 5, name: 'Achiever', emoji: '⭐', xpRequired: 1500 },
  { level: 6, name: 'Expert', emoji: '🧠', xpRequired: 2500 },
  { level: 7, name: 'Master', emoji: '🏆', xpRequired: 4000 },
  { level: 8, name: 'Prodigy', emoji: '⚡', xpRequired: 6000 },
  { level: 9, name: 'Sage', emoji: '🌟', xpRequired: 9000 },
  { level: 10, name: 'Legend', emoji: '👑', xpRequired: 13000 },
]

function getLevelInfo(xp: number) {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) current = l
    else break
  }
  const next = LEVELS.find(l => l.level === current.level + 1) ?? null
  const xpIntoLevel = xp - current.xpRequired
  const xpNeeded = next ? next.xpRequired - current.xpRequired : 1
  const pct = next ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 100
  return { current, next, pct, xpIntoLevel, xpNeeded }
}

interface Props {
  profile: Profile | null
  sessions: any[]
  usage: { questions: number; worksheets: number }
}

function DashboardInner({ profile, sessions, usage }: Props) {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'pdfs' ? 'pdfs' : 'all'
  const [tab, setTab] = useState<'all' | 'pdfs'>(initialTab)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const router = useRouter()

  const upgraded = searchParams.get('upgraded') === 'true'

  const filteredSessions = tab === 'pdfs'
    ? sessions.filter(s => s.pdf_downloaded)
    : sessions

  const xp = (profile as any)?.xp ?? 0
  const streak = (profile as any)?.streak_count ?? 0
  const levelInfo = getLevelInfo(xp)
  const bonusGenerations = (profile as any)?.bonus_generations ?? 0

  async function redownloadPDF(session: any) {
    setDownloadingId(session.id)
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      })
      const html = await res.text()
      const printWindow = window.open('', '_blank')
      if (!printWindow) return
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
    } catch {}
    setDownloadingId(null)
  }

  return (
    <div style={{ paddingTop:'5rem' }}>
      <div style={{ display:'flex', gap:'1.5rem', maxWidth:'80rem', margin:'0 auto' }}>

        {/* Left sidebar ad */}
        <div style={{ width:'160px', flexShrink:0, padding:'2rem 0' }} className="dash-ad-sidebar">
          <AdSlot
            isPremium={profile?.is_premium ?? false}
            slot="2233445566"
            format="vertical"
            style={{ position:'sticky', top:'5rem' }}
          />
        </div>

        {/* Main content */}
        <div style={{ flex:1, minWidth:0, padding:'2rem 1.5rem' }}>

          {upgraded && (
            <div style={{ padding:'1rem 1.5rem', borderRadius:'0.875rem', background:'linear-gradient(135deg, rgba(34,85,14,0.08), rgba(232,160,32,0.08))', border:'1px solid rgba(34,85,14,0.2)', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <span style={{ fontSize:'1.5rem' }}>🎉</span>
              <div>
                <p style={{ fontWeight:700, color:'rgb(34,85,14)', marginBottom:'0.125rem' }}>Welcome to Premium!</p>
                <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>You now have unlimited generations and faster loading.</p>
              </div>
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
            <div>
              <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
                Welcome back{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}! 👋
              </h1>
              <p style={{ color:'rgb(107,107,88)' }}>What are you studying today?</p>
            </div>
            <Link href="/generate" className="btn-primary">
              <Plus style={{ width:'1rem', height:'1rem' }} />
              New Study Session
            </Link>
          </div>

          {/* XP & Streak Section */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>

            {/* Level & XP card */}
            <div className="card" style={{ padding:'1.5rem', background:'linear-gradient(135deg, rgba(34,85,14,0.03), rgba(122,182,72,0.04))', border:'1px solid rgba(34,85,14,0.12)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'1rem' }}>
                <span style={{ fontSize:'2rem' }}>{levelInfo.current.emoji}</span>
                <div>
                  <p style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:'1.125rem', color:'rgb(26,26,20)', lineHeight:1.2 }}>
                    Level {levelInfo.current.level}
                  </p>
                  <p style={{ fontFamily:'Syne, sans-serif', fontSize:'0.8125rem', color:'rgb(34,85,14)', fontWeight:600 }}>
                    {levelInfo.current.name}
                  </p>
                </div>
                <div style={{ marginLeft:'auto', textAlign:'right' }}>
                  <p style={{ fontFamily:'Syne, sans-serif', fontSize:'1.25rem', fontWeight:800, color:'rgb(34,85,14)' }}>{xp}</p>
                  <p style={{ fontSize:'0.6875rem', color:'rgb(107,107,88)', fontFamily:'Syne, sans-serif' }}>XP total</p>
                </div>
              </div>

              {/* XP progress bar */}
              <div style={{ marginBottom:'0.5rem' }}>
                <div style={{ width:'100%', height:'8px', background:'rgba(34,85,14,0.1)', borderRadius:'9999px', overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:'9999px',
                    background:'linear-gradient(90deg, rgb(34,85,14), rgb(122,182,72))',
                    width:`${levelInfo.pct}%`,
                    transition:'width 1s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow:'0 0 6px rgba(34,85,14,0.3)',
                    position:'relative',
                  }}>
                    <div style={{
                      position:'absolute', right:'-1px', top:'50%', transform:'translateY(-50%)',
                      width:'12px', height:'12px', borderRadius:'50%',
                      background:'white', border:'2px solid rgb(34,85,14)',
                    }} />
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:'0.6875rem', color:'rgb(107,107,88)', fontFamily:'Syne, sans-serif' }}>
                  {levelInfo.xpIntoLevel}/{levelInfo.xpNeeded} XP
                </span>
                {levelInfo.next ? (
                  <span style={{ fontSize:'0.6875rem', color:'rgb(107,107,88)', fontFamily:'Syne, sans-serif' }}>
                    {levelInfo.next.xpRequired - xp} to {levelInfo.next.name} {levelInfo.next.emoji}
                  </span>
                ) : (
                  <span style={{ fontSize:'0.6875rem', color:'rgb(34,85,14)', fontWeight:700, fontFamily:'Syne, sans-serif' }}>
                    MAX LEVEL 👑
                  </span>
                )}
              </div>

              {/* All levels preview */}
              <div style={{ display:'flex', gap:'0.25rem', marginTop:'0.875rem' }}>
                {LEVELS.map(l => (
                  <div key={l.level} title={`Level ${l.level}: ${l.name}`} style={{
                    flex:1, height:'4px', borderRadius:'9999px',
                    background: xp >= l.xpRequired ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.12)',
                    transition:'background 0.3s',
                  }} />
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.25rem' }}>
                <span style={{ fontSize:'0.6rem', color:'rgb(107,107,88)' }}>Lv.1</span>
                <span style={{ fontSize:'0.6rem', color:'rgb(107,107,88)' }}>Lv.10 👑</span>
              </div>
            </div>

            {/* Streak card */}
            <div className="card" style={{ padding:'1.5rem', background: streak >= 7 ? 'linear-gradient(135deg, rgba(232,160,32,0.06), rgba(245,158,11,0.04))' : 'white', border:`1px solid ${streak >= 7 ? 'rgba(232,160,32,0.25)' : 'rgba(34,85,14,0.08)'}` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                <div>
                  <p style={{ fontFamily:'Syne, sans-serif', fontSize:'0.75rem', fontWeight:700, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.25rem' }}>
                    Study Streak
                  </p>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'0.375rem' }}>
                    <span style={{ fontFamily:'Syne, sans-serif', fontSize:'2.5rem', fontWeight:800, color: streak >= 7 ? 'rgb(180,120,10)' : streak > 0 ? 'rgb(34,85,14)' : 'rgb(107,107,88)', lineHeight:1 }}>
                      {streak}
                    </span>
                    <span style={{ fontFamily:'Syne, sans-serif', fontSize:'0.875rem', color:'rgb(107,107,88)', fontWeight:600 }}>days</span>
                  </div>
                </div>
                <div style={{ fontSize:'3rem', animation: streak >= 3 ? 'fireAnim 0.8s ease-in-out infinite alternate' : 'none' }}>
                  {streak === 0 ? '💤' : streak >= 30 ? '🌋' : streak >= 14 ? '⚡' : streak >= 7 ? '🔥' : '🔥'}
                </div>
              </div>

              <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)', lineHeight:1.5, marginBottom:'0.875rem' }}>
                {streak === 0
                  ? 'Study today to start your streak!'
                  : streak === 1
                  ? 'Great start! Come back tomorrow to keep it going.'
                  : streak < 7
                  ? `${7 - streak} more days to unlock the 7-day streak bonus! 🎯`
                  : streak < 30
                  ? `${30 - streak} more days to the legendary 30-day streak! 👑`
                  : 'Legendary dedication! You\'re unstoppable! 👑'}
              </p>

              {/* Streak week dots */}
              <div style={{ display:'flex', gap:'0.375rem' }}>
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} style={{
                    flex:1, height:'6px', borderRadius:'9999px',
                    background: i < Math.min(streak, 7) ? (streak >= 7 ? 'rgb(232,160,32)' : 'rgb(34,85,14)') : 'rgba(34,85,14,0.1)',
                    transition:'background 0.3s',
                  }} />
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.25rem' }}>
                <span style={{ fontSize:'0.6rem', color:'rgb(107,107,88)' }}>Day 1</span>
                <span style={{ fontSize:'0.6rem', color:'rgb(107,107,88)' }}>Day 7 🔥</span>
              </div>

              {/* Bonus generations for free users */}
              {!profile?.is_premium && bonusGenerations > 0 && (
                <div style={{ marginTop:'0.875rem', padding:'0.5rem 0.75rem', borderRadius:'0.625rem', background:'rgba(34,85,14,0.06)', border:'1px solid rgba(34,85,14,0.15)', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <span style={{ fontSize:'1rem' }}>🎁</span>
                  <p style={{ fontSize:'0.8125rem', color:'rgb(34,85,14)', fontWeight:600 }}>
                    {bonusGenerations} bonus generation{bonusGenerations > 1 ? 's' : ''} available
                  </p>
                </div>
              )}
            </div>
          </div>

          {!profile?.is_premium && (
            <div className="card" style={{ padding:'1.25rem 1.5rem', marginBottom:'1.5rem', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'2rem' }}>
                {(['questions', 'worksheets'] as const).map(type => {
                  const used = usage[type]
                  return (
                    <div key={type}>
                      <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', marginBottom:'0.375rem', textTransform:'capitalize' }}>{type} today</p>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <div style={{ display:'flex', gap:'0.25rem' }}>
                          {[0,1].map(i => (
                            <div key={i} style={{ width:'2rem', height:'0.5rem', borderRadius:'9999px', background: i < used ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)' }} />
                          ))}
                        </div>
                        <span style={{ fontSize:'0.875rem', fontWeight:600, color:'rgb(26,26,20)' }}>{used}/2</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Link href="/pricing" style={{ display:'flex', alignItems:'center', gap:'0.375rem', fontSize:'0.875rem', fontWeight:600, color:'rgb(34,85,14)', textDecoration:'none' }}>
                <Zap style={{ width:'0.875rem', height:'0.875rem' }} />
                Upgrade for unlimited
              </Link>
            </div>
          )}

          <div style={{ display:'flex', gap:'0.25rem', marginBottom:'1.5rem', borderBottom:'2px solid rgba(34,85,14,0.08)', paddingBottom:'0' }}>
            {([
              { value:'all', label:'All Sessions' },
              { value:'pdfs', label:'My PDFs' },
            ] as const).map(t => (
              <button key={t.value} onClick={() => setTab(t.value)}
                style={{ padding:'0.625rem 1.25rem', fontSize:'0.9375rem', fontWeight: tab === t.value ? 600 : 400, color: tab === t.value ? 'rgb(34,85,14)' : 'rgb(107,107,88)', background:'transparent', border:'none', cursor:'pointer', borderBottom: tab === t.value ? '2px solid rgb(34,85,14)' : '2px solid transparent', marginBottom:'-2px', transition:'all 0.2s' }}>
                {t.label}
                {t.value === 'pdfs' && sessions.filter(s => s.pdf_downloaded).length > 0 && (
                  <span style={{ marginLeft:'0.5rem', background:'rgba(34,85,14,0.1)', color:'rgb(34,85,14)', borderRadius:'9999px', padding:'0.125rem 0.5rem', fontSize:'0.75rem', fontWeight:600 }}>
                    {sessions.filter(s => s.pdf_downloaded).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filteredSessions.length === 0 ? (
            <div className="card" style={{ padding:'4rem 2rem', textAlign:'center' }}>
              <div style={{ width:'4rem', height:'4rem', borderRadius:'1rem', background:'rgba(34,85,14,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}>
                {tab === 'pdfs' ? <FileText style={{ width:'2rem', height:'2rem', color:'rgb(34,85,14)' }} /> : <BookOpen style={{ width:'2rem', height:'2rem', color:'rgb(34,85,14)' }} />}
              </div>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
                {tab === 'pdfs' ? 'No PDFs yet' : 'No sessions yet'}
              </h2>
              <p style={{ color:'rgb(107,107,88)', marginBottom:'2rem', maxWidth:'24rem', margin:'0 auto 2rem' }}>
                {tab === 'pdfs'
                  ? 'Download a PDF from any questions or worksheet session and it will appear here.'
                  : 'Start your first study session and your history will appear here.'}
              </p>
              {tab === 'all' && (
                <Link href="/generate" className="btn-primary" style={{ display:'inline-flex' }}>
                  <Plus style={{ width:'1rem', height:'1rem' }} />
                  Start Studying
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1rem' }}>
              {filteredSessions.map((session: any) => (
                <div key={session.id} className="card-hover" style={{ padding:'1.5rem', position:'relative' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
                    <span className="badge badge-primary" style={{ fontSize:'0.75rem' }}>
                      {session.output_type === 'questions' ? '❓ Questions' : '📄 Worksheet'}
                    </span>
                    {session.pdf_downloaded && (
                      <span style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', display:'flex', alignItems:'center', gap:'0.25rem' }}>
                        <FileText style={{ width:'0.75rem', height:'0.75rem' }} /> PDF
                      </span>
                    )}
                  </div>
                  <Link href={`/${session.output_type === 'questions' ? 'questions' : 'worksheet'}/${session.id}`} style={{ textDecoration:'none' }}>
                    <h3 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.125rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
                      {session.topic}
                    </h3>
                    <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'0.75rem' }}>
                      {session.subject} · {session.grade}
                    </p>
                    <p style={{ fontSize:'0.75rem', color:'rgba(107,107,88,0.7)' }}>
                      {new Date(session.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                    </p>
                  </Link>
                  {tab === 'pdfs' && (
                    <button onClick={() => redownloadPDF(session)} disabled={downloadingId === session.id}
                      className="btn-secondary" style={{ width:'100%', marginTop:'1rem', fontSize:'0.875rem', padding:'0.5rem' }}>
                      <Download style={{ width:'0.875rem', height:'0.875rem' }} />
                      {downloadingId === session.id ? 'Opening...' : 'Download again'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar ad */}
        <div style={{ width:'160px', flexShrink:0, padding:'2rem 0' }} className="dash-ad-sidebar">
          <AdSlot
            isPremium={profile?.is_premium ?? false}
            slot="3344556677"
            format="vertical"
            style={{ position:'sticky', top:'5rem' }}
          />
        </div>
      </div>

      <style>{`
        .dash-ad-sidebar { display: none; }
        @media (min-width: 1200px) { .dash-ad-sidebar { display: block; } }
        @keyframes fireAnim { from { transform: scale(1) rotate(-3deg); } to { transform: scale(1.15) rotate(3deg); } }
      `}</style>
    </div>
  )
}

export default function DashboardClient(props: Props) {
  return (
    <Suspense fallback={<div style={{ paddingTop:'6rem', textAlign:'center', color:'rgb(107,107,88)' }}>Loading...</div>}>
      <DashboardInner {...props} />
    </Suspense>
  )
}