
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'

export default async function TutoringSessionsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: sessionsRaw } = await adminClient
    .from('tutoring_sessions')
    .select('*')
    .eq('student_id', user.id)
    .order('scheduled_at', { ascending: false })

  const sessions = await Promise.all((sessionsRaw ?? []).map(async (s) => {
    const { data: tp } = await adminClient.from('tutor_profiles').select('display_name, rating, subjects').eq('id', s.tutor_id).single()
    return { ...s, tutor_profiles: tp }
  }))

  const upcoming = sessions?.filter(s => ['pending','confirmed'].includes(s.status) && new Date(s.scheduled_at) > new Date()) ?? []
  const past = sessions?.filter(s => s.status === 'completed' || new Date(s.scheduled_at) < new Date()) ?? []

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <Navbar profile={profile} />
      <div style={{ paddingTop:'5rem' }}>
        <div style={{ maxWidth:'48rem', margin:'0 auto', padding:'2rem 1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
            <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2rem', fontWeight:700, color:'rgb(26,26,20)' }}>
              My Tutoring Sessions
            </h1>
            <Link href="/tutoring" className="btn-primary" style={{ textDecoration:'none' }}>
              + Book New Session
            </Link>
          </div>

          {upcoming.length > 0 && (
            <div style={{ marginBottom:'2rem' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1rem' }}>
                Upcoming Sessions
              </h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {upcoming.map(s => (
                  <Link key={s.id} href={`/tutoring/session/${s.id}`} style={{ textDecoration:'none' }}>
                    <div className="card" style={{ padding:'1.25rem', border: s.status === 'confirmed' ? '2px solid rgba(34,85,14,0.2)' : '1px solid rgba(34,85,14,0.08)', cursor:'pointer' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap' }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.375rem' }}>
                            <p style={{ fontWeight:700, color:'rgb(26,26,20)', fontSize:'1rem' }}>{s.subject}</p>
                            <span style={{ fontSize:'0.6875rem', fontWeight:700, padding:'0.2rem 0.5rem', borderRadius:'9999px', background: s.status === 'confirmed' ? 'rgba(34,85,14,0.08)' : 'rgba(232,160,32,0.1)', color: s.status === 'confirmed' ? 'rgb(34,85,14)' : 'rgb(180,120,10)' }}>
                              {s.status === 'confirmed' ? '✅ Confirmed' : '⏳ Pending'}
                            </span>
                          </div>
                          <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'0.25rem' }}>
                            with {s.tutor_profiles?.display_name}
                          </p>
                          <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>
                            📅 {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min
                          </p>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ fontFamily:'Syne, sans-serif', fontWeight:700, color:'rgb(34,85,14)' }}>${s.student_price}</p>
                          {s.meet_link && (
                            <a href={s.meet_link} target="_blank" onClick={e => e.stopPropagation()}
                              style={{ fontSize:'0.8125rem', color:'rgb(37,99,235)', fontWeight:600, textDecoration:'none' }}>
                              🎥 Join Meet
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1rem' }}>
                Past Sessions
              </h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {past.map(s => (
                  <Link key={s.id} href={`/tutoring/session/${s.id}`} style={{ textDecoration:'none' }}>
                    <div className="card" style={{ padding:'1.25rem', cursor:'pointer', opacity:0.85 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap' }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.375rem' }}>
                            <p style={{ fontWeight:700, color:'rgb(26,26,20)' }}>{s.subject}</p>
                            <span style={{ fontSize:'0.6875rem', fontWeight:700, padding:'0.2rem 0.5rem', borderRadius:'9999px', background: s.status === 'completed' ? 'rgba(34,85,14,0.08)' : s.status === 'disputed' ? 'rgba(163,45,45,0.08)' : 'rgba(107,107,88,0.1)', color: s.status === 'completed' ? 'rgb(34,85,14)' : s.status === 'disputed' ? 'rgb(163,45,45)' : 'rgb(107,107,88)' }}>
                              {s.status}
                            </span>
                          </div>
                          <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'0.25rem' }}>with {s.tutor_profiles?.display_name}</p>
                          <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>
                            📅 {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min
                          </p>
                        </div>
                        <p style={{ fontFamily:'Syne, sans-serif', fontWeight:700, color:'rgb(107,107,88)' }}>${s.student_price}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(!sessions || sessions.length === 0) && (
            <div className="card" style={{ padding:'4rem', textAlign:'center' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🎓</div>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
                No sessions yet
              </h2>
              <p style={{ color:'rgb(107,107,88)', marginBottom:'1.5rem' }}>Book your first tutoring session and start learning!</p>
              <Link href="/tutoring" className="btn-primary" style={{ display:'inline-flex', textDecoration:'none' }}>
                Browse Tutors
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
