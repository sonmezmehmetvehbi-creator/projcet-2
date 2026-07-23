'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Layers, RefreshCw, Shuffle } from 'lucide-react'
import { FlipCard } from '@/components/flashcards/FlipCard'
import type { Flashcard } from '@/types/flashcard'

const GREEN = 'rgb(34,85,14)'
const ORANGE = 'rgb(217,119,6)'
const MUTED = 'rgb(107,107,88)'
const INK = 'rgb(26,26,20)'

// Fisher-Yates shuffle (returns a new array).
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function FlashcardClient({
  session,
  flashcards,
}: {
  session: any
  flashcards: Flashcard[]
}) {
  const router = useRouter()
  const total = flashcards.length

  // Working deck + spaced-repetition state.
  const [deck, setDeck] = useState<Flashcard[]>(flashcards)
  const [gotIt, setGotIt] = useState<number[]>([]) // cumulative ids marked got it
  const [needPractice, setNeedPractice] = useState<number[]>([]) // this round's need-practice ids
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [shuffled, setShuffled] = useState(false)
  const [round, setRound] = useState(1)
  const [toast, setToast] = useState<string | null>(null)

  // Cumulative set of ids that ever needed practice (for the final stats).
  const everNeeded = useRef<Set<number>>(new Set())
  const xpFired = useRef(false)

  const mastered = total - everNeeded.current.size

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 1600)
  }, [])

  const fireXP = useCallback(async () => {
    if (xpFired.current) return
    xpFired.current = true
    try {
      const today = new Date().toISOString().split('T')[0]
      const lastStudy = localStorage.getItem('lastStudyDate')
      const isFirstSessionToday = lastStudy !== today
      if (isFirstSessionToday) localStorage.setItem('lastStudyDate', today)

      await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outputType: 'flashcards',
          isFirstSessionToday,
          sessionId: session.id,
          subject: session.subject,
          topic: session.topic,
          correctAnswers: mastered,
          totalAnswers: total,
        }),
      })
      router.refresh()
    } catch {}
  }, [session.id, session.subject, session.topic, mastered, total, router])

  const mark = useCallback(
    (knewIt: boolean) => {
      if (completed || deck.length === 0) return
      const card = deck[currentIndex]
      const isLast = currentIndex + 1 >= deck.length

      // Track this round's outcome for the card.
      let roundNeeds = needPractice
      if (knewIt) {
        setGotIt((prev) => (prev.includes(card.id) ? prev : [...prev, card.id]))
      } else {
        everNeeded.current.add(card.id)
        if (!needPractice.includes(card.id)) {
          roundNeeds = [...needPractice, card.id]
          setNeedPractice(roundNeeds)
        }
      }

      if (!isLast) {
        setFlipped(false)
        window.setTimeout(() => setCurrentIndex((i) => i + 1), flipped ? 220 : 0)
        return
      }

      // End of round.
      setFlipped(false)
      window.setTimeout(() => {
        if (roundNeeds.length > 0) {
          const nextDeck = flashcards.filter((c) => roundNeeds.includes(c.id))
          setDeck(nextDeck)
          setNeedPractice([])
          setCurrentIndex(0)
          setRound((r) => r + 1)
          showToast("Round 2 — Let's review the tricky ones!")
        } else {
          setCompleted(true)
          fireXP()
        }
      }, flipped ? 220 : 0)
    },
    [completed, deck, currentIndex, needPractice, flipped, flashcards, showToast, fireXP]
  )

  const flip = useCallback(() => {
    if (!completed) setFlipped((f) => !f)
  }, [completed])

  function doShuffle() {
    setDeck((d) => shuffle(d))
    setCurrentIndex(0)
    setFlipped(false)
    setShuffled(true)
    window.setTimeout(() => setShuffled(false), 1200)
    showToast('Shuffled!')
  }

  function studyAgain() {
    everNeeded.current = new Set()
    xpFired.current = false
    setDeck(flashcards)
    setGotIt([])
    setNeedPractice([])
    setCurrentIndex(0)
    setFlipped(false)
    setCompleted(false)
    setRound(1)
  }

  function practiceWeak() {
    const weak = flashcards.filter((c) => everNeeded.current.has(c.id))
    if (weak.length === 0) return
    everNeeded.current = new Set()
    xpFired.current = false
    setDeck(weak)
    setGotIt([])
    setNeedPractice([])
    setCurrentIndex(0)
    setFlipped(false)
    setCompleted(false)
    setRound(1)
  }

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (completed) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        flip()
      } else if (e.key === 'ArrowRight' || e.key === '1') {
        e.preventDefault()
        mark(true)
      } else if (e.key === 'ArrowLeft' || e.key === '2') {
        e.preventDefault()
        mark(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [completed, flip, mark])

  if (!flashcards || flashcards.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
        <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '6rem 1.5rem', textAlign: 'center' }}>
          <p style={{ color: MUTED, marginBottom: '1rem' }}>No flashcards found for this session.</p>
          <Link href="/generate" className="btn-primary">Generate flashcards</Link>
        </div>
      </div>
    )
  }

  const isRound2 = round >= 2
  const barColor = isRound2 ? ORANGE : GREEN
  const progress = deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0
  const card = deck[currentIndex]
  const weakCount = everNeeded.current.size

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '5.5rem 1.5rem 2rem' }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: GREEN, textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft style={{ width: '0.9rem', height: '0.9rem' }} /> Dashboard
          </Link>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: MUTED }}>
            <Layers style={{ width: '0.9rem', height: '0.9rem' }} /> {session.subject} · {session.topic}
          </span>
        </div>

        {completed ? (
          <CompletionScreen
            mastered={mastered}
            total={total}
            weakCount={weakCount}
            subject={session.subject}
            topic={session.topic}
            onStudyAgain={studyAgain}
            onPracticeWeak={practiceWeak}
          />
        ) : (
          <>
            {/* Header: session label, counters, shuffle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: GREEN }}>
                Study Session
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Counters */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 700, color: GREEN }}>
                  ✅ {gotIt.length}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 700, color: ORANGE }}>
                  🔄 {needPractice.length}
                </span>
                <button type="button" onClick={doShuffle} title="Shuffle deck"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '9999px', border: `1.5px solid ${shuffled ? GREEN : 'rgba(34,85,14,0.25)'}`, background: shuffled ? 'rgba(34,85,14,0.08)' : 'white', color: GREEN, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <Shuffle style={{ width: '0.85rem', height: '0.85rem' }} /> Shuffle
                </button>
              </div>
            </div>

            {/* Round banner */}
            {isRound2 && (
              <div style={{ marginBottom: '0.75rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', color: ORANGE, fontSize: '0.8125rem', fontWeight: 600 }}>
                🎯 Round {round} — Reviewing {deck.length} card{deck.length === 1 ? '' : 's'} that need practice
              </div>
            )}

            {/* Progress */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: MUTED, fontVariantNumeric: 'tabular-nums' }}>
                  {currentIndex + 1} <span style={{ color: 'rgba(107,107,88,0.6)' }}>/ {deck.length}</span>
                </span>
              </div>
              <div style={{ height: '0.5rem', width: '100%', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, borderRadius: '9999px', background: barColor, transition: 'width 0.5s ease, background 0.3s ease' }} />
              </div>
            </div>

            {/* Card */}
            {card && <FlipCard card={card} flipped={flipped} onFlip={flip} />}

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => mark(true)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', borderRadius: '0.75rem', background: GREEN, color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                <Check style={{ width: '1.15rem', height: '1.15rem' }} /> Got it
              </button>
              <button type="button" onClick={() => mark(false)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', borderRadius: '0.75rem', background: 'white', color: ORANGE, border: `2px solid rgba(217,119,6,0.4)`, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                <RefreshCw style={{ width: '1.15rem', height: '1.15rem' }} /> Need Practice
              </button>
            </div>

            {/* Keyboard hint */}
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: MUTED }}>
              Space to flip · → Got it · ← Need practice
            </p>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: INK, color: 'white', padding: '0.625rem 1.25rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 50, animation: 'fcToastIn 0.25s ease both' }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fcToastIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fcCheckPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fcRingIn { from { stroke-dashoffset: var(--circ); } }
      `}</style>
    </div>
  )
}

function CompletionScreen({
  mastered,
  total,
  weakCount,
  subject,
  topic,
  onStudyAgain,
  onPracticeWeak,
}: {
  mastered: number
  total: number
  weakCount: number
  subject: string
  topic: string
  onStudyAgain: () => void
  onPracticeWeak: () => void
}) {
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const generateHref = `/generate?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}&outputType=questions`

  return (
    <div style={{ background: 'white', borderRadius: '1.25rem', border: '1px solid rgba(34,85,14,0.1)', boxShadow: '0 8px 32px rgba(34,85,14,0.1)', padding: '2.5rem 2rem', textAlign: 'center' }}>
      {/* Animated checkmark */}
      <div style={{ width: '4.5rem', height: '4.5rem', margin: '0 auto 1rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fcCheckPop 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
        <Check style={{ width: '2.25rem', height: '2.25rem', color: GREEN }} />
      </div>

      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: INK, marginBottom: '1.25rem' }}>
        Deck Complete! 🎉
      </h2>

      {/* Circular progress ring */}
      <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1rem' }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(34,85,14,0.12)" strokeWidth="10" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={GREEN} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 60 60)"
            style={{ ['--circ' as any]: `${circ}`, transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 800, color: GREEN, lineHeight: 1 }}>{mastered}/{total}</span>
          <span style={{ fontSize: '0.6875rem', color: MUTED, marginTop: '0.15rem' }}>mastered</span>
        </div>
      </div>

      <p style={{ fontSize: '0.9375rem', color: INK, fontWeight: 600, marginBottom: '0.25rem' }}>
        {mastered}/{total} cards mastered
      </p>
      <p style={{ fontSize: '0.875rem', color: GREEN, fontWeight: 700, marginBottom: '0.25rem' }}>
        You earned XP for studying! ⭐
      </p>
      <p style={{ fontSize: '0.8125rem', color: MUTED, marginBottom: '1.75rem' }}>
        {weakCount > 0 ? `${weakCount} card${weakCount === 1 ? '' : 's'} needed extra practice` : 'Nailed every card on the first try! 🔥'}
      </p>

      {/* Actions */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <button type="button" onClick={onStudyAgain}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', borderRadius: '0.75rem', background: GREEN, color: 'white', border: 'none', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>
          Study Again 🔄
        </button>
        {weakCount > 0 && (
          <button type="button" onClick={onPracticeWeak}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', borderRadius: '0.75rem', background: 'white', color: ORANGE, border: '2px solid rgba(217,119,6,0.4)', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>
            Practice Weak Cards 🎯
          </button>
        )}
        <Link href={generateHref}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', borderRadius: '0.75rem', background: 'white', color: GREEN, border: '2px solid rgba(34,85,14,0.3)', fontWeight: 700, fontSize: '0.9375rem', textDecoration: 'none' }}>
          Generate Questions on This Topic <ArrowRight style={{ width: '1rem', height: '1rem' }} />
        </Link>
      </div>
    </div>
  )
}
