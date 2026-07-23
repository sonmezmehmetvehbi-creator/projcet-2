'use client'
import TutoringModal from '@/components/ui/TutoringModal'
import AdSlot from '@/components/ui/AdSlot'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, FileText, Zap, Download, Sparkles, CalendarDays, Clock, ArrowRight, PenLine, GraduationCap, Play } from 'lucide-react'
import { formatTimeUntilMidnight } from '@/lib/resetTime'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/types'
import { useStudentTheme } from '@/app/contexts/StudentThemeContext'

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
  usage: { questions: number; worksheets: number; sat: number }
}

const USAGE_LIMITS = { questions: 2, worksheets: 2, sat: 1 } as const

// Content-type accent colors.
const GREEN = 'rgb(34,85,14)'
const BLUE = 'rgb(37,99,235)'
const PURPLE = 'rgb(124,58,237)'
const MUTED = 'var(--af-text-muted)'
const CARD_SHADOW = '0 4px 24px rgba(34,85,14,0.08)'

function sessionType(s: any): 'questions' | 'worksheets' | 'sat' | 'flashcards' {
  if (s.is_sat) return 'sat'
  if (s.output_type === 'flashcards') return 'flashcards'
  return s.output_type === 'worksheet' ? 'worksheets' : 'questions'
}
const TEAL = 'rgb(13,148,136)'
const TYPE_ACCENT: Record<string, string> = { questions: GREEN, worksheets: BLUE, sat: PURPLE, flashcards: TEAL }

// Count-up number animation using requestAnimationFrame.
function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{n.toLocaleString()}</>
}

function relativeDate(dateStr: string) {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const min = 60000, hr = 3600000, day = 86400000
  if (diff < min) return 'just now'
  if (diff < hr) { const m = Math.floor(diff / min); return `${m} minute${m !== 1 ? 's' : ''} ago` }
  if (diff < day) { const h = Math.floor(diff / hr); return `${h} hour${h !== 1 ? 's' : ''} ago` }
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const now = new Date()
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayDiff = Math.round((todayDay.getTime() - dDay.getTime()) / day)
  if (dayDiff === 1) return 'Yesterday'
  if (dayDiff > 1 && dayDiff < 7) return `${dayDiff} days ago`
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-US', sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
}

function usageBarColor(pct: number) {
  return pct >= 80 ? 'rgb(220,38,38)' : pct >= 50 ? 'rgb(217,119,6)' : GREEN
}

function subjectEmoji(name: string) {
  const s = (name || '').toLowerCase()
  if (/(sat|act)/.test(s)) return '🎯'
  if (/(calc|algebra|geometry|math|statistic|trig)/.test(s)) return '📐'
  if (/bio/.test(s)) return '🧬'
  if (/chem/.test(s)) return '⚗️'
  if (/phys/.test(s)) return '🔭'
  if (/(history|social|geograph|econ|gov)/.test(s)) return '📜'
  if (/(english|read|writ|literat|essay|language)/.test(s)) return '📖'
  if (/(cs|comput|program|coding)/.test(s)) return '💻'
  return '📚'
}

function DashboardInner({ profile, sessions, usage }: Props) {
  const searchParams = useSearchParams()
  const { theme } = useStudentTheme()
  const isDark = theme === 'dark'
  const tabParam = searchParams.get('tab')
  const initialTab = tabParam === 'pdfs' ? 'pdfs' : tabParam === 'sat' ? 'sat' : 'all'
  const [tab, setTab] = useState<'all' | 'questions' | 'worksheets' | 'sat' | 'pdfs'>(initialTab)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [showTutoring, setShowTutoring] = useState(false)
  const [resetIn, setResetIn] = useState('')
  const [greet, setGreet] = useState('Welcome back')
  const [bookAgain, setBookAgain] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const h = new Date().getHours()
    setGreet(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  useEffect(() => {
    const tick = () => setResetIn(formatTimeUntilMidnight())
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  // Requires the sessions table to be part of the Realtime publication:
  // ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
  useEffect(() => {
    if (!profile?.id) return
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-sessions-' + profile.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `user_id=eq.${profile.id}`,
      }, () => {
        router.refresh()
      })
      .subscribe((status: string) => {
        console.log('[Realtime] dashboard-sessions status:', status)
      })
    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  // Load past tutoring tutors for the "Book Again" row (client-side; the page
  // only passes study sessions). Degrades to hidden if none / not accessible.
  useEffect(() => {
    if (!profile?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('tutoring_sessions')
          .select('tutor_id, subject, created_at')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false })
        if (!data || data.length === 0) return
        const seen = new Map<string, any>()
        for (const s of data) { if (s.tutor_id && !seen.has(s.tutor_id)) seen.set(s.tutor_id, s) }
        const ids = Array.from(seen.keys())
        if (ids.length === 0) return
        const { data: tutors } = await supabase
          .from('tutor_profiles')
          .select('id, display_name, avatar_url, rating')
          .in('id', ids)
        if (cancelled) return
        setBookAgain((tutors ?? []).map(t => ({ ...t, lastSubject: seen.get(t.id)?.subject })))
      } catch {}
    })()
    return () => { cancelled = true }
  }, [profile?.id])

  const upgraded = searchParams.get('upgraded') === 'true'

  const filteredSessions = tab === 'pdfs'
    ? sessions.filter(s => s.pdf_downloaded)
    : tab === 'sat'
    ? sessions.filter(s => s.is_sat)
    : tab === 'questions'
    ? sessions.filter(s => !s.is_sat && s.output_type === 'questions')
    : tab === 'worksheets'
    ? sessions.filter(s => !s.is_sat && s.output_type === 'worksheet')
    : sessions

  const xp = (profile as any)?.xp ?? 0
  const streak = (profile as any)?.streak_count ?? 0
  const levelInfo = getLevelInfo(xp)
  const bonusGenerations = (profile as any)?.bonus_generations ?? 0

  // Stats.
  const totalSessions = sessions.length
  const questionsAnswered = sessions.reduce((n, s) => n + (s.content?.questions?.length ?? 0), 0)
  const worksheetsCreated = sessions.filter(s => !s.is_sat && s.output_type === 'worksheet').length
  const studyDays = (() => {
    const days = new Set(sessions.map(s => s.created_at ? new Date(s.created_at).toDateString() : null).filter(Boolean))
    return days.size > 0 ? days.size : streak
  })()

  // Top subjects by generation count for "Recommended for You" (fallback to popular).
  const recommendedSubjects = (() => {
    const counts = new Map<string, number>()
    for (const s of sessions) { if (s.subject) counts.set(s.subject, (counts.get(s.subject) ?? 0) + 1) }
    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(e => e[0]).slice(0, 3)
    return top.length > 0 ? top : ['SAT Math', 'Calculus', 'Biology']
  })()

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

  const firstName = profile?.display_name ? profile.display_name.split(' ')[0] : ''

  const STATS = [
    { label: 'Sessions Generated', value: totalSessions, icon: <BookOpen style={{ width: '1.25rem', height: '1.25rem' }} />, color: GREEN },
    { label: 'Questions Answered', value: questionsAnswered, icon: <Sparkles style={{ width: '1.25rem', height: '1.25rem' }} />, color: BLUE },
    { label: 'Worksheets Created', value: worksheetsCreated, icon: <PenLine style={{ width: '1.25rem', height: '1.25rem' }} />, color: PURPLE },
    { label: 'Study Days', value: studyDays, icon: <CalendarDays style={{ width: '1.25rem', height: '1.25rem' }} />, color: 'rgb(217,119,6)' },
  ]

  const QUICK_ACTIONS = [
    { href: '/generate', title: 'Generate Questions', desc: 'AI-made practice on any topic', icon: <BookOpen style={{ width: '2rem', height: '2rem', color: 'white' }} />, color: GREEN, grad: 'linear-gradient(135deg, rgb(34,85,14), rgb(59,130,46))' },
    { href: '/sat', title: 'Practice SAT', desc: 'Timed, digital-SAT-style modules', icon: <Clock style={{ width: '2rem', height: '2rem', color: 'white' }} />, color: BLUE, grad: 'linear-gradient(135deg, rgb(37,99,235), rgb(96,165,250))' },
    { href: '/generate?type=worksheet', title: 'Create Worksheet', desc: 'Printable study worksheets', icon: <PenLine style={{ width: '2rem', height: '2rem', color: 'white' }} />, color: PURPLE, grad: 'linear-gradient(135deg, rgb(124,58,237), rgb(167,139,250))' },
  ]

  const SESSION_TABS = [
    { value: 'all', label: 'All' },
    { value: 'questions', label: 'Questions' },
    { value: 'worksheets', label: 'Worksheets' },
    { value: 'sat', label: 'SAT' },
    { value: 'pdfs', label: 'My PDFs' },
  ] as const

  return (
    <div className={`animate-fade-in ${isDark ? 'student-dark' : ''}`} style={{ paddingTop: '5rem', minHeight: '100vh', background: 'var(--af-bg)' }}>
      <div style={{ display: 'flex', gap: '1.5rem', maxWidth: '100rem', margin: '0 auto' }}>

        {/* Left sidebar ad */}
        <div style={{ width: '160px', flexShrink: 0, padding: '2rem 0' }} className="dash-ad-sidebar">
          <AdSlot isPremium={profile?.is_premium ?? false} slot="2233445566" format="vertical" style={{ position: 'sticky', top: '5rem' }} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, padding: '2rem 1.5rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>

            {upgraded && (
              <div style={{ padding: '1rem 1.5rem', borderRadius: '1rem', background: 'linear-gradient(135deg, rgba(232,160,32,0.12), rgba(34,85,14,0.06))', border: '1px solid rgba(232,160,32,0.3)', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🎉</span>
                <div>
                  <p style={{ fontWeight: 700, color: GREEN, marginBottom: '0.125rem' }}>Welcome to Premium!</p>
                  <p style={{ fontSize: '0.875rem', color: MUTED }}>You now have unlimited generations and faster loading.</p>
                </div>
              </div>
            )}

            {/* ── HERO ── */}
            <div className="dash-hero" style={{
              borderRadius: '1.5rem', padding: '2rem 2.25rem', marginBottom: '2rem',
              background: 'linear-gradient(135deg, rgb(34,85,14), rgb(59,130,46))',
              color: 'white', boxShadow: '0 12px 40px rgba(34,85,14,0.25)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: '-40px', right: '-20px', fontSize: '10rem', opacity: 0.12, lineHeight: 1 }}>{levelInfo.current.emoji}</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', position: 'relative' }}>
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, marginBottom: '1.25rem', lineHeight: 1.2 }}>
                    {greet}{firstName ? `, ${firstName}` : ''}! 👋
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '2.25rem', lineHeight: 1 }}>{levelInfo.current.emoji}</span>
                    <div>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.125rem', lineHeight: 1.1 }}>Level {levelInfo.current.level}</p>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{levelInfo.current.name}</p>
                    </div>
                    <span style={{ marginLeft: 'auto', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem' }}>
                      <CountUp value={xp} /> <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.85 }}>XP</span>
                    </span>
                  </div>

                  {/* Animated XP bar */}
                  <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ height: '100%', borderRadius: '9999px', background: 'linear-gradient(90deg, #fff, rgba(255,255,255,0.7))', width: `${levelInfo.pct}%`, animation: 'barGrow 1.1s cubic-bezier(0.16,1,0.3,1) both' }} />
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', fontFamily: 'Syne, sans-serif' }}>
                    {levelInfo.next ? `Next level in ${levelInfo.next.xpRequired - xp} XP` : 'Max level reached 👑'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
                    <span style={{ fontSize: '1.25rem', animation: streak >= 3 ? 'fireAnim 0.8s ease-in-out infinite alternate' : 'none' }}>🔥</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.0625rem' }}>{streak} day streak</span>
                  </div>
                  {profile?.is_premium && (
                    <button onClick={() => setShowTutoring(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}>
                      <GraduationCap style={{ width: '1rem', height: '1rem' }} /> Request Tutoring
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── STATS ROW ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {STATS.map((s, i) => (
                <div key={s.label} className="stat-card"
                  style={{ padding: '1.25rem', borderRadius: '1.25rem', background: 'var(--af-card)', border: '1px solid var(--af-border)', boxShadow: CARD_SHADOW, animation: `riseIn 0.5s cubic-bezier(0.16,1,0.3,1) both`, animationDelay: `${0.1 * (i + 1)}s` }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: `${s.color}14`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
                    {s.icon}
                  </div>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.875rem', fontWeight: 800, color: 'var(--af-text)', lineHeight: 1 }}>
                    <CountUp value={s.value} />
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: MUTED, fontWeight: 600, marginTop: '0.375rem' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── DAILY USAGE ── */}
            {profile?.is_premium ? (
              <div style={{ padding: '1.25rem 1.5rem', borderRadius: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.875rem', background: 'linear-gradient(135deg, rgba(232,160,32,0.1), rgba(245,158,11,0.05))', border: '1px solid rgba(232,160,32,0.3)', boxShadow: CARD_SHADOW }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.875rem', background: 'linear-gradient(135deg, rgb(232,160,32), rgb(245,158,11))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                </div>
                <div>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.125rem', fontWeight: 800, color: 'rgb(180,120,10)' }}>Unlimited ⚡</p>
                  <p style={{ fontSize: '0.8125rem', color: MUTED }}>Questions, worksheets & SAT practice — no daily limits.</p>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1.5rem', borderRadius: '1.25rem', marginBottom: '2rem', background: 'var(--af-card)', border: '1px solid var(--af-border)', boxShadow: CARD_SHADOW }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--af-text)' }}>Today's usage</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {resetIn && <span style={{ fontSize: '0.8125rem', color: MUTED }}>⏰ Resets in {resetIn}</span>}
                    <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: GREEN, textDecoration: 'none' }}>
                      <Zap style={{ width: '0.875rem', height: '0.875rem' }} /> Upgrade
                    </Link>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                  {(['questions', 'worksheets', 'sat'] as const).map((type, i) => {
                    const used = usage[type]
                    const cap = USAGE_LIMITS[type]
                    const pct = Math.min((used / cap) * 100, 100)
                    const label = type === 'sat' ? 'SAT practice' : type
                    return (
                      <div key={type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--af-text)', fontWeight: 600, textTransform: 'capitalize' }}>{label}</span>
                          <span style={{ fontSize: '0.8125rem', color: MUTED, fontWeight: 600 }}>{used}/{cap}</span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(34,85,14,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '9999px', background: usageBarColor(pct), width: `${pct}%`, animation: 'barGrow 0.9s cubic-bezier(0.16,1,0.3,1) both', animationDelay: `${0.3 * i}s` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                {bonusGenerations > 0 && (
                  <div style={{ marginTop: '1.25rem', padding: '0.625rem 0.875rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.06)', border: '1px solid rgba(34,85,14,0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>🎁</span>
                    <p style={{ fontSize: '0.8125rem', color: GREEN, fontWeight: 600 }}>{bonusGenerations} bonus generation{bonusGenerations > 1 ? 's' : ''} available</p>
                  </div>
                )}
              </div>
            )}

            {/* ── QUICK ACTIONS ── */}
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '1rem' }}>Start studying</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {QUICK_ACTIONS.map((a, i) => (
                <Link key={a.href} href={a.href} className="qa-card"
                  style={{ textDecoration: 'none', padding: '1.5rem', borderRadius: '1.25rem', background: 'var(--af-card)', border: `1px solid ${a.color}22`, boxShadow: CARD_SHADOW, display: 'block', animation: `fadeUp 0.5s ease both`, animationDelay: `${0.1 * (i + 1)}s` }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: a.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: `0 8px 24px ${a.color}33` }}>
                    {a.icon}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--af-text)' }}>{a.title}</h3>
                    <ArrowRight className="qa-arrow" style={{ width: '1.125rem', height: '1.125rem', color: a.color, flexShrink: 0 }} />
                  </div>
                  <p style={{ fontSize: '0.875rem', color: MUTED, marginTop: '0.375rem' }}>{a.desc}</p>
                </Link>
              ))}
            </div>

            {/* ── CONTINUE YOUR JOURNEY ── */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '1rem' }}>Continue Your Journey 🚀</h2>
              <div className="journey-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderRadius: '1.25rem', background: 'var(--af-card)', border: '1px solid var(--af-border)', boxShadow: CARD_SHADOW, overflow: 'hidden' }}>

                {/* Left — Your Tutors */}
                <div className="journey-col" style={{ padding: '1.5rem', borderRight: '1px solid var(--af-border)' }}>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Your Tutors</p>
                  {bookAgain.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                      {bookAgain.slice(0, 3).map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {t.avatar_url ? (
                            <img src={t.avatar_url} alt={t.display_name} style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>{t.display_name?.[0] ?? '?'}</div>
                          )}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontWeight: 700, color: 'var(--af-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.display_name}</p>
                            <p style={{ fontSize: '0.75rem', color: MUTED }}>{t.lastSubject ? `${t.lastSubject} · ` : ''}⭐ {t.rating > 0 ? Number(t.rating).toFixed(1) : 'New'}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <Link href={`/tutoring/book/${t.id}`} style={{ padding: '0.35rem 0.7rem', borderRadius: '0.625rem', background: 'rgba(34,85,14,0.08)', border: '1px solid rgba(34,85,14,0.2)', color: GREEN, fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>Book Again →</Link>
                            <Link href={`/tutoring/tutor/${t.id}`} style={{ padding: '0.35rem 0.7rem', borderRadius: '0.625rem', background: 'transparent', border: '1px solid var(--af-border)', color: MUTED, fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>View Profile</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.875rem', color: MUTED, lineHeight: 1.6, marginBottom: '1rem' }}>
                        Work 1-on-1 with an expert tutor to level up faster. Browse verified tutors by subject.
                      </p>
                      <Link href="/tutoring" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.08)', border: '1px solid rgba(34,85,14,0.2)', color: GREEN, fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
                        Find a Tutor →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Right — Recommended for You */}
                <div className="journey-col" style={{ padding: '1.5rem' }}>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Recommended for You</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {recommendedSubjects.map(subj => (
                      <Link key={subj} href={`/generate?subject=${encodeURIComponent(subj)}`}
                        className="journey-rec"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.875rem', borderRadius: '0.875rem', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.15)', textDecoration: 'none' }}>
                        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{subjectEmoji(subj)}</span>
                        <span style={{ flex: 1, fontWeight: 600, color: 'var(--af-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subj}</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: BLUE, whiteSpace: 'nowrap' }}>Practice Now →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── RECENT SESSIONS ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: 'var(--af-text)' }}>Recent sessions</h2>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {SESSION_TABS.map(t => {
                  const active = tab === t.value
                  const count = t.value === 'pdfs' ? sessions.filter(s => s.pdf_downloaded).length : t.value === 'sat' ? sessions.filter(s => s.is_sat).length : 0
                  return (
                    <button key={t.value} onClick={() => setTab(t.value)} className="pill"
                      style={{ padding: '0.45rem 1rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                        background: active ? GREEN : 'var(--af-card)', color: active ? 'white' : MUTED,
                        border: `1px solid ${active ? GREEN : 'var(--af-border)'}` }}>
                      {t.label}{count > 0 ? ` (${count})` : ''}
                    </button>
                  )
                })}
              </div>
            </div>

            {filteredSessions.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '1.25rem', background: 'var(--af-card)', border: '1px dashed var(--af-border)' }}>
                <div style={{ width: '5rem', height: '5rem', borderRadius: '1.5rem', background: 'linear-gradient(135deg, rgba(34,85,14,0.1), rgba(59,130,46,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', animation: 'floaty 3s ease-in-out infinite' }}>
                  {tab === 'pdfs' ? <FileText style={{ width: '2.25rem', height: '2.25rem', color: GREEN }} /> : <BookOpen style={{ width: '2.25rem', height: '2.25rem', color: GREEN }} />}
                </div>
                <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '0.5rem' }}>
                  {tab === 'pdfs' ? 'No PDFs yet' : tab === 'sat' ? 'No SAT sessions yet' : 'Start your first session!'}
                </h3>
                <p style={{ color: MUTED, maxWidth: '24rem', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
                  {tab === 'pdfs'
                    ? 'Download a PDF from any session and it will appear here.'
                    : tab === 'sat'
                    ? 'Start your first SAT practice session and it will appear here.'
                    : 'Generate questions or a worksheet and your history will appear here.'}
                </p>
                <Link href={tab === 'sat' ? '/sat' : '/generate'} className="btn-primary" style={{ display: 'inline-flex' }}>
                  <Play style={{ width: '1rem', height: '1rem' }} />
                  {tab === 'sat' ? 'Start SAT Practice' : 'Start Studying'}
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {filteredSessions.map((session: any, i: number) => {
                  const type = sessionType(session)
                  const accent = TYPE_ACCENT[type]
                  const href = `/${session.output_type === 'questions' ? 'questions' : session.output_type === 'flashcards' ? 'flashcards' : 'worksheet'}/${session.id}`
                  const typeLabel = session.is_sat
                    ? (session.sat_module === 'math_no_calc' ? '📐 SAT Math (No Calc)' : session.sat_module === 'math_calc' ? '🔢 SAT Math (Calc)' : '📖 SAT R&W')
                    : session.output_type === 'questions' ? '❓ Questions' : session.output_type === 'flashcards' ? '🃏 Flashcards' : '📄 Worksheet'
                  return (
                    <div key={session.id} className="sess-card"
                      style={{ padding: '1.25rem 1.25rem 1.25rem 1.5rem', position: 'relative', borderRadius: '1.125rem', background: 'var(--af-card)', border: '1px solid var(--af-border)', borderLeft: `4px solid ${accent}`, boxShadow: CARD_SHADOW, animation: `fadeUp 0.4s ease both`, animationDelay: `${Math.min(i, 10) * 0.05}s` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: `${accent}14`, color: accent, whiteSpace: 'nowrap' }}>{typeLabel}</span>
                        <div className="sess-actions" style={{ display: 'flex', gap: '0.375rem' }}>
                          <Link href={href} title="Continue"
                            style={{ width: '1.875rem', height: '1.875rem', borderRadius: '0.5rem', background: `${accent}14`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                            <Play style={{ width: '0.9rem', height: '0.9rem' }} />
                          </Link>
                          {(session.pdf_downloaded || tab === 'pdfs') && (
                            <button onClick={() => redownloadPDF(session)} disabled={downloadingId === session.id} title="Download PDF"
                              style={{ width: '1.875rem', height: '1.875rem', borderRadius: '0.5rem', background: 'rgba(107,107,88,0.12)', color: 'var(--af-text-muted)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Download style={{ width: '0.9rem', height: '0.9rem' }} />
                            </button>
                          )}
                        </div>
                      </div>
                      <Link href={href} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--af-text)', marginBottom: '0.25rem', lineHeight: 1.3 }}>{session.topic}</h3>
                        <p style={{ fontSize: '0.8125rem', color: MUTED, marginBottom: '0.625rem' }}>
                          {session.subject} · {session.grade}
                          {session.output_type === 'flashcards' && session.content?.flashcards?.length
                            ? ` · ${session.content.flashcards.length} cards`
                            : ''}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(107,107,88,0.75)' }}>{relativeDate(session.created_at)}</p>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar ad */}
        <div style={{ width: '160px', flexShrink: 0, padding: '2rem 0' }} className="dash-ad-sidebar">
          <AdSlot isPremium={profile?.is_premium ?? false} slot="3344556677" format="vertical" style={{ position: 'sticky', top: '5rem' }} />
        </div>
      </div>

      {showTutoring && (
        <TutoringModal profile={profile} onClose={() => setShowTutoring(false)} />
      )}

      <style>{`
        .dash-ad-sidebar { display: none; }
        @media (min-width: 1280px) { .dash-ad-sidebar { display: block; } }
        @keyframes fireAnim { from { transform: scale(1) rotate(-3deg); } to { transform: scale(1.15) rotate(3deg); } }
        @keyframes barGrow { from { width: 0; } }
        @keyframes riseIn { from { opacity: 0; transform: translateY(20px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } }
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .dash-hero { animation: heroDown 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes heroDown { from { opacity: 0; transform: translateY(-20px); } }
        .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(34,85,14,0.14); }
        .qa-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .qa-card:hover { transform: scale(1.02); box-shadow: 0 14px 40px rgba(34,85,14,0.16); }
        .qa-arrow { transition: transform 0.2s ease; }
        .qa-card:hover .qa-arrow { transform: translateX(5px); }
        .sess-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .sess-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(34,85,14,0.12); }
        .sess-actions { opacity: 0; transition: opacity 0.2s ease; }
        .sess-card:hover .sess-actions { opacity: 1; }
        @media (hover: none) { .sess-actions { opacity: 1; } }
        .pill { transition: all 0.2s ease; }
        .journey-rec { transition: transform 0.2s ease, background 0.2s ease; }
        .journey-rec:hover { transform: translateX(4px); background: rgba(37,99,235,0.08); }
        @media (max-width: 700px) {
          .journey-card { grid-template-columns: 1fr !important; }
          .journey-col { border-right: none !important; border-bottom: 1px solid var(--af-border); }
          .journey-col:last-child { border-bottom: none; }
        }
      `}</style>
    </div>
  )
}

export default function DashboardClient(props: Props) {
  return (
    <Suspense fallback={<div style={{ paddingTop: '6rem', textAlign: 'center', color: 'var(--af-text-muted)' }}>Loading...</div>}>
      <DashboardInner {...props} />
    </Suspense>
  )
}
