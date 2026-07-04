import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import StudentThemeShell from '@/app/contexts/StudentThemeShell'
import ShareButton from './ShareButton'
import ProfileTabs from './ProfileTabs'

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

  return (
    <StudentThemeShell lightBg="linear-gradient(135deg, #F4F7EC, #EFF5E3)">
      <Navbar profile={profile} />
      <div className="animate-fade-in" style={{ paddingTop: '5rem', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)', minHeight: '100vh' }}>
        <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

          <Link href="/tutoring"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--af-text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ← Back to tutors
          </Link>

          {/* ── HERO ── */}
          <div style={{ borderRadius: '1.5rem', padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgb(34,85,14), rgb(59,130,46))', color: 'white', boxShadow: '0 12px 40px rgba(34,85,14,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
              {tutor.avatar_url ? (
                <img src={tutor.avatar_url} alt={tutor.display_name}
                  style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', border: '3px solid rgba(255,255,255,0.3)' }} />
              ) : (
                <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 700, flexShrink: 0, border: '3px solid rgba(255,255,255,0.3)' }}>
                  {tutor.display_name?.[0] ?? '?'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, lineHeight: 1.1 }}>{tutor.display_name}</h1>
                  {tutor.credential_verified && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>✓ Verified</span>
                  )}
                  {tutor.is_top_tutor && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '9999px', background: 'rgb(251,191,36)', color: 'rgb(60,40,0)' }}>⭐ Top Tutor</span>
                  )}
                </div>
                {avgRating && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1rem' }}>{'⭐'.repeat(Math.round(Number(avgRating)))}</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{avgRating}</span>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}>({tutor.total_reviews} review{tutor.total_reviews !== 1 ? 's' : ''})</span>
                  </div>
                )}
                {tutor.subjects?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.25rem' }}>
                    {tutor.subjects.slice(0, 6).map((s: string) => (
                      <span key={s} style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', fontWeight: 600 }}>{s}</span>
                    ))}
                    {tutor.subjects.length > 6 && <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', fontWeight: 600 }}>+{tutor.subjects.length - 6}</span>}
                  </div>
                )}
                {tutor.is_active !== false && (
                  <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                    <Link href={`/tutoring/book/${params.tutorId}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.75rem 1.75rem', borderRadius: '0.875rem', background: 'white', color: 'rgb(34,85,14)', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none' }}>
                      Book a Session →
                    </Link>
                    <ShareButton tutorId={params.tutorId} />
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              {[
                { label: 'Sessions completed', value: tutor.total_sessions ?? 0 },
                { label: 'Reviews', value: tutor.total_reviews ?? 0 },
                { label: 'Member since', value: tutor.created_at ? new Date(tutor.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, minWidth: '110px' }}>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.375rem', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', marginTop: '0.25rem' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Availability notice */}
          <div style={{ padding: '0.875rem 1.25rem', borderRadius: '0.875rem', background: 'rgba(234,179,8,0.12)', border: '1.5px solid rgba(234,179,8,0.35)', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: '0.8125rem', color: 'rgb(133,100,0)', lineHeight: 1.6 }}>
              <strong>Availability notice:</strong> Sessions requested outside the tutor's listed availability hours may be declined. Your payment will be automatically refunded if declined.
            </p>
          </div>

          {/* ── TABS ── */}
          <ProfileTabs
            tutor={tutor}
            degrees={degrees}
            linkedinUrl={linkedinUrl}
            availability={sortedAvailability}
            reviews={reviews}
            reviewAvg={reviewAvg}
          />

          {/* ── PRICING CARD ── */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '1rem' }}>💳 Pricing</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2.25rem', color: 'rgb(34,85,14)' }}>${isPremium ? premiumRate : freeRate}</span>
              <span style={{ color: 'var(--af-text-muted)', fontWeight: 600 }}>/hr{isPremium ? ' (Premium)' : ''}</span>
            </div>
            {!isPremium && <p style={{ fontSize: '0.8125rem', color: 'var(--af-text-muted)', marginBottom: '1rem' }}>⚡ Premium members pay just ${premiumRate}/hr — save $15/hr.</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {[{ m: 30, l: '30 min' }, { m: 60, l: '1 hour' }, { m: 90, l: '90 min' }].map(o => (
                <span key={o.m} style={{ padding: '0.4rem 0.875rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.06)', border: '1px solid rgba(34,85,14,0.15)', color: 'rgb(34,85,14)', fontSize: '0.8125rem', fontWeight: 600 }}>{o.l}</span>
              ))}
            </div>
            {tutor.is_active === false ? (
              <p style={{ color: 'var(--af-text-muted)', fontSize: '0.9375rem', fontWeight: 600, textAlign: 'center' }}>This tutor is currently not accepting new bookings</p>
            ) : (
              <>
                <Link href={`/tutoring/book/${params.tutorId}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', textDecoration: 'none', borderRadius: '0.875rem', padding: '0.875rem' }}>
                  Book Now →
                </Link>
                <p style={{ fontSize: '0.75rem', color: 'var(--af-text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>Full refund if tutor declines or doesn't show</p>
              </>
            )}
          </div>

        </div>
      </div>
    </StudentThemeShell>
  )
}
