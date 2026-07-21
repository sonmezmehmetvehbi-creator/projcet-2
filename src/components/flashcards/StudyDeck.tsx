"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, RefreshCw, RotateCcw } from "lucide-react"
import type { Flashcard } from "@/types/flashcard"
import { FlipCard } from "@/components/flashcards/FlipCard"

type StudyDeckProps = {
  flashcards: Flashcard[]
  subject: string
  topic: string
  onComplete?: (gotIt: number, total: number) => void
}

export function StudyDeck({ flashcards, subject, topic, onComplete }: StudyDeckProps) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [gotIt, setGotIt] = useState(0)
  const completedFired = useRef(false)

  const total = flashcards.length
  const card = flashcards[index]
  const progress = ((index + 1) / total) * 100

  function finish(finalGotIt: number) {
    setCompleted(true)
    if (!completedFired.current) {
      completedFired.current = true
      onComplete?.(finalGotIt, total)
    }
  }

  function advance(knewIt: boolean) {
    const nextGotIt = knewIt ? gotIt + 1 : gotIt
    if (knewIt) setGotIt(nextGotIt)
    if (index + 1 >= total) {
      finish(nextGotIt)
      return
    }
    // Flip back to the question before showing the next card.
    setFlipped(false)
    setTimeout(() => setIndex((i) => i + 1), flipped ? 220 : 0)
  }

  function restart() {
    setFlipped(false)
    setIndex(0)
    setGotIt(0)
    setCompleted(false)
    completedFired.current = false
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col px-6 py-8">
      {/* Progress */}
      <header className="mb-auto">
        <div className="mb-2 flex items-baseline justify-between">
          <h1 className="font-serif text-sm font-semibold uppercase tracking-wider text-primary">
            Study Session
          </h1>
          <p className="text-sm font-medium tabular-nums text-muted-foreground">
            {completed ? total : index + 1}
            <span className="text-muted-foreground/60"> / {total}</span>
          </p>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuenow={completed ? total : index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label="Study progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${completed ? 100 : progress}%` }}
          />
        </div>
      </header>

      {/* Card area */}
      <section className="my-10 flex flex-col items-center justify-center">
        {completed ? (
          <CompletionState
            gotIt={gotIt}
            total={total}
            subject={subject}
            topic={topic}
            onRestart={restart}
          />
        ) : (
          <>
            <FlipCard card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

            <div className="mt-8 grid w-full grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => advance(true)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                <Check className="h-5 w-5" aria-hidden="true" />
                Got it
              </button>
              <button
                type="button"
                onClick={() => advance(false)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-border bg-background text-base font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <RefreshCw className="h-5 w-5" aria-hidden="true" />
                Need Practice
              </button>
            </div>
          </>
        )}
      </section>

      <div className="mb-2 mt-auto text-center text-xs text-muted-foreground">
        Click the card to reveal the answer
      </div>
    </main>
  )
}

function CompletionState({
  gotIt,
  total,
  subject,
  topic,
  onRestart,
}: {
  gotIt: number
  total: number
  subject: string
  topic: string
  onRestart: () => void
}) {
  const generateHref = `/generate?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`
  return (
    <div className="flex w-full flex-col items-center justify-center gap-6 rounded-3xl border border-border bg-card px-8 py-10 text-center shadow-lg shadow-primary/5">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Check className="h-8 w-8 text-primary" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h2 className="font-serif text-2xl font-semibold text-card-foreground">All done!</h2>
        <p className="text-lg font-semibold text-primary">
          {gotIt}/{total} cards marked Got It ✅
        </p>
        <p className="text-sm text-muted-foreground">
          Nice work — you earned XP for studying this deck. ⭐
        </p>
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-border bg-background text-base font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
          Practice Again 🔄
        </button>
        <Link
          href={generateHref}
          className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-center text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Generate Questions
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
