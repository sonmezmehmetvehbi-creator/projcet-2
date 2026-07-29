'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'
import TimerRing from '@/components/arena/TimerRing'
import ScoreCounter from '@/components/arena/ScoreCounter'
import StreakBadge from '@/components/arena/StreakBadge'

const POINTS_PER = 100
const AVATARS = ['🎓', '📚', '⚡', '🔥', '💡', '🧠', '🏆', '🎯', '🚀', '💪', '🦁', '🐯', '🦊', '🐉', '⚔️', '🛡️', '🌟', '👑', '🎮', '🎲']

type Question = { id: number; question: string; options: string[]; correctIndex: number; subject: string }
type AnswerState = 'idle' | 'correct' | 'wrong'
type Float = { id: number; text: string; color: string }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

export default function ForgeGameClient({
  challenge,
  defaultName,
  defaultAvatar,
}: {
  challenge: any
  defaultName: string
  defaultAvatar: string
}) {
  const router = useRouter()
  const startSeconds: number = challenge.total_time_seconds ?? 60
  const correctBonus: number = challenge.correct_bonus_seconds ?? 5
  const wrongPenalty: number = challenge.wrong_penalty_seconds ?? 2

  // Identity modal.
  const [identityOpen, setIdentityOpen] = useState(true)
  const [name, setName] = useState(defaultName)
  const [avatar, setAvatar] = useState(defaultAvatar)
  const [joining, setJoining] = useState(false)

  const [status, setStatus] = useState<'idle' | 'playing' | 'submitting'>('idle')
  const [deck, setDeck] = useState<Question[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempted, setAttempted] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(startSeconds)
  const [selected, setSelected] = useState<number | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [scoreBounce, setScoreBounce] = useState(false)
  const [flash, setFlash] = useState<'green' | 'red' | null>(null)
  const [floats, setFloats] = useState<Float[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [slideKey, setSlideKey] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const savedRef = useRef(false)
  const startRef = useRef(0)
  const floatIdRef = useRef(0)
  const current = deck[qIndex]

  async function startGame() {
    if (!name.trim()) return
    setJoining(true)
    try {
      await fetch('/api/arena/forge/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id, phase: 'join', displayName: name, avatarEmoji: avatar }),
      })
    } catch {}
    setDeck(shuffle(challenge.questions ?? []))
    startRef.current = Date.now()
    setIdentityOpen(false)
    setStatus('playing')
    setJoining(false)
  }

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setGameOver(true)
  }, [])

  const nextQuestion = useCallback(() => {
    setQIndex((prev) => {
      if (prev + 1 >= deck.length) { endGame(); return prev }
      return prev + 1
    })
    setSelected(null); setAnswerState('idle'); setSlideKey((k) => k + 1)
  }, [deck.length, endGame])

  const spawnFloat = (text: string, color: string) => {
    const id = ++floatIdRef.current
    setFloats((f) => [...f, { id, text, color }])
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 800)
  }

  const handleAnswer = (idx: number) => {
    if (selected !== null || gameOver || !current) return
    setSelected(idx)
    setAttempted((a) => a + 1)
    if (idx === current.correctIndex) {
      setAnswerState('correct')
      setCorrect((c) => c + 1)
      setScore((s) => s + POINTS_PER + streak * 20)
      setStreak((s) => { const ns = s + 1; setBestStreak((b) => Math.max(b, ns)); return ns })
      setScoreBounce(true); setTimeout(() => setScoreBounce(false), 500)
      setSecondsLeft((s) => Math.min(startSeconds, s + correctBonus))
      if (correctBonus > 0) spawnFloat(`+${correctBonus}s`, '#4ade80')
      setFlash('green')
    } else {
      setAnswerState('wrong')
      setStreak(0)
      setSecondsLeft((s) => Math.max(0, s - wrongPenalty))
      if (wrongPenalty > 0) spawnFloat(`-${wrongPenalty}s`, '#f87171')
      setFlash('red')
    }
    setTimeout(() => setFlash(null), 220)
    setTimeout(() => nextQuestion(), 1100)
  }

  // Timer.
  useEffect(() => {
    if (status !== 'playing' || gameOver) return
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => { if (s <= 1) { endGame(); return 0 } return s - 1 })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [status, gameOver, endGame])

  // On game over: submit final score, then go to the lobby leaderboard.
  useEffect(() => {
    if (!gameOver || savedRef.current) return
    savedRef.current = true
    setStatus('submitting')
    ;(async () => {
      const elapsed = Math.max(1, Math.round((Date.now() - startRef.current) / 1000))
      try {
        await fetch('/api/arena/forge/submit-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeId: challenge.id, phase: 'final',
            displayName: name, avatarEmoji: avatar,
            score, correct, attempted, bestStreak, completionTimeSeconds: elapsed,
          }),
        })
      } catch {}
      router.push(`/arena/forge/${challenge.id}/results`)
    })()
  }, [gameOver]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Identity modal ──
  if (identityOpen) {
    return (
      <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '26rem', borderRadius: '1.5rem', border: '1px solid rgba(124,58,237,0.35)', background: 'linear-gradient(135deg, rgb(13,13,25), rgb(18,18,35))', padding: '2rem', boxShadow: '0 0 60px rgba(124,58,237,0.25)' }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem', textAlign: 'center' }}>Choose your identity</h2>
          <p style={{ color: 'rgb(148,148,168)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>{challenge.title}</p>

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
            {joining ? 'Starting…' : `Start · ${startSeconds}s on the clock`}
          </button>
        </div>
      </div>
    )
  }

  if (status === 'submitting' && gameOver) {
    return (
      <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'white' }}>
        <Loader2 style={{ width: '2.5rem', height: '2.5rem' }} className="animate-spin" />
        <p style={{ fontWeight: 800, fontSize: '1.25rem' }}>Submitting your score…</p>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#0a0a14] to-blue-900/20" />
      {flash && (
        <div className={`pointer-events-none absolute inset-0 z-20 ${flash === 'green' ? 'animate-[flashGreen_0.2s_ease]' : 'animate-[flashRed_0.2s_ease]'}`} />
      )}

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-300">
            {challenge.subject}
          </div>
          <ScoreCounter value={score} bounce={scoreBounce} />
          <div className="relative flex items-center justify-center">
            <TimerRing secondsLeft={secondsLeft} totalSeconds={startSeconds} />
            {floats.map((f) => (
              <span key={f.id} className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-black animate-[timerfloat_0.8s_ease-out_forwards]" style={{ color: f.color, textShadow: `0 0 10px ${f.color}80` }}>{f.text}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
          <div key={slideKey} className={`w-full rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#13131f] to-[#0d0d18] p-8 shadow-[0_0_40px_rgba(124,58,237,0.15)] ${answerState === 'wrong' ? 'animate-[shake_0.5s_ease]' : 'animate-[slidein_0.4s_ease]'}`}>
            <p className="text-center text-2xl font-bold leading-snug text-white">{current.question}</p>
          </div>

          <div className="grid w-full grid-cols-2 gap-4">
            {current.options.map((opt, i) => {
              const isCorrect = i === current.correctIndex
              const isSelected = i === selected
              let cls = 'border-white/10 bg-white/5 hover:border-green-500/50 hover:bg-green-500/10 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]'
              if (selected !== null) {
                if (isCorrect) cls = 'border-green-500 bg-green-500/20 shadow-[0_0_25px_rgba(34,197,94,0.5)]'
                else if (isSelected) cls = 'border-red-500 bg-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                else cls = 'border-white/5 bg-white/5 opacity-40'
              }
              return (
                <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                  className={`group relative flex items-center justify-center rounded-2xl border px-4 py-5 text-base font-semibold transition-all duration-200 active:scale-95 ${cls}`}>
                  <span className="mr-2 text-xs font-bold text-gray-500">{String.fromCharCode(65 + i)}</span>
                  {opt}
                  {selected !== null && isCorrect && <Check className="absolute right-3 top-3 h-5 w-5 text-green-400" />}
                  {selected !== null && isSelected && !isCorrect && <X className="absolute right-3 top-3 h-5 w-5 text-red-400" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <StreakBadge streak={streak} />
    </div>
  )
}
