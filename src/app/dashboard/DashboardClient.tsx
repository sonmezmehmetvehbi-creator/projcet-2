'use client'
import AdSlot from '@/components/ui/AdSlot'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, FileText, Plus, Zap, Download } from 'lucide-react'
import type { Profile } from '@/types'
import { Suspense } from 'react'

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
        {/* YOUR EXISTING DASHBOARD CONTENT GOES HERE — don't change anything inside */}
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
    `}</style>
  </div>
)