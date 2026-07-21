"use client"

import { RotateCw } from "lucide-react"
import type { Flashcard } from "@/types/flashcard"

type FlipCardProps = {
  card: Flashcard
  flipped: boolean
  onFlip: () => void
}

export function FlipCard({ card, flipped, onFlip }: FlipCardProps) {
  return (
    <div className="w-full [perspective:1600px]">
      <button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        aria-label={flipped ? "Show question" : "Show answer"}
        className="group block w-full text-left focus:outline-none"
      >
        <div
          className="relative h-72 w-full transition-transform duration-500 [transform-style:preserve-3d] sm:h-80"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Front — Question */}
          <CardFace
            side="Question"
            className="[backface-visibility:hidden]"
            accent="bg-primary/10 text-primary"
            content={card.question}
          />

          {/* Back — Answer */}
          <CardFace
            side="Answer"
            className="[transform:rotateY(180deg)] [backface-visibility:hidden]"
            accent="bg-primary text-primary-foreground"
            content={card.answer}
          />
        </div>
      </button>
    </div>
  )
}

function CardFace({
  side,
  content,
  className,
  accent,
}: {
  side: string
  content: string
  className: string
  accent: string
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-3xl border border-border bg-card px-8 py-10 shadow-lg shadow-primary/5 ring-1 ring-black/[0.02] transition-shadow group-hover:shadow-xl group-hover:shadow-primary/10 ${className}`}
    >
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${accent}`}
      >
        {side}
      </span>
      <p className="text-balance text-center font-serif text-2xl font-semibold leading-snug text-card-foreground sm:text-3xl">
        {content}
      </p>
      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
        Tap to flip
      </span>
    </div>
  )
}
