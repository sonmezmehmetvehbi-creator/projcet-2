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
    // w-full + overflow-x-hidden: hard guarantee nothing pushes past the viewport.
    <section aria-label="Start a game" className="relative mx-auto w-full max-w-6xl overflow-x-hidden px-5 sm:px-8">
      {/* Stay single-column until lg (1024px) so the "half a Mac screen" range
          (~640–900px) stacks instead of cramming two cards side by side. The
          min-w-0 on each grid item lets the cards shrink below their content's
          intrinsic width, which is what prevents horizontal overflow. */}
      <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <Reveal delay={0.42} className="h-full min-w-0">
          <CreateQuizCard href={createHref} />
        </Reveal>
        <Reveal delay={0.5} className="h-full min-w-0">
          <JoinGameCard onJoin={onJoin} joining={joining} error={joinError} />
        </Reveal>
      </div>
    </section>
  )
}
