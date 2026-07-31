import { Swords, Radio } from "lucide-react"
import { AmbientOrbs } from "@/components/arena/ambient-orbs"
import { FloatingTrophy } from "@/components/arena/floating-trophy"
import { CountUp } from "@/components/arena/count-up"
import { Reveal } from "@/components/arena/reveal"

const accentText = {
  brand: "text-brand-foreground",
  ember: "text-ember",
  sky: "text-sky",
} as const

export type ArenaStat = { label: string; value: number; suffix?: string; accent: keyof typeof accentText }

export function ArenaHero({ stats, liveNow = 0 }: { stats: ArenaStat[]; liveNow?: number }) {
  return (
    <section className="relative isolate overflow-hidden pt-12 pb-14 sm:pt-20 sm:pb-20">
      <AmbientOrbs />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
        <div>
          <Reveal delay={0.05}>
            <span className="inline-flex items-center gap-2 rounded-full border border-arena-border bg-surface/60 px-3 py-1.5 text-xs font-medium text-arena-muted backdrop-blur">
              <Radio className="h-3.5 w-3.5 text-ember" aria-hidden />
              {liveNow > 0 ? (
                <><span className="text-arena-fg">{liveNow} {liveNow === 1 ? "game" : "games"}</span> live right now</>
              ) : (
                <><span className="text-arena-fg">Ready</span> when you are</>
              )}
            </span>
          </Reveal>

          <Reveal delay={0.12}>
            <h1 className="mt-5 flex items-center gap-3 text-5xl font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              <Swords
                className="h-9 w-9 shrink-0 text-brand-foreground drop-shadow-[0_0_16px_oklch(0.55_0.24_295/0.75)] sm:h-11 sm:w-11 lg:h-13 lg:w-13"
                aria-hidden
              />
              <span className="bg-gradient-to-br from-arena-fg via-arena-fg to-brand-foreground/70 bg-clip-text text-transparent">
                Arena
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-arena-muted text-pretty sm:text-xl">
              Create quizzes. Challenge friends. Compete live.
            </p>
          </Reveal>

          {stats.length > 0 && (
            <Reveal delay={0.28}>
              <dl className="mt-8 grid max-w-md grid-cols-3 gap-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-arena-border bg-surface/50 px-3 py-3.5 backdrop-blur-sm sm:px-4"
                  >
                    <dd className={`text-2xl font-bold tabular-nums sm:text-3xl ${accentText[stat.accent]}`}>
                      <CountUp value={stat.value} suffix={stat.suffix ?? ""} />
                    </dd>
                    <dt className="mt-1 text-xs leading-4 text-arena-muted">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>

        <Reveal delay={0.35} className="order-first lg:order-none">
          <FloatingTrophy />
        </Reveal>
      </div>
    </section>
  )
}
