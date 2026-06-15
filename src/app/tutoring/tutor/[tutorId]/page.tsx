import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function TutorProfilePage({ params }: { params: { tutorId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: tutor } = await supabase
    .from('tutor_profiles')
    .select('*')
    .eq('id', params.tutorId)
    .eq('status', 'approved')
    .single()

  if (!tutor) redirect('/tutoring')

  const { data: availability } = await supabase
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', params.tutorId)
    .order('day_of_week', { ascending: true })

  const { data: reviews } = await supabase
    .from('tutor_reviews')
    .select('rating, comment, created_at, profiles(display_name)')
    .eq('tutor_id', params.tutorId)
    .order('created_at', { ascending: false })
    .limit(5)

  const isPremium = profile?.is_premium ?? false
  const freeRate = 49.99
  const premiumRate = 34.99

  const avgRating = tutor.rating > 0 ? tutor.rating.toFixed(1) : null
  const sortedAvailability = (availability ?? []).sort((a: any, b: any) => a.day_of_week - b.day_of_week)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} />
      <div style={{ paddingTop: '5rem' }}>
        <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

          <Link href="/tutoring"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'rgb(107,107,88)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            ← Back to tutors
          </Link>

          {/* Warning banner */}
          <div style={{ padding: '0.875rem 1.25rem', borderRadius: '0.875rem', background: 'rgba(234,179,8,0.12)', border: '1.5px solid rgba(234,179,8,0.35)', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: '0.8125rem', color: 'rgb(133,100,0)', lineHeight: 1.6 }}>
              <strong>Availability notice:</strong> Sessions requested outside the tutor's listed availability hours may be declined. Your payment will be automatically refunded if declined.
            </p>
          </div>

          {/* Profile card */}
          <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 700, flexShrink: 0 }}>
                {tutor.display_name?.[0] ?? '?'}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.375rem' }}>
                  {tutor.display_name}
                </h1>
                {avgRating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'rgb(180,120,10)', fontSize: '1rem' }}>{'⭐'.repeat(Math.round(Number(avgRating)))}</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'rgb(26,26,20)' }}>{avgRating}</span>
                    <span style={{ color: 'rgb(107,107,88)', fontSize: '0.875rem' }}>({tutor.total_reviews} review{tutor.total_reviews !== 1 ? 's' : ''})</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.08)', color: 'rgb(34,85,14)' }}>
                    ✅ Verified Tutor
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.625rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', color: 'rgb(107,107,88)' }}>
                    {tutor.total_sessions ?? 0} sessions completed
                  </span>
                </div>
              </div>
            </div>

            {tutor.bio && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>About</h2>
                <p style={{ fontSize: '0.9375rem', color: 'rgb(26,26,20)', lineHeight: 1.7 }}>{tutor.bio}</p>
              </div>
            )}

            {/* Subjects */}
            {tutor.subjects?.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>Subjects</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {tutor.subjects.map((s: string) => (
                    <span key={s} style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.07)', color: 'rgb(34,85,14)', fontWeight: 600, border: '1px solid rgba(34,85,14,0.15)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {tutor.languages?.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>Languages</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {tutor.languages.map((l: string) => (
                    <span key={l} style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'rgba(107,107,88,0.07)', color: 'rgb(107,107,88)', fontWeight: 600, border: '1px solid rgba(107,107,88,0.15)' }}>
                      🌐 {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div style={{ marginBottom: '0' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>Session Rate</h2>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '0.875rem 1.25rem', borderRadius: '0.875rem', background: isPremium ? 'rgba(34,85,14,0.06)' : 'white', border: `2px solid ${isPremium ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.2)'}`, flex: 1, minWidth: '140px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(107,107,88)', marginBottom: '0.25rem' }}>Standard rate</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.375rem', color: 'rgb(26,26,20)' }}>${freeRate}/hr</p>
                </div>
                <div style={{ padding: '0.875rem 1.25rem', borderRadius: '0.875rem', background: isPremium ? 'rgba(34,85,14,0.08)' : 'rgba(34,85,14,0.03)', border: `2px solid ${isPremium ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)'}`, flex: 1, minWidth: '140px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(34,85,14)', marginBottom: '0.25rem', fontWeight: 600 }}>⚡ Premium rate</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.375rem', color: 'rgb(34,85,14)' }}>${premiumRate}/hr</p>
                  {!isPremium && <p style={{ fontSize: '0.6875rem', color: 'rgb(107,107,88)', marginTop: '0.25rem' }}>Save $15/hr with Premium</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          {sortedAvailability.length > 0 && (
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '1rem' }}>
                📅 Weekly Availability
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(34,85,14,0.03)' }}>
                      {['Day', 'From', 'To'].map(h => (
                        <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(34,85,14,0.08)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAvailability.map((a: any, i: number) => (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? 'white' : 'rgba(34,85,14,0.015)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.9375rem', fontWeight: 600, color: 'rgb(26,26,20)', borderBottom: '1px solid rgba(34,85,14,0.06)' }}>
                          {DAYS[a.day_of_week]}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'rgb(34,85,14)', fontWeight: 600, borderBottom: '1px solid rgba(34,85,14,0.06)' }}>
                          {a.start_time}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'rgb(34,85,14)', fontWeight: 600, borderBottom: '1px solid rgba(34,85,14,0.06)' }}>
                          {a.end_time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sortedAvailability[0]?.timezone && (
                <p style={{ fontSize: '0.75rem', color: 'rgb(107,107,88)', marginTop: '0.75rem' }}>
                  Timezone: {sortedAvailability[0].timezone.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          )}

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '1rem' }}>
                ⭐ Recent Reviews
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((r: any, i: number) => (
                  <div key={i} style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                        {(r.profiles as any)?.display_name?.[0] ?? '?'}
                      </div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'rgb(26,26,20)' }}>{(r.profiles as any)?.display_name ?? 'Student'}</p>
                      <span style={{ marginLeft: 'auto', fontSize: '0.875rem' }}>{'⭐'.repeat(r.rating)}</span>
                    </div>
                    {r.comment && <p style={{ fontSize: '0.875rem', color: 'rgb(107,107,88)', lineHeight: 1.6 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Book CTA */}
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'rgb(107,107,88)', marginBottom: '1rem', fontSize: '0.9375rem' }}>
              Ready to learn with {tutor.display_name}?
            </p>
            <Link href={`/tutoring/book/${params.tutorId}`}
              className="btn-primary"
              style={{ display: 'inline-flex', justifyContent: 'center', textDecoration: 'none', fontSize: '1.0625rem', padding: '0.875rem 2.5rem' }}>
              Book a Session →
            </Link>
            <p style={{ fontSize: '0.75rem', color: 'rgb(107,107,88)', marginTop: '0.75rem' }}>
              Full refund if tutor declines or doesn't show
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
