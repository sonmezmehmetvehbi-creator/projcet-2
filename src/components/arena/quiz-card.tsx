"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, BarChart3, Crown, Users, ListChecks, Clock, Radio, Play } from "lucide-react"

// Real-data card models (no mock lib/arena-data). ArenaClient maps the Supabase
// results into these and supplies the correct route in `href`.
export type CreatedCard = {
  id: string
  title: string
  active: boolean
  mode: "Live" | "Self-paced"
  players: number
  meta?: string
  href: string
  actionLabel: string
}

export type JoinedCard = {
  id: string
  title: string
  active: boolean
  completed: boolean
  rank: number
  score: number
  totalPlayers: number
  meta?: string
  href: string
  actionLabel: string
}

function StatusBadge({ active, activeLabel = "Active" }: { active: boolean; activeLabel?: string }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-ember/35 bg-ember/12 px-2.5 py-1 text-[11px] font-semibold text-ember">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ember" />
        </span>
        {activeLabel}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-arena-border bg-arena-bg/60 px-2.5 py-1 text-[11px] font-semibold text-arena-muted">
      Ended
    </span>
  )
}

function CardShell({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-arena-border bg-surface/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-brand/40 hover:bg-surface/85 hover:shadow-xl hover:shadow-brand/10 sm:p-5"
    >
      {children}
    </motion.article>
  )
}

function Meta({ icon: Icon, children }: { icon: typeof Users; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {children}
    </span>
  )
}

export function CreatedQuizCard({ quiz }: { quiz: CreatedCard }) {
  return (
    <CardShell>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-brand/12 text-brand-foreground">
          {quiz.mode === "Live" ? <Radio className="h-5 w-5" aria-hidden /> : <ListChecks className="h-5 w-5" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold leading-6 text-arena-fg">{quiz.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-arena-border bg-arena-bg/60 px-2 py-0.5 text-[11px] text-arena-muted">
              {quiz.mode}
            </span>
            <StatusBadge active={quiz.active} activeLabel={quiz.mode === "Live" ? "Live" : "Active"} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-arena-muted">
        <Meta icon={Users}>{quiz.players} players</Meta>
        {quiz.meta ? <Meta icon={Clock}>{quiz.meta}</Meta> : null}
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Link
          href={quiz.href}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-arena-border bg-arena-bg/60 px-3 py-2.5 text-sm font-medium text-arena-fg transition-colors duration-200 outline-none hover:border-brand/50 hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {quiz.actionLabel}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link
          href={quiz.href}
          aria-label={`${quiz.actionLabel} — ${quiz.title}`}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-200 outline-none ${
            quiz.active
              ? "border-ember/40 bg-ember/12 text-ember hover:bg-ember/20 focus-visible:ring-2 focus-visible:ring-ember/40"
              : "border-arena-border bg-arena-bg/60 text-arena-muted hover:border-sky/50 hover:text-sky focus-visible:ring-2 focus-visible:ring-sky/40"
          }`}
        >
          {quiz.active ? <Play className="h-4 w-4" aria-hidden /> : <BarChart3 className="h-4 w-4" aria-hidden />}
        </Link>
      </div>
    </CardShell>
  )
}

export function JoinedQuizCard({ quiz }: { quiz: JoinedCard }) {
  const podium = quiz.completed && quiz.rank >= 1 && quiz.rank <= 3
  return (
    <CardShell>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${
            podium ? "border-ember/40 bg-ember/12 text-ember" : "border-arena-border bg-arena-bg/60 text-arena-muted"
          }`}
        >
          {podium ? <Crown className="h-5 w-5" aria-hidden /> : quiz.completed && quiz.rank > 0 ? `#${quiz.rank}` : "—"}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold leading-6 text-arena-fg">{quiz.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusBadge active={quiz.active} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-arena-muted">
        {quiz.completed ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5" aria-hidden />
              <span className="font-semibold text-arena-fg">#{quiz.rank}</span>
              {quiz.totalPlayers > 0 ? <>of {quiz.totalPlayers}</> : null}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden />
              <span className="font-semibold text-sky tabular-nums">{quiz.score.toLocaleString()}</span> pts
            </span>
          </>
        ) : (
          <span className="text-arena-muted">{quiz.meta ?? "Not finished"}</span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-end gap-2">
        <Link
          href={quiz.href}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-arena-border bg-arena-bg/60 px-3 py-2 text-sm font-medium text-arena-fg transition-colors duration-200 outline-none hover:border-brand/50 hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {quiz.actionLabel}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </CardShell>
  )
}
