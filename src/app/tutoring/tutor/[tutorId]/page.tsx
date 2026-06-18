import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import StudentThemeShell from '@/app/contexts/StudentThemeShell'
import ShareButton from './ShareButton'
import ReviewsSection from './ReviewsSection'

// Disable caching so newly submitted reviews and updated ratings always show.
export const revalidate = 0

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function TutorProfilePage({ params }: { params: { tutorId: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: tutor } = await supabase
    .from('tutor_profiles')
    // Use * so a not-yet-migrated degrees column (or absent legacy education
    // columns) doesn't 400 the query and bounce the page.
    .select('*')
    .eq('id', params.tutorId)
    .eq('status', 'approved')
    .single()

  if (!tutor) redirect('/tutoring')

  // Stored LinkedIn URLs may lack the scheme; ensure it's absolute so the link
  // doesn't resolve to an internal 404 route.
  const linkedinUrl = tutor.linkedin_url
    ? (tutor.linkedin_url.startsWith('http') ? tutor.linkedin_url : 'https://' + tutor.linkedin_url)
    : null

  // Prefer the multi-degree array; fall back to the legacy single columns so
  // tutors who haven't re-saved their profile still show their education.
  const degrees: { level?: string; field?: string; institution?: string }[] =
    tutor.degrees?.length
      ? tutor.degrees
      : (tutor.education || tutor.institution)
        ? [{ level: tutor.education, field: tutor.field_of_study, institution: tutor.institution }]
        : []

  const { data: availability } = await supabase
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', params.tutorId)
    .order('day_of_week', { ascending: true })

  // Fetch all reviews, then look up student names manually — the embedded FK
  // join was unreliable and sometimes returned no names.
  const { data: reviewsRaw } = await supabase
    .from('tutor_reviews')
    .select('id, rating, comment, created_at, student_id')
    .eq('tutor_id', params.tutorId)
    .order('created_at', { ascending: false })

  const reviews = await Promise.all((reviewsRaw ?? []).map(async (r) => {
    const { data: student } = await supabase.from('profiles').select('display_name').eq('id', r.student_id).single()
    return { ...r, profiles: student }
  }))

  const isPremium = profile?.is_premium ?? false
  const freeRate = 49.99
  const premiumRate = 34.99

  const avgRating = tutor.rating > 0 ? tutor.rating.toFixed(1) : null
  const sortedAvailability = (availability ?? []).sort((a: any, b: any) => a.day_of_week - b.day_of_week)

  return (
    <StudentThemeShell lightBg="linear-gradient(135deg, #F4F7EC, #EFF5E3)">
      <Navbar profile={profile} />
      <div style={{ paddingTop: '5rem' }}>
        <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

          <Link href="/tutoring"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--af-text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
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
              {tutor.avatar_url ? (
                <img src={tutor.avatar_url} alt={tutor.display_name}
                  style={{ width: '5rem', height: '5rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 700, flexShrink: 0 }}>
                  {tutor.display_name?.[0] ?? '?'}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '0.375rem' }}>
                  {tutor.display_name}
                </h1>
                {avgRating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'rgb(180,120,10)', fontSize: '1rem' }}>{'⭐'.repeat(Math.round(Number(avgRating)))}</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--af-text)' }}>{avgRating}</span>
                    <span style={{ color: 'var(--af-text-muted)', fontSize: '0.875rem' }}>({tutor.total_reviews} review{tutor.total_reviews !== 1 ? 's' : ''})</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.08)', color: 'rgb(34,85,14)' }}>
                    ✅ Verified Tutor
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.625rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', color: 'var(--af-text-muted)' }}>
                    {tutor.total_sessions ?? 0} sessions completed
                  </span>
                </div>
              </div>
            </div>

            {tutor.bio && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--af-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>About</h2>
                <p style={{ fontSize: '0.9375rem', color: 'var(--af-text)', lineHeight: 1.7 }}>{tutor.bio}</p>
              </div>
            )}

            {/* Education */}
            {degrees.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--af-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>Education</h2>
                {degrees.map((d: any, i: number) => (
                  <p key={i} style={{ fontSize: '0.9375rem', color: 'var(--af-text)', lineHeight: 1.7 }}>
                    🎓 {[d.level, d.field && 'in ' + d.field, d.institution && 'at ' + d.institution].filter(Boolean).join(' ')}
                  </p>
                ))}
              </div>
            )}

            {/* LinkedIn */}
            {linkedinUrl && (
              <div style={{ marginBottom: '1.25rem' }}>
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, color: 'rgb(10,102,194)', textDecoration: 'none' }}>
                  🔗 View LinkedIn Profile →
                </a>
              </div>
            )}

            {/* Subjects */}
            {tutor.subjects?.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--af-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>Subjects</h2>
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
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--af-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>Languages</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {tutor.languages.map((l: string) => (
                    <span key={l} style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'rgba(107,107,88,0.07)', color: 'var(--af-text-muted)', fontWeight: 600, border: '1px solid rgba(107,107,88,0.15)' }}>
                      🌐 {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div style={{ marginBottom: '0' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--af-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.625rem' }}>Session Rate</h2>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '0.875rem 1.25rem', borderRadius: '0.875rem', background: isPremium ? 'rgba(34,85,14,0.06)' : 'var(--af-card)', border: `2px solid ${isPremium ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.2)'}`, flex: 1, minWidth: '140px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)', marginBottom: '0.25rem' }}>Standard rate</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.375rem', color: 'var(--af-text)' }}>${freeRate}/hr</p>
                </div>
                <div style={{ padding: '0.875rem 1.25rem', borderRadius: '0.875rem', background: isPremium ? 'rgba(34,85,14,0.08)' : 'rgba(34,85,14,0.03)', border: `2px solid ${isPremium ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)'}`, flex: 1, minWidth: '140px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(34,85,14)', marginBottom: '0.25rem', fontWeight: 600 }}>⚡ Premium rate</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.375rem', color: 'rgb(34,85,14)' }}>${premiumRate}/hr</p>
                  {!isPremium && <p style={{ fontSize: '0.6875rem', color: 'var(--af-text-muted)', marginTop: '0.25rem' }}>Save $15/hr with Premium</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          {sortedAvailability.length > 0 && (
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '1rem' }}>
                📅 Weekly Availability
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(34,85,14,0.03)' }}>
                      {['Day', 'From', 'To'].map(h => (
                        <th key={h} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--af-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(34,85,14,0.08)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAvailability.map((a: any, i: number) => (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? 'var(--af-card)' : 'var(--af-card-2)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--af-text)', borderBottom: '1px solid rgba(34,85,14,0.06)' }}>
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
                <p style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)', marginTop: '0.75rem' }}>
                  Timezone: {sortedAvailability[0].timezone.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          )}

          {/* Reviews */}
          <ReviewsSection reviews={reviews} />

          {/* Book CTA */}
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            {tutor.is_active === false ? (
              <p style={{ color: 'var(--af-text-muted)', fontSize: '0.9375rem', fontWeight: 600 }}>
                This tutor is currently not accepting new bookings
              </p>
            ) : (
              <>
                <p style={{ color: 'var(--af-text-muted)', marginBottom: '1rem', fontSize: '0.9375rem' }}>
                  Ready to learn with {tutor.display_name}?
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href={`/tutoring/book/${params.tutorId}`}
                    className="btn-primary"
                    style={{ display: 'inline-flex', justifyContent: 'center', textDecoration: 'none', fontSize: '1.0625rem', padding: '0.875rem 2.5rem' }}>
                    Book a Session →
                  </Link>
                  <ShareButton tutorId={params.tutorId} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)', marginTop: '0.75rem' }}>
                  Full refund if tutor declines or doesn't show
                </p>
              </>
            )}
          </div>

        </div>
      </div>
    </StudentThemeShell>
  )
}
