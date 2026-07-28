'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, ArrowLeft, Copy, Share2 } from 'lucide-react'
import TimerRing from '@/components/arena/TimerRing'
import ScoreCounter from '@/components/arena/ScoreCounter'
import StreakBadge from '@/components/arena/StreakBadge'
import GameOverScreen from '@/components/arena/GameOverScreen'

// Dynamic timer: starts at 30s, correct +5 (cap 60), wrong -2 (floor 0).
const START_SECONDS = 30
const MAX_SECONDS = 60
const CORRECT_BONUS = 5
const WRONG_PENALTY = 2
const POINTS_PER = 100

type Question = {
  id: number
  question: string
  options: string[]
  correctIndex: number
  subject: string
}

type AnswerState = 'idle' | 'correct' | 'wrong'
type Float = { id: number; text: string; color: string }

type ChallengerInfo = {
  challengeId: string
  name: string
  score: number
} | null

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SpeedRoundClient({
  profile,
  isPremium,
  arenaGamesToday,
}: {
  profile: any
  isPremium: boolean
  arenaGamesToday: number
}) {
  const router = useRouter()

  const [config, setConfig] = useState<{ subject: string; topic: string; difficulty: string } | null>(null)
  const [challenger, setChallenger] = useState<ChallengerInfo>(null)
  const [status, setStatus] = useState<'loading' | 'playing' | 'error' | 'limit'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  const [deck, setDeck] = useState<Question[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempted, setAttempted] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(START_SECONDS)
  const [selected, setSelected] = useState<number | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [scoreBounce, setScoreBounce] = useState(false)
  const [flash, setFlash] = useState<'green' | 'red' | null>(null)
  const [floats, setFloats] = useState<Float[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [slideKey, setSlideKey] = useState(0)

  // Personal-best result returned by save-score at game over.
  const [isNewBest, setIsNewBest] = useState(false)
  const [previousBest, setPreviousBest] = useState<{ score: number; date: string } | null>(null)

  // Challenge share modal.
  const [shareOpen, setShareOpen] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [shareText, setShareText] = useState('')
  const [copied, setCopied] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const savedRef = useRef(false)
  const sessionIdRef = useRef<string>('')
  const floatIdRef = useRef(0)

  const current = deck[qIndex]

  // Read config from the URL (not useSearchParams, to avoid the CSR-bailout
  // Suspense build error) and fetch AI questions on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const subject = params.get('subject') ?? ''
    const topic = params.get('topic') ?? ''
    const difficulty = params.get('difficulty') ?? 'medium'
    if (!subject || !topic) { router.replace('/arena'); return }
    setConfig({ subject, topic, difficulty })
    sessionIdRef.current = crypto.randomUUID()

    // Optional challenge context.
    const challengeId = params.get('challengeId')
    if (challengeId) {
      setChallenger({
        challengeId,
        name: params.get('challengerName') || 'A friend',
        score: Number(params.get('challengerScore') ?? 0),
      })
    }

    // Daily-limit gate — do NOT fetch questions if the free user is out of games.
    if (!isPremium && arenaGamesToday >= 2) {
      setStatus('limit')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/arena/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, topic, difficulty, count: 20 }),
        })
        const data = await res.json()
        if (cancelled) return
        if (res.status === 429 || data.limitReached) { setStatus('limit'); return }
        if (data.error || !data.questions?.length) throw new Error(data.error || 'No questions')
        setDeck(shuffle(data.questions as Question[]))
        setStatus('playing')
      } catch (e: any) {
        if (cancelled) return
        setErrorMsg(e.message || 'Failed to generate questions')
        setStatus('error')
      }
    })()
    return () => { cancelled = true }
  }, [router, isPremium, arenaGamesToday])

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setGameOver(true)
  }, [])

  const nextQuestion = useCallback(() => {
    setQIndex((prev) => {
      if (prev + 1 >= deck.length) {
        endGame()
        return prev
      }
      return prev + 1
    })
    setSelected(null)
    setAnswerState('idle')
    setSlideKey((k) => k + 1)
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
      setStreak((s) => {
        const ns = s + 1
        setBestStreak((b) => Math.max(b, ns))
        return ns
      })
      setScoreBounce(true)
      setTimeout(() => setScoreBounce(false), 500)
      setSecondsLeft((s) => Math.min(MAX_SECONDS, s + CORRECT_BONUS))
      spawnFloat(`+${CORRECT_BONUS}s`, '#4ade80')
      setFlash('green')
    } else {
      setAnswerState('wrong')
      setStreak(0)
      setSecondsLeft((s) => Math.max(0, s - WRONG_PENALTY))
      spawnFloat(`-${WRONG_PENALTY}s`, '#f87171')
      setFlash('red')
    }
    setTimeout(() => setFlash(null), 220)

    setTimeout(() => nextQuestion(), 1100)
  }

  // Timer — only while playing.
  useEffect(() => {
    if (status !== 'playing' || gameOver) return
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          endGame()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status, gameOver, endGame])

  // On game over: save score (→ personal best) and award XP, once per round.
  useEffect(() => {
    if (!gameOver || savedRef.current || !config) return
    savedRef.current = true
    ;(async () => {
      try {
        const res = await fetch('/api/arena/save-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameType: 'speed_round',
            subject: config.subject,
            topic: config.topic,
            difficulty: config.difficulty,
            score,
            correct,
            attempted,
            bestStreak,
          }),
        })
        const data = await res.json()
        setIsNewBest(!!data.isNewBest)
        if (data.previousBest) {
          setPreviousBest({
            score: data.previousBest.score,
            date: new Date(data.previousBest.created_at).toLocaleDateString(),
          })
        }
      } catch {}

      try {
        const today = new Date().toISOString().split('T')[0]
        const lastStudy = localStorage.getItem('lastStudyDate')
        const isFirstSessionToday = lastStudy !== today
        if (isFirstSessionToday) localStorage.setItem('lastStudyDate', today)
        await fetch('/api/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outputType: 'arena',
            subject: config.subject,
            topic: config.topic,
            sessionId: sessionIdRef.current,
            correctAnswers: correct,
            totalAnswers: attempted,
            bestStreak,
            isFirstSessionToday,
          }),
        })
        router.refresh()
      } catch {}
    })()
  }, [gameOver, config, score, correct, attempted, bestStreak, router])

  const resetGame = () => {
    // Play Again re-fetches a fresh deck via a full navigation so the daily
    // limit is re-checked server-side and a new game is charged fairly.
    if (!config) return
    const params = new URLSearchParams({
      subject: config.subject,
      topic: config.topic,
      difficulty: config.difficulty,
    })
    if (challenger) {
      params.set('challengeId', challenger.challengeId)
      params.set('challengerName', challenger.name)
      params.set('challengerScore', String(challenger.score))
    }
    window.location.href = `/arena/speed-round?${params.toString()}`
  }

  const openChallenge = async () => {
    if (!config) return
    try {
      const res = await fetch('/api/arena/create-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerName: profile?.display_name || 'A friend',
          subject: config.subject,
          topic: config.topic,
          difficulty: config.difficulty,
          challengerScore: score,
        }),
      })
      const data = await res.json()
      if (!data.challengeId) throw new Error(data.error || 'Failed to create challenge')
      const link = `https://aceforge.app/arena/challenge/${data.challengeId}`
      setShareLink(link)
      setShareText(
        `${profile?.display_name || 'A friend'} challenges you to beat ${score} on ${config.subject} ${config.difficulty} Speed Round! Can you top it? 🎯`
      )
      setCopied(false)
      setShareOpen(true)
    } catch (e: any) {
      setShareLink('')
      setShareText(e.message || 'Failed to create challenge')
      setShareOpen(true)
    }
  }

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareLink}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const xp = correct * 5 + bestStreak * 10

  const challengeResult = challenger
    ? score > challenger.score
      ? `You beat ${challenger.name}! 🎉`
      : `So close! ${challenger.name} scored ${challenger.score}, you scored ${score}`
    : null

  // ── Daily-limit state ──
  if (status === 'limit') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0a0a14] px-4 text-center text-white">
        <div className="text-5xl">⏳</div>
        <p className="text-2xl font-black">Daily limit reached</p>
        <p className="max-w-md text-sm text-gray-400">
          You&apos;ve used your 2 daily Arena sessions. Resets at midnight.
        </p>
        <button
          onClick={() => router.push('/arena')}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-3 font-bold text-white transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]"
        >
          <ArrowLeft className="h-5 w-5" /> Back to Arena
        </button>
      </div>
    )
  }

  // ── Loading / error states ──
  if (status === 'loading') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a0a14] px-4 text-center text-white">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
        <div>
          <p className="text-2xl font-black">
            ⚡ Generating your {config?.subject ?? ''} challenge...
          </p>
          <p className="mt-2 text-sm text-gray-500">Crafting 20 questions just for you</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0a0a14] px-4 text-center text-white">
        <p className="text-2xl font-black">Couldn&apos;t start the round</p>
        <p className="max-w-md text-sm text-gray-400">{errorMsg}</p>
        <button
          onClick={() => router.push('/arena')}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-3 font-bold text-white transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]"
        >
          <ArrowLeft className="h-5 w-5" /> Back to Arena
        </button>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a14] text-white">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#0a0a14] to-blue-900/20" />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />

      {/* Correct / wrong screen flash */}
      {flash && (
        <div
          className={`pointer-events-none absolute inset-0 z-20 ${
            flash === 'green' ? 'animate-[flashGreen_0.2s_ease]' : 'animate-[flashRed_0.2s_ease]'
          }`}
        />
      )}

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-6 max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-300">
            {current.subject}
          </div>
          <ScoreCounter value={score} bounce={scoreBounce} />
          <div className="relative flex items-center justify-center">
            <TimerRing secondsLeft={secondsLeft} totalSeconds={MAX_SECONDS} />
            {/* Floating +5s / -2s near the timer */}
            {floats.map((f) => (
              <span
                key={f.id}
                className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-black animate-[timerfloat_0.8s_ease-out_forwards]"
                style={{ color: f.color, textShadow: `0 0 10px ${f.color}80` }}
              >
                {f.text}
              </span>
            ))}
          </div>
        </div>

        {/* Question card */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
          <div
            key={slideKey}
            className={`w-full rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#13131f] to-[#0d0d18] p-8 shadow-[0_0_40px_rgba(124,58,237,0.15)] ${
              answerState === 'wrong'
                ? 'animate-[shake_0.5s_ease]'
                : 'animate-[slidein_0.4s_ease]'
            }`}
          >
            <p className="text-center text-2xl font-bold leading-snug text-white">
              {current.question}
            </p>
          </div>

          {/* Answer grid */}
          <div className="grid w-full grid-cols-2 gap-4">
            {current.options.map((opt, i) => {
              const isCorrect = i === current.correctIndex
              const isSelected = i === selected
              let cls =
                'border-white/10 bg-white/5 hover:border-green-500/50 hover:bg-green-500/10 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]'

              if (selected !== null) {
                if (isCorrect) {
                  cls = 'border-green-500 bg-green-500/20 shadow-[0_0_25px_rgba(34,197,94,0.5)]'
                } else if (isSelected) {
                  cls = 'border-red-500 bg-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.5)]'
                } else {
                  cls = 'border-white/5 bg-white/5 opacity-40'
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                  className={`group relative flex items-center justify-center rounded-2xl border px-4 py-5 text-base font-semibold transition-all duration-200 active:scale-95 ${cls}`}
                >
                  <span className="mr-2 text-xs font-bold text-gray-500">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                  {selected !== null && isCorrect && (
                    <Check className="absolute right-3 top-3 h-5 w-5 text-green-400" />
                  )}
                  {selected !== null && isSelected && !isCorrect && (
                    <X className="absolute right-3 top-3 h-5 w-5 text-red-400" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <StreakBadge streak={streak} />

      {gameOver && (
        <GameOverScreen
          score={score}
          correct={correct}
          attempted={attempted}
          xp={xp}
          isNewBest={isNewBest}
          previousBest={previousBest}
          challengeResult={challengeResult}
          onPlayAgain={resetGame}
          onChallenge={openChallenge}
          onChangeSubject={() => router.push('/arena')}
        />
      )}

      {/* Challenge share modal */}
      {shareOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/40 bg-gradient-to-b from-[#13131f] to-[#0a0a14] p-7 shadow-[0_0_60px_rgba(124,58,237,0.35)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/40">
                <Share2 className="h-5 w-5 text-purple-300" />
              </div>
              <h3 className="text-xl font-black text-white">Challenge a Friend 🎯</h3>
            </div>
            <p className="mb-4 text-sm text-gray-300">{shareText}</p>
            {shareLink && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <span className="flex-1 truncate text-sm text-purple-200">{shareLink}</span>
                <button
                  onClick={copyShare}
                  className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-purple-500 active:scale-95"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
            <button
              onClick={() => setShareOpen(false)}
              className="w-full rounded-2xl bg-white/5 px-6 py-3 text-sm font-semibold text-gray-300 transition-all hover:bg-white/10 active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
