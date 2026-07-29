'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'

const AVATARS = ['🎓', '📚', '⚡', '🔥', '💡', '🧠', '🏆', '🎯', '🚀', '💪', '🦁', '🐯', '🦊', '🐉', '⚔️', '🛡️', '🌟', '👑', '🎮', '🎲']

type Question = {
  id: string
  position: number
  question_text: string
  question_type: 'mc' | 'tf' | 'slider' | 'fr'
  options: string[] | null
  correct_index: number | null
  correct_answer: string | null
  slider_min: number | null
  slider_max: number | null
  slider_correct: number | null
  points_multiplier: number
  time_limit: number | null
  image_url: string | null
}

const norm = (s: string) => s.trim().toLowerCase()

export default function ForgeQuizPlayClient({
  quiz,
  questions,
  defaultName,
}: {
  quiz: any
  questions: Question[]
  defaultName: string
}) {
  const router = useRouter()

  const [status, setStatus] = useState<'identity' | 'playing' | 'submitting'>('identity')
  const [name, setName] = useState(defaultName)
  const [avatar, setAvatar] = useState('🎓')
  const [joining, setJoining] = useState(false)

  const [qIndex, setQIndex] = useState(0)
  const [totalMs, setTotalMs] = useState(1)
  const [msLeft, setMsLeft] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)
  const [sliderVal, setSliderVal] = useState(0)
  const [frText, setFrText] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [lastGain, setLastGain] = useState(0)
  const [lastBonus, setLastBonus] = useState(0)
  const [lastCorrect, setLastCorrect] = useState(false)

  const scoreRef = useRef(0)
  const streakRef = useRef(0)
  const answersRef = useRef<any[]>([])
  const savedRef = useRef(false)

  const q = questions[qIndex]

  // Reset per-question state when the question changes.
  useEffect(() => {
    if (status !== 'playing' || !q) return
    const t = (q.time_limit || quiz.time_per_question || 20) * 1000
    setTotalMs(t); setMsLeft(t); setSelected(null); setRevealed(false)
    setFrText('')
    setSliderVal(Math.round((((q.slider_min ?? 0) + (q.slider_max ?? 100)) / 2)))
  }, [qIndex, status, q, quiz.time_per_question])

  const finish = useCallback(async () => {
    if (savedRef.current) return
    savedRef.current = true
    setStatus('submitting')
    try {
      await fetch('/api/arena/forge-quiz/submit-score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz.id,
          score: scoreRef.current,
          correct: answersRef.current.filter((a) => a.is_correct).length,
          answers: answersRef.current,
        }),
      })
    } catch {}
    router.push(`/arena/forge-quiz/${quiz.id}/results`)
  }, [quiz.id, router])

  const advance = useCallback(() => {
    if (qIndex + 1 >= questions.length) { finish(); return }
    setQIndex((i) => i + 1)
  }, [qIndex, questions.length, finish])

  const reveal = useCallback((answerText: string | null, isCorrect: boolean, rawPts: number) => {
    if (revealed) return
    // Only correct answers earn points. Wrong answers (and slider guesses
    // outside the acceptable range, which arrive with isCorrect=false) score 0
    // regardless of speed. Speed points, the multiplier, and the streak bonus
    // are applied only when the answer is correct.
    let pts = 0
    let bonus = 0
    const newStreak = isCorrect ? streakRef.current + 1 : 0
    if (isCorrect) {
      pts = Math.max(0, Math.round(rawPts)) * (q?.points_multiplier ?? 1)
      bonus = newStreak > 0 && newStreak % 3 === 0 ? 200 : 0
    }
    const gain = pts + bonus
    streakRef.current = newStreak
    scoreRef.current += gain
    answersRef.current.push({ question_id: q.id, answer: answerText, is_correct: isCorrect, points: gain })
    setStreak(newStreak); setScore(scoreRef.current)
    setLastGain(gain); setLastBonus(bonus); setLastCorrect(isCorrect)
    setRevealed(true)
    setTimeout(advance, 1800)
  }, [revealed, q, advance])

  // Timer.
  useEffect(() => {
    if (status !== 'playing' || revealed) return
    if (msLeft <= 0) { reveal(null, false, 0); return }
    const t = setTimeout(() => setMsLeft((m) => Math.max(0, m - 100)), 100)
    return () => clearTimeout(t)
  }, [status, revealed, msLeft, reveal])

  const basePts = () => 1000 * (msLeft / totalMs)

  function answerMC(idx: number) {
    if (revealed) return
    setSelected(idx)
    reveal(q.options?.[idx] ?? String(idx), idx === q.correct_index, basePts())
  }
  function answerTF(idx: number) {
    if (revealed) return
    setSelected(idx)
    reveal(idx === 0 ? 'True' : 'False', idx === q.correct_index, basePts())
  }
  function submitSlider() {
    if (revealed) return
    const min = q.slider_min ?? 0, max = q.slider_max ?? 100, correct = q.slider_correct ?? 0
    const range = Math.max(1, max - min)
    const dist = Math.abs(sliderVal - correct)
    const closeness = Math.max(0, 1 - dist / range)
    reveal(String(sliderVal), closeness >= 0.9, basePts() * closeness)
  }
  function submitFR() {
    if (revealed) return
    const correct = norm(frText) === norm(q.correct_answer ?? '') && frText.trim().length > 0
    reveal(frText, correct, basePts())
  }

  async function startGame() {
    if (!name.trim()) return
    setJoining(true)
    try {
      await fetch('/api/arena/forge-quiz/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quiz.id, displayName: name, avatarEmoji: avatar }),
      })
    } catch {}
    setJoining(false)
    setStatus('playing')
  }

  // ── Identity modal ──
  if (status === 'identity') {
    return (
      <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '26rem', borderRadius: '1.5rem', border: '1px solid rgba(124,58,237,0.35)', background: 'linear-gradient(135deg, rgb(13,13,25), rgb(18,18,35))', padding: '2rem', boxShadow: '0 0 60px rgba(124,58,237,0.25)' }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: '0.25rem' }}>Choose your identity</h2>
          <p style={{ color: 'rgb(148,148,168)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>{quiz.title}</p>

          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(196,181,253)', marginBottom: '0.5rem' }}>Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.35)', color: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: '1.25rem' }} />

          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(196,181,253)', marginBottom: '0.5rem' }}>Avatar</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '0.35rem', marginBottom: '1.5rem' }}>
            {AVATARS.map((a) => (
              <button key={a} type="button" onClick={() => setAvatar(a)}
                style={{ aspectRatio: '1', borderRadius: '0.5rem', border: avatar === a ? '2px solid rgb(124,58,237)' : '1px solid rgba(255,255,255,0.1)', background: avatar === a ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)', fontSize: '1.1rem', cursor: 'pointer' }}>{a}</button>
            ))}
          </div>

          <button onClick={startGame} disabled={joining || !name.trim()}
            style={{ width: '100%', height: '3.25rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: joining ? 'wait' : 'pointer', opacity: name.trim() ? 1 : 0.5 }}>
            {joining ? 'Joining…' : 'Start Quiz →'}
          </button>
        </div>
      </div>
    )
  }

  if (status === 'submitting') {
    return (
      <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'white' }}>
        <Loader2 style={{ width: '2.5rem', height: '2.5rem' }} className="animate-spin" />
        <p style={{ fontWeight: 800, fontSize: '1.25rem' }}>Scoring your quiz…</p>
      </div>
    )
  }

  if (!q) return null

  const timeRatio = msLeft / totalMs
  const urgent = msLeft <= 5000
  const secs = Math.ceil(msLeft / 1000)

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgb(10,10,20) 55%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: '42rem', margin: '0 auto', padding: '5rem 1.5rem 3rem' }}>
        {/* Progress + score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(196,181,253)' }}>Question {qIndex + 1} of {questions.length}</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'rgb(251,191,36)' }}>Score: {score}{streak >= 3 && <span style={{ marginLeft: '0.4rem', color: 'rgb(251,146,60)' }}>🔥 {streak}</span>}</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: '0.35rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '0.5rem' }}>
          <div style={{ height: '100%', width: `${((qIndex) / questions.length) * 100}%`, background: 'rgb(124,58,237)', borderRadius: '9999px', transition: 'width 0.3s ease' }} />
        </div>
        {/* Timer bar */}
        <div style={{ height: '0.6rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '1.75rem', position: 'relative' }}>
          <div style={{ height: '100%', width: `${timeRatio * 100}%`, background: urgent ? 'rgb(248,113,113)' : 'rgb(74,222,128)', borderRadius: '9999px', transition: 'width 0.1s linear' }} />
        </div>

        {/* Question card */}
        <div style={{ borderRadius: '1.5rem', border: '1px solid rgba(124,58,237,0.3)', background: 'linear-gradient(180deg, rgb(19,19,31), rgb(13,13,24))', padding: '2rem', marginBottom: '1.5rem', textAlign: 'center', boxShadow: '0 0 40px rgba(124,58,237,0.15)' }}>
          {q.image_url && <img src={q.image_url} alt="" style={{ maxHeight: '12rem', margin: '0 auto 1rem', borderRadius: '0.75rem' }} />}
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1.3 }}>{q.question_text}</p>
          <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', color: 'rgb(148,148,168)' }}>
            <span>{urgent ? <span style={{ color: 'rgb(248,113,113)', fontWeight: 800 }}>{secs}s</span> : `${secs}s`}</span>
            {q.points_multiplier === 2 && <span style={{ color: 'rgb(251,191,36)', fontWeight: 800 }}>2× points</span>}
            {q.points_multiplier === 0 && <span style={{ color: 'rgb(148,148,168)' }}>No points</span>}
          </div>
        </div>

        {/* Answer area */}
        {q.question_type === 'mc' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {(q.options ?? []).map((opt, i) => {
              const isCorrect = i === q.correct_index, isSel = i === selected
              let bg = 'rgba(255,255,255,0.05)', border = 'rgba(255,255,255,0.12)', col = 'white'
              if (revealed) {
                if (isCorrect) { bg = 'rgba(34,197,94,0.2)'; border = 'rgb(34,197,94)' }
                else if (isSel) { bg = 'rgba(239,68,68,0.2)'; border = 'rgb(239,68,68)' }
                else { bg = 'rgba(255,255,255,0.03)'; col = 'rgb(120,120,140)' }
              }
              return (
                <button key={i} onClick={() => answerMC(i)} disabled={revealed || !opt}
                  style={{ position: 'relative', minHeight: '4rem', borderRadius: '1rem', border: `1px solid ${border}`, background: bg, color: col, fontWeight: 700, fontSize: '1rem', padding: '1rem', cursor: revealed ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                  <span style={{ marginRight: '0.4rem', fontSize: '0.75rem', color: 'rgb(120,120,140)' }}>{String.fromCharCode(65 + i)}</span>{opt}
                  {revealed && isCorrect && <Check style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '1.1rem', height: '1.1rem', color: 'rgb(74,222,128)' }} />}
                  {revealed && isSel && !isCorrect && <X style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '1.1rem', height: '1.1rem', color: 'rgb(248,113,113)' }} />}
                </button>
              )
            })}
          </div>
        )}

        {q.question_type === 'tf' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {['True ✓', 'False ✗'].map((lbl, i) => {
              const isCorrect = i === q.correct_index, isSel = i === selected
              let bg = 'rgba(255,255,255,0.05)', border = 'rgba(255,255,255,0.12)', col = 'white'
              if (revealed) {
                if (isCorrect) { bg = 'rgba(34,197,94,0.2)'; border = 'rgb(34,197,94)' }
                else if (isSel) { bg = 'rgba(239,68,68,0.2)'; border = 'rgb(239,68,68)' }
                else { col = 'rgb(120,120,140)' }
              }
              return (
                <button key={i} onClick={() => answerTF(i)} disabled={revealed}
                  style={{ height: '5rem', borderRadius: '1rem', border: `1px solid ${border}`, background: bg, color: col, fontWeight: 800, fontSize: '1.25rem', cursor: revealed ? 'default' : 'pointer' }}>{lbl}</button>
              )
            })}
          </div>
        )}

        {q.question_type === 'slider' && (
          <div style={{ borderRadius: '1rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'rgb(148,148,168)', marginBottom: '0.5rem' }}>
              <span>{q.slider_min}</span><span style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>{sliderVal}</span><span>{q.slider_max}</span>
            </div>
            <input type="range" min={q.slider_min ?? 0} max={q.slider_max ?? 100} value={sliderVal} disabled={revealed}
              onChange={(e) => setSliderVal(Number(e.target.value))} style={{ width: '100%', accentColor: revealed ? 'rgb(74,222,128)' : 'rgb(124,58,237)' }} />
            {revealed ? (
              <p style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.9375rem', color: 'rgb(74,222,128)', fontWeight: 700 }}>Correct: {q.slider_correct} · You: {sliderVal}</p>
            ) : (
              <button onClick={submitSlider} style={{ width: '100%', marginTop: '1rem', height: '3rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Submit</button>
            )}
          </div>
        )}

        {q.question_type === 'fr' && (
          <div style={{ borderRadius: '1rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.5rem' }}>
            <input value={frText} onChange={(e) => setFrText(e.target.value)} disabled={revealed} placeholder="Type your answer…"
              onKeyDown={(e) => { if (e.key === 'Enter') submitFR() }}
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.35)', color: 'white', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
            {revealed ? (
              <p style={{ textAlign: 'center', fontSize: '0.9375rem', color: 'rgb(74,222,128)', fontWeight: 700 }}>Correct answer: {q.correct_answer}</p>
            ) : (
              <>
                <button onClick={submitFR} style={{ width: '100%', height: '3rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Submit</button>
                <p style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgb(148,148,168)' }}>Auto-marked on an exact match (case-insensitive).</p>
              </>
            )}
          </div>
        )}

        {/* Reveal summary */}
        {revealed && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderRadius: '1rem', border: `1px solid ${lastCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(248,113,113,0.4)'}`, background: lastCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '1rem', animation: 'slideup 0.3s ease' }}>
            <p style={{ fontWeight: 800, fontSize: '1.1rem', color: lastCorrect ? 'rgb(134,239,172)' : 'rgb(252,165,165)' }}>
              {lastCorrect ? 'Correct!' : 'Not quite'} {lastGain > 0 && <span style={{ color: 'rgb(251,191,36)' }}>+{lastGain} pts</span>}
            </p>
            {lastBonus > 0 && <p style={{ fontSize: '0.8125rem', color: 'rgb(251,146,60)', fontWeight: 700 }}>🔥 +{lastBonus} streak bonus!</p>}
            <p style={{ fontSize: '0.8125rem', color: 'rgb(148,148,168)', marginTop: '0.25rem' }}>Total: {score}</p>
          </div>
        )}
      </div>
    </div>
  )
}
