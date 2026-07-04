'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Zap, Calculator, BookOpen, Check, ArrowRight, ChevronDown } from 'lucide-react'
import LimitReachedModal from '@/components/ui/LimitReachedModal'
import type { Profile } from '@/types'

interface Props {
  profile: Profile | null
  satUsage: number
}

const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'
const GREEN = 'rgb(34,85,14)'
const BLUE = 'rgb(37,99,235)'
const PURPLE = 'rgb(124,58,237)'

// Subject → API module + presentation. Math maps to the digital-SAT calculator
// module; Reading & Writing maps to reading_writing.
const SUBJECTS = [
  {
    id: 'math' as const,
    module: 'math_calc',
    icon: Calculator,
    title: 'SAT Math',
    desc: 'Algebra, Advanced Math, Problem Solving, Data Analysis',
    topics: ['Heart of Algebra', 'Passport to Advanced Math', 'Problem Solving & Data Analysis', 'Geometry & Trigonometry'],
    color: BLUE,
  },
  {
    id: 'rw' as const,
    module: 'reading_writing',
    icon: BookOpen,
    title: 'SAT Reading & Writing',
    desc: 'Information & Ideas, Craft & Structure, Expression of Ideas, Standard English',
    topics: ['Command of Evidence', 'Words in Context', 'Text Structure', 'Rhetorical Synthesis'],
    color: PURPLE,
  },
]

const TOPICS: Record<string, string[]> = {
  math: ['Heart of Algebra', 'Linear Equations', 'Systems of Equations', 'Quadratic Equations', 'Exponential Functions', 'Passport to Advanced Math', 'Polynomial Operations', 'Rational Equations', 'Radical Equations', 'Problem Solving & Data Analysis', 'Ratios & Proportions', 'Percentages & Statistics', 'Scatterplots & Data', 'Geometry & Trigonometry', 'Lines & Angles', 'Circles', 'Triangles', 'Trigonometric Functions'],
  rw: ['Command of Evidence', 'Textual Evidence', 'Quantitative Evidence', 'Words in Context', 'Vocabulary in Context', 'Text Structure & Purpose', 'Cross-text Connections', 'Central Ideas & Details', 'Inferences', 'Rhetorical Synthesis', 'Transitions', 'Boundaries (punctuation)', 'Form, Structure & Sense'],
}

const DIFFICULTIES = [
  { value: 'medium', label: 'Medium', desc: 'Matches average SAT difficulty', color: 'rgb(202,138,4)' },
  { value: 'hard', label: 'Hard', desc: 'Above average, for high scorers', color: 'rgb(217,119,6)' },
  { value: 'expert', label: 'Expert', desc: '800-level questions', color: 'rgb(220,38,38)' },
]

const QUESTION_COUNT = 22

export default function SATClient({ profile, satUsage }: Props) {
  const [subject, setSubject] = useState<'math' | 'rw' | ''>('')
  const [topic, setTopic] = useState('')
  const [mathModule, setMathModule] = useState<'math_calc' | 'math_no_calc'>('math_calc')
  const [difficulty, setDifficulty] = useState('medium')
  const [showFormat, setShowFormat] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [limitModal, setLimitModal] = useState<{ open: boolean; bonus: number }>({ open: false, bonus: 0 })
  const router = useRouter()

  const bonusGenerations = (profile as any)?.bonus_generations ?? 0
  const atLimit = !profile?.is_premium && satUsage >= 1 && bonusGenerations <= 0
  const selectedSubject = SUBJECTS.find(s => s.id === subject) ?? null
  const ready = !!subject && !!topic

  function pickSubject(id: 'math' | 'rw') {
    setSubject(id)
    setTopic('')
  }

  async function handleStart() {
    if (atLimit) { setLimitModal({ open: true, bonus: bonusGenerations }); return }
    if (!selectedSubject) return
    setError('')
    setLoading(true)
    // For SAT Math, the calculator toggle decides the module; otherwise use the subject's module.
    const apiModule = subject === 'math' ? mathModule : selectedSubject.module
    console.log('SAT generate request:', { subject: selectedSubject, module: apiModule, topic, difficulty, questionCount: QUESTION_COUNT })
    try {
      const res = await fetch('/api/sat-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSubject.title, module: apiModule, questionCount: QUESTION_COUNT, difficulty, topic }),
      })
      const data = await res.json()
      if (data.limitReached) {
        setLimitModal({ open: true, bonus: data.bonusRemaining ?? 0 })
        setLoading(false)
        return
      }
      if (data.error) throw new Error(data.error)
      router.push(`/questions/${data.sessionId}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) return <SatLoading subject={selectedSubject?.title ?? 'SAT'} topic={topic} />

  const summary = ready
    ? `${selectedSubject!.title} · ${topic} · ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`
    : 'Select a subject and topic to begin'

  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', paddingTop: '5rem', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

        {/* ── HERO ── */}
        <div style={{ borderRadius: '1.5rem', padding: '2.25rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgb(34,85,14), rgb(59,130,46))', color: 'white', boxShadow: '0 12px 40px rgba(34,85,14,0.25)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-10px', fontSize: '9rem', opacity: 0.12, lineHeight: 1 }}>📐</div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.1 }}>SAT Prep</h1>
              <span style={{ padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.9375rem' }}>400–1600</span>
              {profile?.is_premium && (
                <span style={{ padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'rgba(232,160,32,0.25)', border: '1px solid rgba(232,160,32,0.5)', fontWeight: 700, fontSize: '0.8125rem' }}>⚡ Premium</span>
              )}
            </div>
            <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.85)', marginBottom: '1.25rem' }}>College Board-style practice questions</p>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.45rem 0.875rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8125rem', fontWeight: 600 }}>📖 54 Reading & Writing questions</span>
              <span style={{ padding: '0.45rem 0.875rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8125rem', fontWeight: 600 }}>📐 54 Math questions</span>
            </div>
            {!profile?.is_premium && (
              <div style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', background: atLimit ? 'rgba(255,180,180,0.2)' : 'rgba(255,255,255,0.15)', border: `1px solid ${atLimit ? 'rgba(255,180,180,0.4)' : 'rgba(255,255,255,0.25)'}` }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  {atLimit ? '⚠️ Daily limit reached' : `1 free practice set per day · ${1 - satUsage} remaining today`}
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
            <div>
              {error}
              {atLimit && <a href="/pricing" style={{ display: 'block', marginTop: '0.25rem', fontWeight: 600, color: GREEN }}>Upgrade to Premium →</a>}
            </div>
          </div>
        )}

        {/* ── SUBJECT CARDS ── */}
        <p style={sectionLabel}>1 · Choose a subject</p>
        <div className="sat-subjects" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {SUBJECTS.map((s, i) => {
            const selected = subject === s.id
            const Icon = s.icon
            return (
              <button key={s.id} type="button" onClick={() => pickSubject(s.id)}
                className="sat-card" style={{ animationDelay: `${0.1 * (i + 1)}s`, textAlign: 'left', position: 'relative', padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer', border: `2px solid ${selected ? s.color : `${s.color}33`}`, background: selected ? s.color : 'white', color: selected ? 'white' : INK, boxShadow: '0 4px 24px rgba(34,85,14,0.06)', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}>
                {selected && <span style={{ position: 'absolute', top: '1rem', right: '1rem' }}><Check style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} /></span>}
                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.875rem', background: selected ? 'rgba(255,255,255,0.2)' : `${s.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
                  <Icon style={{ width: '1.5rem', height: '1.5rem', color: selected ? 'white' : s.color }} />
                </div>
                <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.375rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.875rem', color: selected ? 'rgba(255,255,255,0.85)' : MUTED, lineHeight: 1.5, marginBottom: '0.875rem' }}>{s.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {s.topics.map(t => (
                    <span key={t} style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: selected ? 'rgba(255,255,255,0.15)' : `${s.color}12`, color: selected ? 'white' : s.color }}>{t}</span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* ── TOPIC PILLS ── */}
        {subject && (
          <div className="sat-slide" style={{ marginBottom: '2rem' }}>
            <p style={sectionLabel}>2 · Pick a topic</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {TOPICS[subject].map(t => {
                const active = topic === t
                const accent = selectedSubject!.color
                return (
                  <button key={t} type="button" onClick={() => setTopic(t)}
                    style={{ padding: '0.5rem 0.95rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s ease', background: active ? `${accent}12` : 'white', color: active ? accent : INK, border: `1.5px solid ${active ? accent : 'rgba(34,85,14,0.15)'}` }}>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── CALCULATOR TOGGLE (SAT Math only) ── */}
        {subject === 'math' && (
          <div className="sat-slide" style={{ marginBottom: '2rem' }}>
            <p style={sectionLabel}>Calculator section</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.625rem' }}>
              {([
                { value: 'math_calc' as const, label: 'Calculator Section', sub: 'Module 2 — Calculator allowed', color: GREEN },
                { value: 'math_no_calc' as const, label: 'No Calculator Section', sub: 'Module 1 — No calculator', color: BLUE },
              ]).map(opt => {
                const active = mathModule === opt.value
                return (
                  <button key={opt.value} type="button" onClick={() => setMathModule(opt.value)}
                    style={{ padding: '1rem 1.25rem', borderRadius: '9999px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease', border: `2px solid ${active ? opt.color : 'rgba(34,85,14,0.15)'}`, background: active ? `${opt.color}12` : 'white' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: active ? opt.color : INK }}>{opt.label}</p>
                    <p style={{ fontSize: '0.75rem', color: MUTED, marginTop: '0.15rem' }}>{opt.sub}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── DIFFICULTY ── */}
        {topic && (
          <div className="sat-fade" style={{ marginBottom: '2rem' }}>
            <p style={sectionLabel}>3 · Difficulty</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.625rem' }}>
              {DIFFICULTIES.map(d => {
                const active = difficulty === d.value
                return (
                  <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                    style={{ padding: '1rem', borderRadius: '0.875rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease', border: `2px solid ${active ? d.color : 'rgba(34,85,14,0.15)'}`, background: active ? `${d.color}12` : 'white' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: active ? d.color : INK, marginBottom: '0.2rem' }}>{d.label}</p>
                    <p style={{ fontSize: '0.75rem', color: MUTED, lineHeight: 1.4 }}>{d.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── FORMAT INFO (collapsible) ── */}
        <div style={{ borderRadius: '1rem', background: 'white', border: '1px solid rgba(34,85,14,0.1)', marginBottom: '2rem', overflow: 'hidden' }}>
          <button type="button" onClick={() => setShowFormat(f => !f)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '1rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, color: INK, fontSize: '0.9375rem' }}>ℹ️ About this practice set</span>
            <ChevronDown style={{ width: '1.125rem', height: '1.125rem', color: MUTED, transform: showFormat ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {showFormat && (
            <div className="sat-fade" style={{ padding: '0 1.25rem 1.25rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  '📝 22 questions total — matching real SAT module length',
                  '🔀 A mix of multiple choice and student-produced response',
                  '⏱ Timed practice recommended (~35 minutes per module)',
                  '🎯 Aligned to the College Board digital SAT format and difficulty',
                ].map(t => <li key={t} style={{ fontSize: '0.875rem', color: MUTED, lineHeight: 1.6 }}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* ── GENERATE ── */}
        <p style={{ fontSize: '0.8125rem', color: MUTED, textAlign: 'center', marginBottom: '0.75rem' }}>{summary}</p>
        <button onClick={handleStart} disabled={atLimit || !ready}
          className={`sat-cta ${ready && !atLimit ? 'sat-cta-ready' : ''}`}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.1rem', fontSize: '1.0625rem', fontWeight: 700, borderRadius: '0.875rem', border: 'none', color: 'white', cursor: atLimit ? 'not-allowed' : ready ? 'pointer' : 'default', background: atLimit ? MUTED : `linear-gradient(135deg, ${GREEN}, rgb(59,130,46))`, opacity: !ready && !atLimit ? 0.55 : 1 }}>
          {atLimit
            ? <><Zap style={{ width: '1rem', height: '1rem' }} /> Upgrade for unlimited SAT prep</>
            : <>Generate SAT Practice Set <ArrowRight style={{ width: '1.125rem', height: '1.125rem' }} /></>}
        </button>
        {atLimit && <a href="/pricing" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', fontWeight: 600, color: GREEN, textDecoration: 'none' }}>Upgrade to Premium →</a>}

      </div>

      <LimitReachedModal
        open={limitModal.open}
        onClose={() => setLimitModal({ open: false, bonus: 0 })}
        limitLabel="1 free SAT practice set"
        bonusRemaining={limitModal.bonus}
      />

      <style>{`
        @keyframes satStagger { from { opacity: 0; transform: translateY(16px); } }
        @keyframes satSlideDown { from { opacity: 0; transform: translateY(-12px); } }
        @keyframes satFadeIn { from { opacity: 0; transform: translateY(8px); } }
        @keyframes satCtaPulse { 0%,100% { box-shadow: 0 8px 28px rgba(34,85,14,0.28); } 50% { box-shadow: 0 8px 44px rgba(34,85,14,0.55); } }
        .sat-card { animation: satStagger 0.45s ease both; }
        .sat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(34,85,14,0.14); }
        .sat-slide { animation: satSlideDown 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .sat-fade { animation: satFadeIn 0.35s ease both; }
        .sat-cta { transition: transform 0.2s ease; }
        .sat-cta-ready { animation: satCtaPulse 2.2s ease-in-out infinite; }
        .sat-cta-ready:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  )
}

function SatLoading({ subject, topic }: { subject: string; topic: string }) {
  const [mi, setMi] = useState(0)
  const messages = [
    'Analyzing the SAT curriculum...',
    'Crafting College Board-style questions...',
    'Calibrating difficulty level...',
    'Reviewing for accuracy...',
    'Polishing the explanations...',
    'Almost ready...',
  ]
  useEffect(() => {
    const id = setInterval(() => setMi(i => (i + 1) % messages.length), 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'linear-gradient(135deg, rgb(240,247,234), rgb(228,242,218), rgb(240,247,234))' }}>
      <div style={{ textAlign: 'center', maxWidth: '32rem', width: '100%' }}>
        <div className="sat-icon-glow" style={{ width: '128px', height: '128px', margin: '0 auto 2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(34,85,14,0.14), rgba(34,85,14,0.02))' }}>
          <BookOpen style={{ width: '80px', height: '80px', color: GREEN }} strokeWidth={1.5} />
        </div>
        <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: INK, marginBottom: '0.375rem', lineHeight: 1.25 }}>{topic || subject}</p>
        <p style={{ fontSize: '0.9375rem', color: MUTED, marginBottom: '1.75rem' }}>{subject}</p>
        <p key={mi} style={{ fontSize: '1.0625rem', fontWeight: 600, color: GREEN, marginBottom: '1.5rem', minHeight: '1.6rem', animation: 'satMsgFade 0.5s ease' }}>{messages[mi]}</p>
        <div style={{ width: '100%', maxWidth: '26rem', margin: '0 auto', height: '8px', background: 'rgba(34,85,14,0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '9999px', background: 'linear-gradient(90deg, rgb(34,85,14), rgb(74,122,40))', boxShadow: '0 0 14px rgba(34,85,14,0.35)', animation: 'satFill80 22s cubic-bezier(0.22,1,0.36,1) forwards' }} />
        </div>
      </div>
      <style>{`
        @keyframes satMsgFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes satFill80 { from { width: 0%; } to { width: 80%; } }
        @keyframes satIconGlow { 0%,100% { box-shadow: 0 0 30px rgba(34,85,14,0.4); transform: scale(1); } 50% { box-shadow: 0 0 60px rgba(122,182,72,0.6); transform: scale(1.06); } }
        .sat-icon-glow { animation: satIconGlow 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'Syne, sans-serif', fontSize: '0.75rem', fontWeight: 800, color: MUTED,
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem',
}
