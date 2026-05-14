import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { BookOpen, FileText, Plus, Zap } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const today = new Date().toISOString().split('T')[0]
  const { data: usage } = await supabase
    .from('daily_usage')
    .select('questions, worksheets')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  const questionsUsed = usage?.questions ?? 0
  const worksheetsUsed = usage?.worksheets ?? 0

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <Navbar profile={profile} />

      <div style={{ paddingTop:'5rem' }}>
        <div className="container-base" style={{ padding:'2rem 1.5rem' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
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

          {/* Usage bar (free users) */}
          {!profile?.is_premium && (
            <div className="card" style={{ padding:'1.25rem 1.5rem', marginBottom:'1.5rem', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'2rem' }}>
                <div>
                  <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', marginBottom:'0.25rem' }}>Questions today</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <div style={{ display:'flex', gap:'0.25rem' }}>
                      {[0,1].map(i => (
                        <div key={i} style={{ width:'2rem', height:'0.5rem', borderRadius:'9999px', background: i < questionsUsed ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)' }} />
                      ))}
                    </div>
                    <span style={{ fontSize:'0.875rem', fontWeight:600, color:'rgb(26,26,20)' }}>{questionsUsed}/2</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', marginBottom:'0.25rem' }}>Worksheets today</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <div style={{ display:'flex', gap:'0.25rem' }}>
                      {[0,1].map(i => (
                        <div key={i} style={{ width:'2rem', height:'0.5rem', borderRadius:'9999px', background: i < worksheetsUsed ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)' }} />
                      ))}
                    </div>
                    <span style={{ fontSize:'0.875rem', fontWeight:600, color:'rgb(26,26,20)' }}>{worksheetsUsed}/2</span>
                  </div>
                </div>
              </div>
              <Link href="/pricing" style={{ display:'flex', alignItems:'center', gap:'0.375rem', fontSize:'0.875rem', fontWeight:600, color:'rgb(34,85,14)', textDecoration:'none' }}>
                <Zap style={{ width:'0.875rem', height:'0.875rem' }} />
                Upgrade for unlimited
              </Link>
            </div>
          )}

          {/* Sessions */}
          {!sessions || sessions.length === 0 ? (
            <div className="card" style={{ padding:'4rem 2rem', textAlign:'center' }}>
              <div style={{ width:'4rem', height:'4rem', borderRadius:'1rem', background:'rgba(34,85,14,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}>
                <BookOpen style={{ width:'2rem', height:'2rem', color:'rgb(34,85,14)' }} />
              </div>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>No sessions yet</h2>
              <p style={{ color:'rgb(107,107,88)', marginBottom:'2rem', maxWidth:'24rem', margin:'0 auto 2rem' }}>
                Start your first study session and your history will appear here.
              </p>
              <Link href="/generate" className="btn-primary" style={{ display:'inline-flex' }}>
                <Plus style={{ width:'1rem', height:'1rem' }} />
                Start Studying
              </Link>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1rem' }}>
              {sessions.map((session: any) => (
                <Link key={session.id} href={`/${session.output_type === 'questions' ? 'questions' : 'worksheet'}/${session.id}`}
                  style={{ textDecoration:'none' }} className="card-hover">
                  <div style={{ padding:'1.5rem' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
                      <span className="badge badge-primary" style={{ fontSize:'0.75rem' }}>
                        {session.output_type === 'questions' ? '❓ Questions' : '📄 Worksheet'}
                      </span>
                      {session.pdf_downloaded && (
                        <FileText style={{ width:'0.875rem', height:'0.875rem', color:'rgb(107,107,88)' }} />
                      )}
                    </div>
                    <h3 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.125rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
                      {session.topic}
                    </h3>
                    <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'0.75rem' }}>
                      {session.subject} · {session.grade}
                    </p>
                    <p style={{ fontSize:'0.75rem', color:'rgba(107,107,88,0.7)' }}>
                      {new Date(session.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}