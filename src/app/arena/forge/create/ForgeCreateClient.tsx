'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react'
import { SUBJECTS_BY_CATEGORY, getTopics } from '@/lib/subjects'

const CATEGORIES = Object.keys(SUBJECTS_BY_CATEGORY).filter((c) => SUBJECTS_BY_CATEGORY[c].length > 0)
const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', emoji: '🌱' },
  { value: 'medium', label: 'Medium', emoji: '📚' },
  { value: 'hard', label: 'Hard', emoji: '🔥' },
  { value: 'expert', label: 'Expert', emoji: '⚡' },
]
const BANNER_COLORS = [
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Green', value: '#22855e' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Pink', value: '#db2777' },
]
const BONUS_OPTIONS = [0, 3, 5, 10]
const PENALTY_OPTIONS = [0, 2, 5]
const DURATIONS = [
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '12h', label: '12 hours' },
  { value: '24h', label: '24 hours' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
]
const AVATARS = ['🎓', '📚', '⚡', '🔥', '💡', '🧠', '🏆', '🎯', '🚀', '💪', '🦁', '🐯', '🦊', '🐉', '⚔️', '🛡️', '🌟', '👑', '🎮', '🎲']

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(196,181,253)', marginBottom: '0.5rem' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.35)', color: 'white', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }
const selectStyle: React.CSSProperties = { ...inputStyle, colorScheme: 'dark', cursor: 'pointer' }
const cardStyle: React.CSSProperties = { borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.75rem' }

type Question = { id: number; question: string; options: string[]; correctIndex: number; subject: string }

export default function ForgeCreateClient({ defaultName, isPremium, forgeCreated }: { defaultName: string; isPremium: boolean; forgeCreated: number }) {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1
  const [title, setTitle] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [bannerColor, setBannerColor] = useState('#7c3aed')

  // Step 2
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [questionCount, setQuestionCount] = useState(10)
  const [questions, setQuestions] = useState<Question[]>([])
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  // Step 3
  const [totalTime, setTotalTime] = useState(60)
  const [correctBonus, setCorrectBonus] = useState(5)
  const [wrongPenalty, setWrongPenalty] = useState(2)
  const [maxPlayers, setMaxPlayers] = useState('')
  const [duration, setDuration] = useState('24h')
  const [passwordOn, setPasswordOn] = useState(false)
  const [password, setPassword] = useState('')

  // Step 4
  const [displayName, setDisplayName] = useState(defaultName)
  const [avatar, setAvatar] = useState('🎓')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [limitHit, setLimitHit] = useState(!isPremium && forgeCreated >= 1)

  const subjects = category ? SUBJECTS_BY_CATEGORY[category] ?? [] : []
  const topics = useMemo(() => (subject ? getTopics(subject) : []), [subject])

  async function generate() {
    if (!subject || !topic) { setGenError('Pick a subject and topic first.'); return }
    setGenError(''); setGenerating(true); setQuestions([])
    try {
      const res = await fetch('/api/arena/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, difficulty, count: questionCount }),
      })
      const data = await res.json()
      if (data.error || !data.questions?.length) throw new Error(data.error || 'No questions generated')
      setQuestions(data.questions)
    } catch (e: any) {
      setGenError(e.message || 'Failed to generate questions')
    } finally {
      setGenerating(false)
    }
  }

  async function submit() {
    setSubmitError(''); setSubmitting(true)
    try {
      const res = await fetch('/api/arena/forge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, welcomeMessage, subject, topic, difficulty,
          questionTypes: ['mc'], questionCount: questions.length,
          totalTimeSeconds: totalTime, correctBonusSeconds: correctBonus, wrongPenaltySeconds: wrongPenalty,
          maxPlayers: maxPlayers ? Number(maxPlayers) : null,
          isPasswordProtected: passwordOn, password: passwordOn ? password : '',
          bannerColor, duration, displayName, avatarEmoji: avatar,
          questions,
        }),
      })
      const data = await res.json()
      if (res.status === 403 || data.limitReached) { setLimitHit(true); setSubmitting(false); return }
      if (!data.challengeId) throw new Error(data.error || 'Failed to create challenge')
      router.push(`/arena/forge/${data.challengeId}/lobby`)
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to create challenge')
      setSubmitting(false)
    }
  }

  const canNext =
    step === 1 ? title.trim().length > 0 :
    step === 2 ? questions.length > 0 :
    step === 3 ? true :
    displayName.trim().length > 0

  if (limitHit) {
    return (
      <div style={{ maxWidth: '36rem', margin: '0 auto', padding: '7rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '1rem' }}>
          You&apos;ve used your one free Forge Challenge
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgb(180,180,200)', marginBottom: '2rem' }}>
          Upgrade to Premium for unlimited challenge creation. You can still join and play any challenge for free.
        </p>
        <button onClick={() => router.push('/pricing')} style={{ height: '3.25rem', padding: '0 2rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(245,158,11), rgb(251,191,36))', color: 'rgb(41,28,4)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
          Upgrade to Premium →
        </button>
        <div style={{ marginTop: '1.5rem' }}>
          <button onClick={() => router.push('/arena')} style={{ background: 'none', border: 'none', color: 'rgb(148,148,168)', fontSize: '0.875rem', cursor: 'pointer' }}>← Back to Arena</button>
        </div>
      </div>
    )
  }

  const STEP_LABELS = ['Setup', 'Content', 'Rules', 'Identity']

  return (
    <div style={{ position: 'relative', maxWidth: '44rem', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.25rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>⚡ Forge a Challenge</h1>
      <p style={{ color: 'rgb(148,148,168)', marginBottom: '2rem' }}>Build a custom tournament and share the link.</p>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {STEP_LABELS.map((lbl, i) => {
          const n = i + 1
          const active = n === step
          const done = n < step
          return (
            <div key={lbl} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: '0.35rem', borderRadius: '9999px', background: active || done ? 'rgb(124,58,237)' : 'rgba(255,255,255,0.1)', marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: active ? 'rgb(196,181,253)' : done ? 'rgb(140,140,160)' : 'rgb(90,90,110)' }}>{n}. {lbl}</span>
            </div>
          )
        })}
      </div>

      {/* Step 1 — Setup */}
      {step === 1 && (
        <div style={cardStyle}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Challenge title</label>
            <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Calculus Finals Prep 🔥" maxLength={60} />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Welcome message (optional)</label>
            <textarea style={{ ...inputStyle, minHeight: '5rem', resize: 'vertical', fontFamily: 'inherit' }} value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} placeholder="Optional message to participants" maxLength={280} />
          </div>
          <div>
            <label style={labelStyle}>Banner color</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {BANNER_COLORS.map((c) => (
                <button key={c.value} type="button" onClick={() => setBannerColor(c.value)} title={c.name}
                  style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: c.value, border: bannerColor === c.value ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: bannerColor === c.value ? `0 0 16px ${c.value}` : 'none' }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Content */}
      {step === 2 && (
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={selectStyle} value={category} onChange={(e) => { setCategory(e.target.value); setSubject(''); setTopic(''); setQuestions([]) }}>
                <option value="">Select…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Subject</label>
              <select style={{ ...selectStyle, opacity: subjects.length ? 1 : 0.5 }} disabled={!subjects.length} value={subject} onChange={(e) => { setSubject(e.target.value); setTopic(''); setQuestions([]) }}>
                <option value="">Select…</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Topic</label>
              <select style={{ ...selectStyle, opacity: topics.length ? 1 : 0.5 }} disabled={!topics.length} value={topic} onChange={(e) => { setTopic(e.target.value); setQuestions([]) }}>
                <option value="">Select…</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <label style={labelStyle}>Difficulty</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {DIFFICULTIES.map((d) => {
              const active = difficulty === d.value
              return (
                <button key={d.value} type="button" onClick={() => { setDifficulty(d.value); setQuestions([]) }}
                  style={{ padding: '0.65rem 0.5rem', borderRadius: '0.75rem', border: `1px solid ${active ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.1)'}`, background: active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)', color: active ? 'rgb(196,181,253)' : 'rgb(180,180,195)', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>
                  {d.emoji} {d.label}
                </button>
              )
            })}
          </div>

          <label style={labelStyle}>Question type</label>
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid rgba(124,58,237,0.8)', background: 'rgba(124,58,237,0.18)', color: 'rgb(196,181,253)', fontWeight: 700, fontSize: '0.8125rem' }}>
              <Check style={{ width: '0.9rem', height: '0.9rem' }} /> Multiple Choice
            </span>
          </div>

          <label style={labelStyle}>Number of questions: {questionCount}</label>
          <input type="range" min={5} max={20} value={questionCount} onChange={(e) => { setQuestionCount(Number(e.target.value)); setQuestions([]) }} style={{ width: '100%', accentColor: 'rgb(124,58,237)', marginBottom: '1.25rem' }} />

          <button type="button" onClick={generate} disabled={generating || !subject || !topic}
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, cursor: generating ? 'wait' : 'pointer', opacity: !subject || !topic ? 0.5 : 1 }}>
            {generating ? <><Loader2 style={{ width: '1.1rem', height: '1.1rem' }} className="animate-spin" /> Generating…</> : <><Sparkles style={{ width: '1.1rem', height: '1.1rem' }} /> {questions.length ? 'Regenerate Questions' : 'Generate Questions'}</>}
          </button>
          {genError && <p style={{ marginTop: '0.75rem', color: 'rgb(248,113,113)', fontSize: '0.8125rem' }}>{genError}</p>}

          {questions.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(74,222,128)', marginBottom: '0.75rem' }}>✓ {questions.length} questions ready — preview:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {questions.slice(0, 3).map((q, i) => (
                  <div key={i} style={{ borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '1rem' }}>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>{i + 1}. {q.question}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                      {q.options.map((o, oi) => (
                        <span key={oi} style={{ fontSize: '0.8125rem', color: oi === q.correctIndex ? 'rgb(74,222,128)' : 'rgb(160,160,180)' }}>
                          {String.fromCharCode(65 + oi)}. {o}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Rules */}
      {step === 3 && (
        <div style={cardStyle}>
          <label style={labelStyle}>Total time: {totalTime}s</label>
          <input type="range" min={30} max={120} step={5} value={totalTime} onChange={(e) => setTotalTime(Number(e.target.value))} style={{ width: '100%', accentColor: 'rgb(124,58,237)', marginBottom: '1.25rem' }} />

          <label style={labelStyle}>Correct answer bonus</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {BONUS_OPTIONS.map((b) => (
              <button key={b} type="button" onClick={() => setCorrectBonus(b)}
                style={{ padding: '0.6rem', borderRadius: '0.75rem', border: `1px solid ${correctBonus === b ? 'rgba(74,222,128,0.8)' : 'rgba(255,255,255,0.1)'}`, background: correctBonus === b ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.03)', color: correctBonus === b ? 'rgb(134,239,172)' : 'rgb(180,180,195)', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>+{b}s</button>
            ))}
          </div>

          <label style={labelStyle}>Wrong answer penalty</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {PENALTY_OPTIONS.map((p) => (
              <button key={p} type="button" onClick={() => setWrongPenalty(p)}
                style={{ padding: '0.6rem', borderRadius: '0.75rem', border: `1px solid ${wrongPenalty === p ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.1)'}`, background: wrongPenalty === p ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.03)', color: wrongPenalty === p ? 'rgb(252,165,165)' : 'rgb(180,180,195)', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>-{p}s</button>
            ))}
          </div>

          <label style={labelStyle}>Max players (empty = unlimited)</label>
          <input style={{ ...inputStyle, marginBottom: '1.25rem' }} type="number" min={1} value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} placeholder="Unlimited" />

          <label style={labelStyle}>Stays active for</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {DURATIONS.map((d) => (
              <button key={d.value} type="button" onClick={() => setDuration(d.value)}
                style={{ padding: '0.6rem', borderRadius: '0.75rem', border: `1px solid ${duration === d.value ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.1)'}`, background: duration === d.value ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)', color: duration === d.value ? 'rgb(196,181,253)' : 'rgb(180,180,195)', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>{d.label}</button>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={passwordOn} onChange={(e) => setPasswordOn(e.target.checked)} style={{ width: '1.1rem', height: '1.1rem', accentColor: 'rgb(124,58,237)' }} />
            <span style={{ color: 'white', fontSize: '0.9375rem', fontWeight: 600 }}>Password protect this challenge</span>
          </label>
          {passwordOn && (
            <input style={{ ...inputStyle, marginTop: '0.75rem' }} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a password" />
          )}
        </div>
      )}

      {/* Step 4 — Identity */}
      {step === 4 && (
        <div style={cardStyle}>
          <label style={labelStyle}>Your display name</label>
          <input style={{ ...inputStyle, marginBottom: '1.25rem' }} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How you'll appear" maxLength={24} />

          <label style={labelStyle}>Choose your avatar</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {AVATARS.map((a) => (
              <button key={a} type="button" onClick={() => setAvatar(a)}
                style={{ aspectRatio: '1', borderRadius: '0.625rem', border: avatar === a ? '2px solid rgb(124,58,237)' : '1px solid rgba(255,255,255,0.1)', background: avatar === a ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)', fontSize: '1.25rem', cursor: 'pointer' }}>{a}</button>
            ))}
          </div>

          <p style={{ ...labelStyle }}>Leaderboard preview</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.875rem', border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.08)', padding: '0.875rem 1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{avatar}</span>
            <span style={{ color: 'white', fontWeight: 700 }}>{displayName || 'Your name'}</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: 'rgb(245,158,11)', background: 'rgba(245,158,11,0.12)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>HOST</span>
          </div>

          {submitError && <p style={{ marginTop: '1rem', color: 'rgb(248,113,113)', fontSize: '0.8125rem' }}>{submitError}</p>}
        </div>
      )}

      {/* Nav buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
        <button type="button" onClick={() => (step === 1 ? router.push('/arena') : setStep((s) => s - 1))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3rem', padding: '0 1.25rem', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgb(180,180,200)', fontWeight: 700, cursor: 'pointer' }}>
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> {step === 1 ? 'Cancel' : 'Back'}
        </button>
        {step < 4 ? (
          <button type="button" onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3rem', padding: '0 1.75rem', borderRadius: '0.875rem', border: 'none', background: canNext ? 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))' : 'rgba(255,255,255,0.06)', color: canNext ? 'white' : 'rgb(120,120,140)', fontWeight: 800, cursor: canNext ? 'pointer' : 'not-allowed' }}>
            Next <ArrowRight style={{ width: '1rem', height: '1rem' }} />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={!canNext || submitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3rem', padding: '0 1.75rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(245,158,11), rgb(251,191,36))', color: 'rgb(41,28,4)', fontWeight: 800, cursor: submitting ? 'wait' : 'pointer', opacity: !canNext ? 0.5 : 1 }}>
            {submitting ? <><Loader2 style={{ width: '1.1rem', height: '1.1rem' }} className="animate-spin" /> Creating…</> : <>Create Forge Challenge <ArrowRight style={{ width: '1rem', height: '1rem' }} /></>}
          </button>
        )}
      </div>
    </div>
  )
}
