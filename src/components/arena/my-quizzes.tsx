"use client"

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { LayoutGrid, Swords, Rocket, Compass } from "lucide-react"
import { CreatedQuizCard, JoinedQuizCard, type CreatedCard, type JoinedCard } from "@/components/arena/quiz-card"
import { EmptyState } from "@/components/arena/empty-state"

type Tab = "created" | "joined"

export function MyQuizzes({
  created,
  joined,
  createHref = "/arena/forge-quiz/create",
}: {
  created: CreatedCard[]
  joined: JoinedCard[]
  createHref?: string
}) {
  const [tab, setTab] = useState<Tab>("created")
  const reduceMotion = useReducedMotion()

  const tabs: { id: Tab; label: string; icon: typeof LayoutGrid; count: number }[] = [
    { id: "created", label: "Created", icon: LayoutGrid, count: created.length },
    { id: "joined", label: "Joined", icon: Swords, count: joined.length },
  ]

  const items = tab === "created" ? created : joined

  return (
    <section aria-labelledby="my-quizzes-heading" className="relative mx-auto max-w-6xl px-5 pt-16 pb-24 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="my-quizzes-heading" className="text-2xl font-semibold tracking-tight text-arena-fg sm:text-3xl">
            My Quizzes
          </h2>
          <p className="mt-1.5 text-sm text-arena-muted">
            Everything you&apos;ve hosted and every arena you&apos;ve stepped into.
          </p>
        </div>
      </div>

      {/* segmented control */}
      <div
        role="tablist"
        aria-label="Quiz filter"
        className="mt-6 inline-flex w-full gap-1 rounded-2xl border border-arena-border bg-surface/50 p-1 backdrop-blur-sm sm:w-auto"
      >
        {tabs.map((t) => {
          const selected = tab === t.id
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:flex-none sm:px-5 ${
                selected ? "text-arena-fg" : "text-arena-muted hover:text-arena-fg"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="segment-pill"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 -z-10 rounded-xl border border-brand/40 bg-brand/15 shadow-lg shadow-brand/15"
                />
              )}
              <t.icon className="h-4 w-4" aria-hidden />
              {t.label}
              <span className="rounded-md bg-arena-bg/70 px-1.5 py-0.5 text-[11px] tabular-nums text-arena-muted">
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${tab}-${items.length === 0 ? "empty" : "list"}`}
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {items.length === 0 ? (
              tab === "created" ? (
                <EmptyState
                  icon={Rocket}
                  title="No quizzes yet — your arena awaits"
                  description="Build your first question set and invite your study crew. It takes about two minutes to go live."
                  actionLabel="Create my first quiz"
                  actionHref={createHref}
                />
              ) : (
                <EmptyState
                  icon={Compass}
                  title="You haven't joined a game yet"
                  description="Ask a friend or your teacher for a 6-character code, then drop it into the Join a Game card above."
                  actionLabel="Create a quiz instead"
                  actionHref={createHref}
                  tone="sky"
                />
              )
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tab === "created"
                  ? created.map((quiz, i) => (
                      <motion.li
                        key={quiz.id}
                        initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        className="[&>*]:w-full"
                      >
                        <CreatedQuizCard quiz={quiz} />
                      </motion.li>
                    ))
                  : joined.map((quiz, i) => (
                      <motion.li
                        key={quiz.id}
                        initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        className="[&>*]:w-full"
                      >
                        <JoinedQuizCard quiz={quiz} />
                      </motion.li>
                    ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
