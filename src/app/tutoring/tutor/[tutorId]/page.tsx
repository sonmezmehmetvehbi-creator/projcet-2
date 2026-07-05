import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
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
  // join was unreliable and sometimes returned no names. Use the service-role
  // client so RLS can't hide reviews/names from a visiting student.
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: reviewsRaw } = await adminClient
    .from('tutor_reviews')
    .select('*')
    .eq('tutor_id', params.tutorId)
    .order('created_at', { ascending: false })

  const reviews = await Promise.all((reviewsRaw ?? []).map(async (r: any) => {
    const { data: student } = await adminClient
      .from('profiles')
      .select('display_name')
      .eq('id', r.student_id)
      .single()
    return { ...r, profiles: student }
  }))

  const isPremium = profile?.is_premium ?? false
  const freeRate = 49.99
  const premiumRate = 34.99

  // Prefer the stored average; fall back to computing from the fetched reviews
  // so the summary is accurate even if tutor.rating hasn't been recomputed yet.
  const reviewAvg = reviews.length > 0
    ? (tutor.rating > 0 ? Number(tutor.rating) : reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length)
    : 0
  const avgRating = reviewAvg > 0 ? reviewAvg.toFixed(1) : null
  const sortedAvailability = (availability ?? []).sort((a: any, b: any) => a.day_of_week - b.day_of_week)

  const memberSince = tutor.created_at ? new Date(tutor.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'
  const rate = isPremium ? premiumRate : freeRate

  return (
    <StudentThemeShell lightBg="linear-gradient(135deg, #F4F7EC, #EFF5E3)">
      <Navbar profile={profile} />
      <div className="animate-fade-in" style={{ paddingTop: '5rem', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)', minHeight: '100vh' }}>
        <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

          <Link href="/tutoring"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: MUTED, textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ← Back to tutors
          </Link>

          {/* ── HERO CARD (white, green accent bar) ── */}
          <div className="tp-hero" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(34,85,14,0.05), rgba(34,85,14,0.02)), var(--af-card)', borderRadius: '1rem', border: '1px solid var(--af-border)', boxShadow: '0 6px 28px rgba(34,85,14,0.08)', padding: '1.75rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: GREEN }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap', paddingLeft: '0.5rem' }}>
              {/* Avatar */}
              {tutor.avatar_url ? (
                <img src={tutor.avatar_url} alt={tutor.display_name}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 6px 18px rgba(34,85,14,0.2)' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: AVATAR_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 700, flexShrink: 0, boxShadow: '0 6px 18px rgba(34,85,14,0.2)' }}>
                  {tutor.display_name?.[0] ?? '?'}
                </div>
              )}

              {/* Center: name / rating / pills */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                  <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, lineHeight: 1.1 }}>{tutor.display_name}</h1>
                  {tutor.credential_verified && (
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', color: GREEN }}>✓ Verified</span>
                  )}
                  {tutor.is_top_tutor && (
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(251,191,36,0.18)', color: 'rgb(180,120,10)' }}>⭐ Top Tutor</span>
                  )}
                </div>
                {avgRating ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.875rem' }}>
                    <span style={{ color: 'rgb(180,120,10)' }}>{'⭐'.repeat(Math.round(Number(avgRating)))}</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: INK }}>{avgRating}</span>
                    <span style={{ color: MUTED, fontSize: '0.875rem' }}>({tutor.total_reviews} review{tutor.total_reviews !== 1 ? 's' : ''})</span>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: MUTED, marginBottom: '0.875rem' }}>New tutor</p>
                )}

                {tutor.subjects?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                    {tutor.subjects.map((s: string) => (
                      <span key={s} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.08)', color: GREEN, fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                )}
                {tutor.languages?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {tutor.languages.map((l: string) => (
                      <span key={l} style={{ fontSize: '0.6875rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(107,107,88,0.09)', color: MUTED, fontWeight: 600 }}>🌐 {l}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: inline pricing + book */}
              <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '150px' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: GREEN, lineHeight: 1 }}>${rate}<span style={{ fontSize: '0.9375rem', color: MUTED, fontWeight: 600 }}>/hr</span></p>
                {isPremium && <p style={{ fontSize: '0.6875rem', color: GREEN, fontWeight: 700, marginTop: '0.15rem' }}>⚡ Premium rate</p>}
                {tutor.is_active !== false && (
                  <Link href={`/tutoring/book/${params.tutorId}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.75rem', padding: '0.625rem 1.25rem', borderRadius: '0.875rem', background: GREEN, color: 'white', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
                    Book Session →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ── STATS BAR ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Sessions Completed', value: String(tutor.total_sessions ?? 0) },
              { label: 'Average Rating', value: avgRating ?? '—' },
              { label: 'Total Reviews', value: String(tutor.total_reviews ?? 0) },
              { label: 'Member Since', value: memberSince },
            ].map((s, i) => (
              <div key={s.label} className="tp-stat card" style={{ padding: '1.25rem', textAlign: 'center', boxShadow: '0 4px 24px rgba(34,85,14,0.06)', animationDelay: `${0.1 * (i + 1)}s` }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: GREEN, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '0.75rem', color: MUTED, fontWeight: 600, marginTop: '0.375rem' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Availability notice */}
          <div style={{ padding: '0.875rem 1.25rem', borderRadius: '0.875rem', background: 'rgba(234,179,8,0.12)', border: '1.5px solid rgba(234,179,8,0.35)', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: '0.8125rem', color: 'rgb(133,100,0)', lineHeight: 1.6 }}>
              <strong>Availability notice:</strong> Sessions requested outside the tutor's listed availability hours may be declined. Your payment will be automatically refunded if declined.
            </p>
          </div>

          {/* ── BIO ── */}
          {tutor.bio && (
            <div className="tp-section card" style={{ padding: '1.75rem', marginBottom: '1.5rem', animationDelay: '0.1s' }}>
              <h2 style={sectionTitle}>About {tutor.display_name?.split(' ')[0]}</h2>
              <p style={{ fontSize: '1rem', color: 'var(--af-text)', lineHeight: 1.8 }}>{tutor.bio}</p>
            </div>
          )}

          {/* ── EDUCATION ── */}
          {degrees.length > 0 && (
            <div className="tp-section card" style={{ padding: '1.75rem', marginBottom: '1.5rem', animationDelay: '0.15s' }}>
              <h2 style={sectionTitle}>Education</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {degrees.map((d: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.04)', border: '1px solid rgba(34,85,14,0.1)' }}>
                    <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🎓</span>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--af-text)', lineHeight: 1.6 }}>
                      <strong style={{ color: INK }}>{d.level}</strong>
                      {[d.field && ' in ' + d.field, d.institution && ' at ' + d.institution].filter(Boolean).join('')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LINKEDIN ── */}
          {linkedinUrl && (
            <div className="tp-section card" style={{ padding: '1.5rem 1.75rem', marginBottom: '1.5rem', animationDelay: '0.2s' }}>
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.875rem', background: 'rgb(10,102,194)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none' }}>
                🔗 View LinkedIn Profile →
              </a>
            </div>
          )}

          {/* ── AVAILABILITY ── */}
          {sortedAvailability.length > 0 && (
            <div className="tp-section card" style={{ padding: '1.75rem', marginBottom: '1.5rem', animationDelay: '0.25s' }}>
              <h2 style={sectionTitle}>Weekly Availability</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.625rem' }}>
                {sortedAvailability.map((a: any) => (
                  <div key={a.id} style={{ padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.04)', border: '1px solid rgba(34,85,14,0.12)' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: INK, marginBottom: '0.25rem' }}>{DAYS[a.day_of_week]}</p>
                    <p style={{ fontSize: '0.8125rem', color: GREEN, fontWeight: 600 }}>{a.start_time} – {a.end_time}</p>
                  </div>
                ))}
              </div>
              {sortedAvailability[0]?.timezone && (
                <p style={{ fontSize: '0.75rem', color: MUTED, marginTop: '1rem' }}>Timezone: {sortedAvailability[0].timezone.replace(/_/g, ' ')}</p>
              )}
            </div>
          )}

          {/* ── REVIEWS ── */}
          <div className="tp-section" style={{ animationDelay: '0.3s' }}>
            <h2 style={{ ...sectionTitle, marginBottom: '1rem' }}>
              Student Reviews
              {reviews.length > 0 && <span style={{ marginLeft: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, padding: '0.1rem 0.6rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', color: GREEN, fontFamily: 'Syne, sans-serif' }}>{reviews.length}</span>}
            </h2>
            <ReviewsSection reviews={reviews} avgRating={reviewAvg} />
          </div>

          {/* ── BOOKING CTA ── */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem', border: `1.5px solid rgba(34,85,14,0.25)`, boxShadow: '0 6px 28px rgba(34,85,14,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2.25rem', color: GREEN }}>${rate}</span>
              <span style={{ color: MUTED, fontWeight: 600 }}>/hr{isPremium ? ' (Premium)' : ''}</span>
            </div>
            {!isPremium && <p style={{ fontSize: '0.8125rem', color: MUTED, marginBottom: '1rem' }}>⚡ Premium members pay just ${premiumRate}/hr — save $15/hr.</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {[{ l: '30 min' }, { l: '1 hour' }, { l: '90 min' }].map(o => (
                <span key={o.l} style={{ padding: '0.4rem 0.875rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', border: '1px solid rgba(34,85,14,0.15)', color: GREEN, fontSize: '0.8125rem', fontWeight: 600 }}>{o.l}</span>
              ))}
            </div>
            {tutor.is_active === false ? (
              <p style={{ color: MUTED, fontSize: '0.9375rem', fontWeight: 600, textAlign: 'center' }}>This tutor is currently not accepting new bookings</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                  <Link href={`/tutoring/book/${params.tutorId}`} style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.875rem', borderRadius: '0.875rem', background: GREEN, color: 'white', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none' }}>
                    Book a Session →
                  </Link>
                  <ShareButton tutorId={params.tutorId} />
                </div>
                <p style={{ fontSize: '0.75rem', color: MUTED, marginTop: '0.75rem', textAlign: 'center' }}>Full refund if tutor declines or doesn't show</p>
              </>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes tpHeroDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .tp-hero { animation: tpHeroDown 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes tpFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .tp-stat { animation: tpFade 0.5s ease both; }
        .tp-section { animation: tpFade 0.5s ease both; }
      `}</style>
    </StudentThemeShell>
  )
}

const GREEN = 'rgb(34,85,14)'
const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'
const AVATAR_GRADIENT = 'linear-gradient(135deg, rgb(34,85,14), rgb(74,122,40))'
const sectionTitle: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: INK, borderLeft: '3px solid rgb(34,85,14)', paddingLeft: '0.75rem', marginBottom: '1rem' }
