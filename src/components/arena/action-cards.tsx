"use client"

import { CreateQuizCard } from "@/components/arena/create-quiz-card"
import { JoinGameCard } from "@/components/arena/join-game-card"
import { Reveal } from "@/components/arena/reveal"

export function ActionCards({
  createHref,
  onJoin,
  joining,
  joinError,
}: {
  createHref: string
  onJoin: (code: string) => void
  joining: boolean
  joinError: string
}) {
  return (
    <section aria-label="Start a game" className="relative mx-auto max-w-6xl px-5 sm:px-8">
      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        <Reveal delay={0.42} className="h-full">
          <CreateQuizCard href={createHref} />
        </Reveal>
        <Reveal delay={0.5} className="h-full">
          <JoinGameCard onJoin={onJoin} joining={joining} error={joinError} />
        </Reveal>
      </div>
    </section>
  )
}
