'use client'

import { useState, useEffect } from 'react'
import { Edit, Save, X, Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useTutorTheme } from './TutorThemeContext'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const COMMON_SUBJECTS = [
  'SAT Math', 'SAT Reading & Writing', 'ACT Math', 'ACT English',
  'Algebra', 'Geometry', 'Pre-Calculus', 'Calculus', 'Statistics',
  'Biology', 'Chemistry', 'Physics', 'AP Chemistry', 'AP Biology', 'AP Physics',
  'English Literature', 'Essay Writing', 'History', 'Economics',
  'Computer Science', 'Python', 'Java', 'Spanish', 'French',
]

const ALL_SUBJECTS = [
  ...COMMON_SUBJECTS,
  'Trigonometry', 'Linear Algebra', 'Differential Equations', 'Discrete Math',
  'Organic Chemistry', 'Biochemistry', 'Anatomy', 'Environmental Science',
  'AP Calculus AB', 'AP Calculus BC', 'AP Statistics', 'AP Computer Science',
  'AP History', 'AP Economics', 'AP English', 'AP Spanish', 'AP French',
  'IB Math', 'IB Physics', 'IB Chemistry', 'IB Biology', 'IB Economics',
  'GMAT', 'GRE', 'LSAT', 'MCAT', 'TOEFL', 'IELTS',
  'Music Theory', 'Art History', 'Philosophy', 'Psychology', 'Sociology',
  'Accounting', 'Finance', 'Marketing', 'Business',
  'C++', 'JavaScript', 'React', 'Data Science', 'Machine Learning',
  'Arabic', 'Mandarin', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean',
  'Russian', 'Turkish', 'Hindi', 'Hebrew',
]

const ALL_LANGUAGES = [
  'English', 'Spanish', 'French', 'Mandarin', 'Arabic', 'Turkish',
  'Portuguese', 'Hindi', 'Korean', 'Japanese', 'German', 'Italian',
  'Russian', 'Hebrew', 'Persian/Farsi', 'Urdu', 'Bengali', 'Swahili',
  'Dutch', 'Greek', 'Polish', 'Swedish', 'Norwegian', 'Danish',
  'Finnish', 'Czech', 'Romanian', 'Hungarian', 'Thai', 'Vietnamese',
  'Indonesian', 'Malay', 'Tagalog', 'Punjabi', 'Gujarati', 'Tamil',
  'Telugu', 'Kannada', 'Marathi', 'Amharic', 'Yoruba', 'Zulu',
  'Serbian', 'Croatian', 'Slovak', 'Bulgarian', 'Ukrainian',
  'Catalan', 'Basque', 'Welsh', 'Irish', 'Afrikaans',
]

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'Europe/London', 'Europe/Paris', 'Europe/Istanbul',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai',
  'Australia/Sydney', 'Africa/Cairo',
]

// Force pasted Meet links to absolute https:// so they open externally and are
// never treated as internal Next.js routes (which 404'd).
const safeMeetLink = (url: string) => {
  const u = (url || '').trim()
  return /^https?:\/\//i.test(u) ? u : 'https://' + u
}

// Tutors sometimes paste the whole Google Calendar invite description rather
// than just the link; pull the Meet URL out of whatever they paste.
const extractMeetLink = (input: string): string => {
  const match = input.match(/https:\/\/meet\.google\.com\/[a-z0-9\-]+/i)
  return match ? match[0] : input.trim()
}

interface Props {
  profile: any
  tutorProfile: any
  sessions: any[]
  reviews: any[]
  payouts: any[]
  availability: any[]
}

export default function TutorDashboardClient({ profile, tutorProfile, sessions: sessionsProp, reviews, payouts, availability: initialAvailability }: Props) {
  const router = useRouter()
  const { theme } = useTutorTheme()
  const isDark = theme === 'dark'

  const [sessions, setSessions] = useState(sessionsProp)
  // Keep local sessions in sync when the server component refreshes (e.g. realtime updates).
  useEffect(() => { setSessions(sessionsProp) }, [sessionsProp])

  const [tab, setTab] = useState<'overview' | 'sessions' | 'reviews' | 'earnings' | 'profile' | 'availability'>('overview')
  const [legalAccepted, setLegalAccepted] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('aceforge_legal_accepted') === 'true'
    return false
  })
  const [showLegal, setShowLegal] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('aceforge_legal_accepted') !== 'true'
    return true
  })
  const [isActive, setIsActive] = useState(tutorProfile?.is_active !== false)
  const [togglingActive, setTogglingActive] = useState(false)

  const [editingProfile, setEditingProfile] = useState(false)
  const [bio, setBio] = useState(tutorProfile?.bio ?? '')
  const [subjects, setSubjects] = useState<string[]>(tutorProfile?.subjects ?? [])
  const [languages, setLanguages] = useState<string[]>(tutorProfile?.languages ?? ['English'])
  const [subjectSearch, setSubjectSearch] = useState('')
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)
  const [langSearch, setLangSearch] = useState('')
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [venmo, setVenmo] = useState(tutorProfile?.venmo ?? '')
  const [paypal, setPaypal] = useState(tutorProfile?.paypal ?? '')
  const [zelle, setZelle] = useState(tutorProfile?.zelle ?? '')

  const [availability, setAvailability] = useState(initialAvailability)
  const [timezone, setTimezone] = useState(initialAvailability[0]?.timezone ?? 'America/New_York')
  const [saving, setSaving] = useState(false)

  const [meetLink, setMeetLink] = useState<Record<string, string>>({})
  const [confirmingSession, setConfirmingSession] = useState<string | null>(null)
  const [sessionFilter, setSessionFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'declined'>('all')

  // Follow-up proposal form state (keyed by the completed session id)
  const [followupOpen, setFollowupOpen] = useState<string | null>(null)
  const [followupLength, setFollowupLength] = useState<Record<string, number>>({})
  const [followupDate, setFollowupDate] = useState<Record<string, string>>({})
  const [followupTime, setFollowupTime] = useState<Record<string, string>>({})
  const [proposingFollowup, setProposingFollowup] = useState<string | null>(null)

  useEffect(() => {
    if (!tutorProfile?.id) return
    const supabase = createClient()
    const channel = supabase
      .channel('tutor-sessions-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tutoring_sessions',
        filter: `tutor_id=eq.${tutorProfile.id}`,
      }, () => {
        router.refresh()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [tutorProfile?.id])

  // Theme variables
  const accent = isDark ? 'rgb(99,102,241)' : 'rgb(234,88,12)'
  const accentBg = isDark ? 'rgba(99,102,241,0.1)' : 'rgba(234,88,12,0.1)'
  const accentBorder = isDark ? 'rgba(99,102,241,0.3)' : 'rgba(234,88,12,0.3)'
  const accentBg2 = isDark ? 'rgba(99,102,241,0.15)' : 'rgba(234,88,12,0.15)'
  const accentBg3 = isDark ? 'rgba(99,102,241,0.08)' : 'rgba(234,88,12,0.06)'
  const accentBorder2 = isDark ? 'rgba(99,102,241,0.2)' : 'rgba(234,88,12,0.2)'
  const pageBg = isDark ? 'linear-gradient(135deg, #0f0f1e, #1a1a2e, #16213e)' : 'linear-gradient(135deg, #fff5ef, #fff8f5)'
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(234,88,12,0.02)'
  const cardBg2 = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(234,88,12,0.015)'
  const cardBg3 = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(234,88,12,0.03)'
  const border1 = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(234,88,12,0.1)'
  const border2 = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(234,88,12,0.08)'
  const border3 = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(234,88,12,0.12)'
  const border4 = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(234,88,12,0.15)'
  const text1 = isDark ? 'white' : 'rgb(26,26,20)'
  const text2 = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,20,0.7)'
  const text3 = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,20,0.5)'
  const text4 = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,20,0.4)'
  const text5 = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(26,26,20,0.3)'
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'white'
  const inputBorder = `1px solid ${accentBorder}`
  const modalBg = isDark ? 'rgb(18,18,30)' : 'white'
  const btnGrad = isDark ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #ea580c, #f97316)'
  const dropdownBg = isDark ? 'rgb(18,18,30)' : 'white'
  const dropdownBorder = isDark ? 'rgba(99,102,241,0.2)' : 'rgba(234,88,12,0.15)'
  const langPillBg = isDark ? 'rgba(139,92,246,0.15)' : accentBg
  const langPillColor = isDark ? 'rgb(167,139,250)' : accent
  const langBorder = isDark ? 'rgba(139,92,246,0.3)' : accentBorder
  const optionBg = isDark ? '#1a1a2e' : 'white'

  const upcoming = sessions.filter(s => s.status === 'confirmed' && new Date(s.scheduled_at) > new Date())
  const pending = sessions.filter(s => s.status === 'pending')
  const completed = sessions.filter(s => s.status === 'completed')
  const totalEarned = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const pendingPayout = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const weeklyEarned = payouts.filter(p => p.status === 'paid' && new Date(p.paid_at) > weekAgo).reduce((sum, p) => sum + p.amount, 0)

  const statusColors: Record<string, string> = {
    completed: 'rgb(74,222,128)', confirmed: accent, disputed: 'rgb(248,113,113)',
    pending: 'rgb(251,191,36)', declined: 'rgb(107,107,88)', proposed: 'rgb(96,165,250)'
  }
  const statusBgs: Record<string, string> = {
    completed: 'rgba(34,197,94,0.1)', confirmed: accentBg, disputed: 'rgba(239,68,68,0.1)',
    pending: 'rgba(234,179,8,0.1)', declined: 'rgba(107,107,88,0.1)', proposed: 'rgba(59,130,246,0.12)'
  }

  function toggleSubject(sub: string) {
    setSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub])
  }
  function toggleLanguage(lang: string) {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])
  }
  function addSlot() {
    setAvailability((prev: any) => [...prev, { id: Date.now().toString(), day_of_week: 1, start_time: '09:00', end_time: '17:00', timezone }])
  }
  function removeSlot(id: string) {
    setAvailability((prev: any) => prev.filter((a: any) => a.id !== id))
  }
  function updateSlot(id: string, field: string, value: any) {
    setAvailability((prev: any) => prev.map((a: any) => a.id === id ? { ...a, [field]: value } : a))
  }

  async function saveProfile() {
    setSaving(true)
    try {
      await fetch('/api/tutor/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, subjects, languages, hourlyRate: tutorProfile?.hourly_rate ?? 30, availability, timezone, tutorId: tutorProfile?.id, venmo, paypal, zelle }),
      })
      setEditingProfile(false)
    } catch {}
    setSaving(false)
  }

  async function toggleActive() {
    setTogglingActive(true)
    try {
      await fetch('/api/tutor/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId: tutorProfile?.id, isActive: !isActive }),
      })
      setIsActive(!isActive)
    } catch {}
    setTogglingActive(false)
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

  async function proposeFollowup(session: any) {
    const length = followupLength[session.id] ?? 60
    const date = followupDate[session.id]
    const time = followupTime[session.id]
    if (!date || !time) { alert('Please pick a date and time for the follow-up'); return }
    const scheduledAt = new Date(`${date}T${time}`)
    if (scheduledAt < new Date()) { alert('Please pick a future date and time'); return }
    setProposingFollowup(session.id)
    try {
      const res = await fetch('/api/tutoring/propose-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, sessionLength: length, scheduledAt: scheduledAt.toISOString() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert(`Could not propose follow-up: ${data.error ?? `server returned ${res.status}`}`); setProposingFollowup(null); return }
      alert('✅ Follow-up proposed! The student has been notified via chat and email.')
      setFollowupOpen(null)
    } catch (err: any) {
      alert(`Could not propose follow-up: ${err?.message ?? 'network error'}`)
    }
    setProposingFollowup(null)
  }

  async function declineSession(sessionId: string, paymentIntentId: string) {
    if (!confirm('Decline this session? The student will be automatically refunded.')) return
    setConfirmingSession(sessionId)
    try {
      const res = await fetch('/api/tutor/decline-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, paymentIntentId }),
      })
      const responseText = await res.clone().text()
      console.log('decline status:', res.status, 'body:', responseText)
      if (!res.ok) {
        alert('Decline failed: ' + responseText)
        setConfirmingSession(null)
        return
      }
      // Reactively drop the declined session from the dashboard.
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (err: any) {
      console.error('[declineSession] error:', err)
      alert(`Could not decline session: ${err?.message ?? 'network error'}`)
    }
    setConfirmingSession(null)
  }

  async function completeSession(sessionId: string) {
    if (!confirm('Mark this session as complete?')) return
    try {
      await fetch('/api/tutor/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      window.location.reload()
    } catch {}
  }

  const filteredSubjects = ALL_SUBJECTS.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase()) && !subjects.includes(s) && !COMMON_SUBJECTS.includes(s))
  const filteredLangs = ALL_LANGUAGES.filter(l => l.toLowerCase().includes(langSearch.toLowerCase()) && !languages.includes(l))

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'sessions', label: '📅 Sessions' + (pending.length > 0 ? ' (' + pending.length + ')' : '') },
    { id: 'reviews', label: '⭐ Reviews' },
    { id: 'earnings', label: '💰 Earnings' },
    { id: 'availability', label: '🕐 Availability' },
    { id: 'profile', label: '👤 My Profile' },
  ] as const

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem', background: pageBg }}>

      {/* Legal banner */}
      {showLegal && (
        <div style={{ background: 'rgba(163,45,45,0.12)', borderBottom: '1px solid rgba(163,45,45,0.25)', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚖️</span>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,180,180,0.9)', lineHeight: 1.6 }}>
              <strong>Legal Reminder:</strong> All tutoring sessions must be conducted exclusively through AceForge. Soliciting students outside the platform is a violation of your tutor agreement and may result in permanent ban and legal action. Sessions are recorded.{' '}
              <a href="/tutoring/legal" style={{ color: 'rgba(255,180,180,0.9)', fontWeight: 700, textDecoration: 'underline' }}>View full policy →</a>
            </p>
          </div>
          <button onClick={() => setShowLegal(false)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '0.625rem', background: 'rgba(163,45,45,0.3)', border: '1px solid rgba(163,45,45,0.4)', color: 'rgba(255,200,200,0.9)', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
            ✓ I Understand
          </button>
        </div>
      )}

      {/* Legal modal — blocks until accepted */}
      {!legalAccepted && showLegal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: modalBg, borderRadius: '1.25rem', padding: '2.5rem', maxWidth: '32rem', width: '100%', border: `1px solid ${accentBorder}`, boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem' }}>⚖️</div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: text1, textAlign: 'center', marginBottom: '1rem' }}>Before You Continue</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                'All sessions must be conducted exclusively through AceForge',
                'Soliciting students outside the platform is a breach of contract',
                'All sessions are recorded for quality assurance',
                'Violations may result in permanent ban and legal action',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                  <span style={{ color: accent, flexShrink: 0, marginTop: '0.125rem' }}>•</span>
                  <p style={{ fontSize: '0.875rem', color: text2, lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
            <a href="/tutoring/legal" target="_blank" style={{ display: 'block', textAlign: 'center', color: accent, fontSize: '0.875rem', marginBottom: '1.25rem', textDecoration: 'underline' }}>
              Read full tutor policy →
            </a>
            <button onClick={() => { localStorage.setItem('aceforge_legal_accepted', 'true'); setLegalAccepted(true) }}
              style={{ width: '100%', padding: '1rem', borderRadius: '0.875rem', background: btnGrad, border: 'none', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              ✓ I Understand & Agree — Continue to Dashboard
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: btnGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0, boxShadow: `0 4px 20px ${accentBg2}` }}>
            {profile?.display_name?.[0] ?? '?'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: text1, marginBottom: '0.375rem' }}>
              {tutorProfile?.display_name} 🎓
            </h1>
            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '9999px', background: 'rgba(34,197,94,0.15)', color: 'rgb(74,222,128)', border: '1px solid rgba(34,197,94,0.3)' }}>
                ✅ Approved Tutor
              </span>
              {avgRating && (
                <span style={{ fontSize: '0.875rem', color: 'rgb(251,191,36)' }}>⭐ {avgRating} ({reviews.length} reviews)</span>
              )}
              <button onClick={toggleActive} disabled={togglingActive}
                style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.75rem', borderRadius: '9999px', background: isActive ? 'rgba(34,197,94,0.15)' : 'rgba(107,107,88,0.15)', color: isActive ? 'rgb(74,222,128)' : text4, border: `1px solid ${isActive ? 'rgba(34,197,94,0.3)' : 'rgba(107,107,88,0.3)'}`, cursor: 'pointer' }}>
                {togglingActive ? '...' : isActive ? '🟢 Active' : '⚫ Inactive — Click to activate'}
              </button>
            </div>
          </div>
        </div>

        {/* Inactive warning */}
        {!isActive && (
          <div style={{ padding: '1rem 1.5rem', borderRadius: '0.875rem', background: 'rgba(107,107,88,0.1)', border: '1px solid rgba(107,107,88,0.3)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚫</span>
            <p style={{ fontSize: '0.875rem', color: text3 }}>
              Your profile is currently <strong style={{ color: text2 }}>inactive</strong>. Students cannot find or book you. Click the toggle above to go active again.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '2rem', borderBottom: `2px solid ${accentBorder2}`, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '0.625rem 1.125rem', fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? text1 : text4, background: 'transparent', border: 'none', cursor: 'pointer', borderBottom: tab === t.id ? `2px solid ${accent}` : '2px solid transparent', marginBottom: '-2px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Earned', value: `$${totalEarned.toFixed(2)}`, emoji: '💰', color: 'rgb(74,222,128)', bg: 'rgba(34,197,94,0.1)' },
                { label: 'This Week', value: `$${weeklyEarned.toFixed(2)}`, emoji: '📈', color: accent, bg: accentBg },
                { label: 'Pending Payout', value: `$${pendingPayout.toFixed(2)}`, emoji: '⏳', color: 'rgb(251,191,36)', bg: 'rgba(234,179,8,0.1)' },
                { label: 'Sessions Done', value: completed.length, emoji: '✅', color: 'rgb(74,222,128)', bg: 'rgba(34,197,94,0.1)' },
                { label: 'Avg Rating', value: avgRating ? `${avgRating}⭐` : '—', emoji: '⭐', color: 'rgb(251,191,36)', bg: 'rgba(234,179,8,0.1)' },
                { label: 'Upcoming', value: upcoming.length, emoji: '📅', color: accent, bg: accentBg },
              ].map(s => (
                <div key={s.label} style={{ padding: '1.25rem', borderRadius: '1rem', background: s.bg, border: `1px solid ${s.color}33`, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{s.emoji}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: s.color, marginBottom: '0.25rem' }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {pending.length > 0 && (
              <div style={{ padding: '1.5rem', borderRadius: '1rem', background: 'rgba(234,179,8,0.08)', border: '2px solid rgba(234,179,8,0.2)', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: text1, marginBottom: '1rem' }}>
                  ⏳ Pending Session Requests ({pending.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pending.map(s => (
                    <div key={s.id} style={{ padding: '1.25rem', borderRadius: '0.875rem', background: cardBg3, border: '1px solid rgba(234,179,8,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <p style={{ fontWeight: 700, color: text1, fontSize: '1rem' }}>{s.profiles?.display_name ?? 'Student'}</p>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(234,179,8,0.15)', color: 'rgb(251,191,36)' }}>⏳ Awaiting your response</span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '0.625rem', marginBottom: '0.875rem' }}>
                            {[
                              { label: 'Subject', value: s.subject },
                              { label: 'Topic', value: s.topic },
                              { label: 'Grade', value: s.grade },
                              { label: 'Language', value: s.language },
                              { label: 'Duration', value: s.session_length + ' min' },
                              { label: 'Scheduled', value: new Date(s.scheduled_at).toLocaleString() },
                              { label: 'Your Payout', value: '$' + s.tutor_payout },
                            ].filter(item => item.value).map(item => (
                              <div key={item.label} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: cardBg }}>
                                <p style={{ fontSize: '0.625rem', fontWeight: 700, color: text5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{item.label}</p>
                                <p style={{ fontSize: '0.875rem', color: text2, fontWeight: 500 }}>{item.value}</p>
                              </div>
                            ))}
                          </div>

                          {s.wants_continuing && (
                            <div style={{ padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', marginBottom: '0.5rem' }}>
                              <p style={{ fontSize: '0.8125rem', color: 'rgb(134,239,172)', fontWeight: 600 }}>🔁 Student interested in ongoing sessions</p>
                            </div>
                          )}

                          {s.file_urls?.length > 0 && (
                            <div style={{ padding: '0.75rem', borderRadius: '0.625rem', background: cardBg, border: `1px solid ${border3}`, marginBottom: '0.5rem' }}>
                              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: text4, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>📎 Student uploaded files</p>
                              {s.file_urls.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: '0.875rem', color: accent, textDecoration: 'none', display: 'block', marginBottom: '0.25rem' }}>
                                  📄 File {i + 1} →
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '220px' }}>
                          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: text4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Main Session Meet Link</p>
                          <input value={meetLink[s.id] ?? ''} onChange={e => setMeetLink(prev => ({ ...prev, [s.id]: extractMeetLink(e.target.value) }))}
                            placeholder="Paste Google Meet link"
                            style={{ padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: inputBorder, background: inputBg, color: text1, fontSize: '0.8125rem', outline: 'none' }} />
                          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.25rem' }}>
                            Paste the Meet link or the full calendar invite — we'll extract the link automatically
                          </p>
                          <button onClick={() => confirmSession(s.id)} disabled={confirmingSession === s.id}
                            style={{ padding: '0.625rem 1rem', borderRadius: '0.625rem', background: btnGrad, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                            {confirmingSession === s.id ? 'Processing...' : '✅ Accept & Send Link'}
                          </button>
                          <a href={`/tutoring/session/${s.id}`}
                            style={{ padding: '0.625rem 1rem', borderRadius: '0.625rem', background: accentBg, border: `1px solid ${accentBorder}`, color: accent, textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                            💬 Message Student
                          </a>
                          <button onClick={() => declineSession(s.id, s.stripe_payment_intent_id)} disabled={confirmingSession === s.id}
                            style={{ padding: '0.625rem 1rem', borderRadius: '0.625rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgb(248,113,113)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                            ❌ Decline (Auto-refund student)
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div style={{ padding: '1.5rem', borderRadius: '1rem', background: accentBg3, border: `1px solid ${accentBorder2}`, marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: text1, marginBottom: '1rem' }}>📅 Upcoming Sessions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {upcoming.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '0.875rem', background: cardBg, border: `1px solid ${accentBorder2}`, flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: text1, marginBottom: '0.25rem' }}>{s.profiles?.display_name ?? 'Student'}</p>
                        <p style={{ fontSize: '0.875rem', color: text3 }}>{s.subject} · {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {s.meet_link && (
                          <a href={safeMeetLink(s.meet_link)} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: btnGrad, color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                            🎥 Join Meet
                          </a>
                        )}
                        <a href={`/tutoring/session/${s.id}`}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: accentBg2, border: `1px solid ${accentBorder}`, color: accent, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                          💬 Message Student
                        </a>
                        <button onClick={() => completeSession(s.id)}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: 'rgb(74,222,128)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                          ✅ Mark Complete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pending.length === 0 && upcoming.length === 0 && (
              <div style={{ padding: '3rem', borderRadius: '1rem', background: cardBg2, border: `1px solid ${border2}`, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                <p style={{ color: text3 }}>No active sessions right now. Students will book you once your profile is visible.</p>
              </div>
            )}
          </div>
        )}

        {/* SESSIONS */}
        {tab === 'sessions' && (() => {
          const FILTERS = [
            { id: 'all', label: 'All', count: sessions.length },
            { id: 'pending', label: 'Pending', count: sessions.filter(s => s.status === 'pending').length },
            { id: 'confirmed', label: 'Confirmed', count: sessions.filter(s => s.status === 'confirmed').length },
            { id: 'completed', label: 'Completed', count: sessions.filter(s => s.status === 'completed').length },
            { id: 'declined', label: 'Declined', count: sessions.filter(s => s.status === 'declined').length },
          ] as const
          const visibleSessions = sessionFilter === 'all' ? sessions : sessions.filter(s => s.status === sessionFilter)

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {FILTERS.map(f => {
                const active = sessionFilter === f.id
                return (
                  <button key={f.id} onClick={() => setSessionFilter(f.id as any)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                      background: active ? btnGrad : cardBg3, color: active ? 'white' : text3,
                      border: `1px solid ${active ? 'transparent' : border3}`, whiteSpace: 'nowrap' }}>
                    {f.label}{f.count > 0 ? ` (${f.count})` : ''}
                  </button>
                )
              })}
            </div>

            {visibleSessions.length === 0 && (
              <div style={{ padding: '3rem', borderRadius: '1rem', background: cardBg2, border: `1px solid ${border2}`, textAlign: 'center', color: text4 }}>
                {sessionFilter === 'all' ? 'No sessions yet.' : `No ${sessionFilter} sessions.`}
              </div>
            )}
            {visibleSessions.map(s => {
              const isCompleted = s.status === 'completed'
              return (
              <div key={s.id} style={{ padding: '1.25rem', borderRadius: '1rem', background: isCompleted ? 'rgba(34,197,94,0.06)' : cardBg, border: `1px solid ${isCompleted ? 'rgba(34,197,94,0.25)' : border1}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                      <p style={{ fontWeight: 600, color: text1 }}>{s.profiles?.display_name ?? 'Student'}</p>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: statusBgs[s.status] ?? cardBg3, color: statusColors[s.status] ?? text1 }}>
                        {s.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: text3, marginBottom: '0.25rem' }}>{s.subject} — {s.topic}</p>
                    <p style={{ fontSize: '0.875rem', color: text3 }}>📅 {new Date(s.scheduled_at).toLocaleString()} · {s.session_length} min · ${s.tutor_payout}</p>
                    {isCompleted && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {[
                          { label: 'Student', value: s.profiles?.display_name ?? 'Student' },
                          { label: 'Subject', value: s.subject },
                          { label: 'Topic', value: s.topic },
                          { label: 'Grade', value: s.grade },
                          { label: 'Language', value: s.language },
                          { label: 'Duration', value: s.session_length + ' min' },
                          { label: 'Date', value: new Date(s.scheduled_at).toLocaleString() },
                          { label: 'Your Payout', value: '$' + s.tutor_payout },
                        ].filter(item => item.value).map(item => (
                          <div key={item.label} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: cardBg }}>
                            <p style={{ fontSize: '0.625rem', fontWeight: 700, color: text5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{item.label}</p>
                            <p style={{ fontSize: '0.8125rem', color: text2, fontWeight: 500 }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {s.status === 'confirmed' && s.meet_link && (
                    <a href={safeMeetLink(s.meet_link)} target="_blank" rel="noopener noreferrer"
                      style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: btnGrad, color: 'white', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                      🎥 Join
                    </a>
                  )}
                  {isCompleted && (
                    <button onClick={() => setFollowupOpen(followupOpen === s.id ? null : s.id)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: accentBg2, border: `1px solid ${accentBorder}`, color: accent, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      📅 Propose Follow-up
                    </button>
                  )}
                </div>

                {isCompleted && followupOpen === s.id && (
                  <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.75rem', background: cardBg3, border: `1px solid ${accentBorder2}` }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: text2, marginBottom: '0.75rem' }}>📅 Propose a follow-up session with {s.profiles?.display_name ?? 'this student'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '0.625rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: text4, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Subject</label>
                        <input value={s.subject} readOnly
                          style={{ width: '100%', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', border: inputBorder, background: inputBg, color: text2, fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: text4, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Length</label>
                        <select value={followupLength[s.id] ?? 60} onChange={e => setFollowupLength(prev => ({ ...prev, [s.id]: parseInt(e.target.value) }))}
                          style={{ width: '100%', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', border: inputBorder, background: inputBg, color: text1, fontSize: '0.8125rem', outline: 'none' }}>
                          <option value={30} style={{ background: optionBg }}>30 minutes</option>
                          <option value={60} style={{ background: optionBg }}>60 minutes</option>
                          <option value={90} style={{ background: optionBg }}>90 minutes</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: text4, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Date</label>
                        <input type="date" value={followupDate[s.id] ?? ''} min={new Date().toISOString().split('T')[0]} onChange={e => setFollowupDate(prev => ({ ...prev, [s.id]: e.target.value }))}
                          style={{ width: '100%', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', border: inputBorder, background: inputBg, color: text1, fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: text4, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Time</label>
                        <input type="time" value={followupTime[s.id] ?? ''} onChange={e => setFollowupTime(prev => ({ ...prev, [s.id]: e.target.value }))}
                          style={{ width: '100%', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', border: inputBorder, background: inputBg, color: text1, fontSize: '0.8125rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <button onClick={() => proposeFollowup(s)} disabled={proposingFollowup === s.id}
                      style={{ padding: '0.5rem 1.25rem', borderRadius: '0.625rem', background: btnGrad, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                      {proposingFollowup === s.id ? 'Proposing...' : 'Propose Follow-up'}
                    </button>
                  </div>
                )}
              </div>
            )})}
          </div>
          )
        })()}

        {/* REVIEWS */}
        {tab === 'reviews' && (
          <div>
            {reviews.length === 0 ? (
              <div style={{ padding: '3rem', borderRadius: '1rem', background: cardBg2, border: `1px solid ${border2}`, textAlign: 'center', color: text4 }}>
                No reviews yet. Complete your first session to start receiving reviews.
              </div>
            ) : (
              <>
                <div style={{ padding: '2rem', borderRadius: '1rem', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'rgb(251,191,36)', fontFamily: 'Syne, sans-serif' }}>{avgRating}</div>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{'⭐'.repeat(Math.round(Number(avgRating)))}</div>
                  <p style={{ color: text3 }}>Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ padding: '1.25rem', borderRadius: '1rem', background: cardBg, border: `1px solid ${border1}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: btnGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                          {r.profiles?.display_name?.[0] ?? '?'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: text1 }}>{r.profiles?.display_name ?? 'Student'}</p>
                          <p style={{ fontSize: '0.75rem', color: text4 }}>{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '1.125rem' }}>{'⭐'.repeat(r.rating)}</div>
                      </div>
                      {r.comment && <p style={{ fontSize: '0.9375rem', color: text2, lineHeight: 1.7 }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* EARNINGS */}
        {tab === 'earnings' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Earned', value: `$${totalEarned.toFixed(2)}`, color: 'rgb(74,222,128)', bg: 'rgba(34,197,94,0.1)' },
                { label: 'This Week', value: `$${weeklyEarned.toFixed(2)}`, color: accent, bg: accentBg },
                { label: 'Pending Payout', value: `$${pendingPayout.toFixed(2)}`, color: 'rgb(251,191,36)', bg: 'rgba(234,179,8,0.1)' },
              ].map(s => (
                <div key={s.label} style={{ padding: '1.5rem', borderRadius: '1rem', background: s.bg, border: `1px solid ${s.color}33`, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{s.label}</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '1.5rem', borderRadius: '1rem', background: cardBg, border: `1px solid ${border1}` }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: text1, marginBottom: '1rem' }}>Payout History</h2>
              {payouts.length === 0 ? (
                <p style={{ color: text4, textAlign: 'center', padding: '2rem' }}>No payouts yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {payouts.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', borderRadius: '0.75rem', background: p.status === 'paid' ? 'rgba(34,197,94,0.06)' : 'rgba(234,179,8,0.06)', border: `1px solid ${p.status === 'paid' ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)'}` }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: text1 }}>${p.amount.toFixed(2)}</p>
                        <p style={{ fontSize: '0.8125rem', color: text4 }}>
                          {p.paid_at ? `Paid ${new Date(p.paid_at).toLocaleDateString()} via ${p.paid_via}` : 'Pending'}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.625rem', borderRadius: '9999px', background: p.status === 'paid' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)', color: p.status === 'paid' ? 'rgb(74,222,128)' : 'rgb(251,191,36)' }}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AVAILABILITY */}
        {tab === 'availability' && (
          <div style={{ padding: '2rem', borderRadius: '1rem', background: cardBg, border: `1px solid ${border1}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: text1 }}>Weekly Availability</h2>
              <select value={timezone} onChange={e => setTimezone(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: inputBorder, background: inputBg, color: text1, fontSize: '0.8125rem', outline: 'none' }}>
                {TIMEZONES.map(tz => <option key={tz} value={tz} style={{ background: optionBg }}>{tz.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {(availability as any[]).map((a: any) => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: text3, display: 'block', marginBottom: '0.375rem' }}>Day</label>
                    <select value={a.day_of_week} onChange={e => updateSlot(a.id, 'day_of_week', parseInt(e.target.value))}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: inputBorder, background: inputBg, color: text1, fontSize: '0.875rem', outline: 'none' }}>
                      {DAYS.map((d, i) => <option key={d} value={i} style={{ background: optionBg }}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: text3, display: 'block', marginBottom: '0.375rem' }}>From</label>
                    <input type="time" value={a.start_time} onChange={e => updateSlot(a.id, 'start_time', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: inputBorder, background: inputBg, color: text1, fontSize: '0.875rem', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: text3, display: 'block', marginBottom: '0.375rem' }}>To</label>
                    <input type="time" value={a.end_time} onChange={e => updateSlot(a.id, 'end_time', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: inputBorder, background: inputBg, color: text1, fontSize: '0.875rem', outline: 'none' }} />
                  </div>
                  <button onClick={() => removeSlot(a.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.625rem', cursor: 'pointer', color: 'rgb(248,113,113)', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X style={{ width: '1.125rem', height: '1.125rem' }} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={addSlot}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: accentBg, border: `1px solid ${accentBorder}`, color: accent, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                <Plus style={{ width: '1rem', height: '1rem' }} /> Add Slot
              </button>
              <button onClick={saveProfile} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', borderRadius: '0.75rem', background: btnGrad, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {tab === 'profile' && (
          <div style={{ padding: '2rem', borderRadius: '1rem', background: cardBg, border: `1px solid ${border1}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: text1 }}>Your Public Profile</h2>
              {!editingProfile ? (
                <button onClick={() => setEditingProfile(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.75rem', background: accentBg, border: `1px solid ${accentBorder}`, color: accent, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                  <Edit style={{ width: '0.875rem', height: '0.875rem' }} /> Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setEditingProfile(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', background: cardBg3, border: `1px solid ${border4}`, color: text2, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                    <X style={{ width: '0.875rem', height: '0.875rem' }} /> Cancel
                  </button>
                  <button onClick={saveProfile} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', borderRadius: '0.75rem', background: btnGrad, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                    <Save style={{ width: '0.875rem', height: '0.875rem' }} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: text3, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>Bio</label>
                {editingProfile ? (
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={5} style={{ resize: 'vertical', width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: inputBorder, background: inputBg, color: text1, fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }} />
                ) : (
                  <p style={{ fontSize: '0.9375rem', color: text2, lineHeight: 1.7, padding: '0.75rem 1rem', background: cardBg2, borderRadius: '0.75rem', border: `1px solid ${border2}` }}>
                    {bio || 'No bio yet'}
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: text3, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>Subjects</label>
                {editingProfile ? (
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {COMMON_SUBJECTS.map(sub => (
                        <button key={sub} type="button" onClick={() => toggleSubject(sub)}
                          style={{ padding: '0.375rem 0.875rem', borderRadius: '9999px', border: `1.5px solid ${subjects.includes(sub) ? accent : accentBorder2}`, background: subjects.includes(sub) ? accentBg : 'transparent', color: subjects.includes(sub) ? accent : text4, fontSize: '0.8125rem', fontWeight: subjects.includes(sub) ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
                          {sub}
                        </button>
                      ))}
                    </div>
                    {subjects.filter(s => !COMMON_SUBJECTS.includes(s)).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                        {subjects.filter(s => !COMMON_SUBJECTS.includes(s)).map(sub => (
                          <span key={sub} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: accentBg, color: accent, fontSize: '0.8125rem', fontWeight: 600 }}>
                            {sub}
                            <button type="button" onClick={() => toggleSubject(sub)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: accent, padding: 0 }}>
                              <X style={{ width: '0.75rem', height: '0.75rem' }} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ position: 'relative' }}>
                      <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: text5 }} />
                      <input value={subjectSearch} onChange={e => { setSubjectSearch(e.target.value); setShowSubjectDropdown(true) }}
                        onFocus={() => setShowSubjectDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 200)}
                        placeholder="Search other subjects..."
                        style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '0.625rem', border: inputBorder, background: inputBg, color: text1, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                      {showSubjectDropdown && subjectSearch && filteredSubjects.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: dropdownBg, border: `1px solid ${dropdownBorder}`, borderRadius: '0.75rem', boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(234,88,12,0.12)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', marginTop: '0.25rem' }}>
                          {filteredSubjects.slice(0, 20).map(sub => (
                            <button key={sub} type="button" onMouseDown={() => { toggleSubject(sub); setSubjectSearch('') }}
                              style={{ width: '100%', padding: '0.625rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: text2 }}
                              onMouseEnter={e => (e.currentTarget.style.background = accentBg)}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              {sub}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {subjects.map(s => (
                      <span key={s} style={{ padding: '0.375rem 0.875rem', borderRadius: '9999px', background: accentBg, color: accent, fontSize: '0.875rem', fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: text3, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>Languages</label>
                {editingProfile ? (
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                      {languages.map(lang => (
                        <span key={lang} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: langPillBg, color: langPillColor, fontSize: '0.875rem', fontWeight: 600 }}>
                          {lang}
                          <button type="button" onClick={() => toggleLanguage(lang)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: langPillColor, padding: 0 }}>
                            <X style={{ width: '0.75rem', height: '0.75rem' }} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: text5 }} />
                      <input value={langSearch} onChange={e => { setLangSearch(e.target.value); setShowLangDropdown(true) }}
                        onFocus={() => setShowLangDropdown(true)}
                        onBlur={() => setTimeout(() => setShowLangDropdown(false), 200)}
                        placeholder="Search and add languages..."
                        style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '0.625rem', border: `1px solid ${langBorder}`, background: inputBg, color: text1, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                      {showLangDropdown && filteredLangs.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: dropdownBg, border: `1px solid ${langBorder}`, borderRadius: '0.75rem', boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(234,88,12,0.12)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', marginTop: '0.25rem' }}>
                          {filteredLangs.slice(0, 20).map(lang => (
                            <button key={lang} type="button" onMouseDown={() => { toggleLanguage(lang); setLangSearch('') }}
                              style={{ width: '100%', padding: '0.625rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: text2 }}
                              onMouseEnter={e => (e.currentTarget.style.background = langPillBg)}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {languages.map(l => (
                      <span key={l} style={{ padding: '0.375rem 0.875rem', borderRadius: '9999px', background: langPillBg, color: langPillColor, fontSize: '0.875rem', fontWeight: 600 }}>{l}</span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: text3, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>Payment Info</label>
                {editingProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { label: 'Venmo', value: venmo, setter: setVenmo, placeholder: '@yourhandle' },
                      { label: 'PayPal', value: paypal, setter: setPaypal, placeholder: 'you@example.com' },
                      { label: 'Zelle', value: zelle, setter: setZelle, placeholder: 'Phone or email' },
                    ].map(item => (
                      <div key={item.label}>
                        <label style={{ fontSize: '0.75rem', color: text4, display: 'block', marginBottom: '0.25rem' }}>{item.label}</label>
                        <input value={item.value} onChange={e => item.setter(e.target.value)} placeholder={item.placeholder}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: inputBorder, background: inputBg, color: text1, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[{ label: 'Venmo', value: venmo }, { label: 'PayPal', value: paypal }, { label: 'Zelle', value: zelle }].filter(i => i.value).map(item => (
                      <div key={item.label} style={{ display: 'flex', gap: '0.75rem', padding: '0.625rem 1rem', borderRadius: '0.625rem', background: cardBg2, border: `1px solid ${border2}` }}>
                        <span style={{ fontSize: '0.8125rem', color: text4, minWidth: '60px' }}>{item.label}</span>
                        <span style={{ fontSize: '0.8125rem', color: text1, fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                    {!venmo && !paypal && !zelle && <p style={{ fontSize: '0.875rem', color: text5 }}>No payment info set</p>}
                  </div>
                )}
              </div>

              <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
                <p style={{ fontSize: '0.875rem', color: text3, marginBottom: '0.25rem' }}>Your payout rate</p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'rgb(74,222,128)' }}>${tutorProfile?.hourly_rate ?? 30}/hr</p>
                {(() => {
                  const canCustomRate = completed.length >= 10 && Number(avgRating) >= 4.5
                  return canCustomRate ? (
                    <p style={{ fontSize: '0.75rem', color: 'rgb(74,222,128)', fontWeight: 600, marginTop: '0.5rem' }}>✅ Custom rates unlocked! Contact support to update your rate.</p>
                  ) : (
                    <div style={{ marginTop: '0.5rem' }}>
                      <p style={{ fontSize: '0.75rem', color: text5 }}>
                        Custom rates unlock after <strong style={{ color: text3 }}>10 completed sessions</strong> with a <strong style={{ color: text3 }}>4.5★ average rating</strong>
                      </p>
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <div style={{ width: '80px', height: '4px', borderRadius: '9999px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (completed.length / 10) * 100)}%`, height: '100%', background: btnGrad, borderRadius: '9999px' }} />
                          </div>
                          <span style={{ fontSize: '0.6875rem', color: text5 }}>{completed.length}/10 sessions</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <div style={{ width: '80px', height: '4px', borderRadius: '9999px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (Number(avgRating ?? 0) / 4.5) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '9999px' }} />
                          </div>
                          <span style={{ fontSize: '0.6875rem', color: text5 }}>{avgRating ?? '0'}/4.5★</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
