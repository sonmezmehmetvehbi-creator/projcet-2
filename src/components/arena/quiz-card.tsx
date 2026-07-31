"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowUpRight, BarChart3, Crown, Users, ListChecks, Clock, Radio, Play,
  MoreVertical, Star, Trash2, UserPlus, Loader2, Gamepad2, X,
} from "lucide-react"

// Real-data card models (no mock lib/arena-data). ArenaClient maps the Supabase
// results into these. `quizId` is the real forge_quizzes UUID used for
// relaunch / star / delete (empty string for a live-session card).
export type CreatedCard = {
  id: string
  kind: "quiz" | "session"
  quizId: string
  title: string
  active: boolean
  mode: "Live" | "Self-paced"
  players: number
  meta?: string
  starred: boolean
  manageHref: string
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
  playHref?: string
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
      className="group relative flex flex-col gap-4 rounded-2xl border border-arena-border bg-surface/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-brand/40 hover:bg-surface/85 hover:shadow-xl hover:shadow-brand/10 sm:p-5"
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

// ── Three-dot card menu: Star / Delete (owner only) / Assign (coming soon) ──
function CardMenu({ quizId, canModify, starred }: { quizId: string; canModify: boolean; starred: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [isStarred, setIsStarred] = useState(starred)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setIsStarred(starred), [starred])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setConfirming(false) }
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") { setOpen(false); setConfirming(false) } }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
  }, [open])

  async function toggleStar() {
    if (busy || !canModify) return
    const next = !isStarred
    setBusy(true)
    setIsStarred(next) // optimistic
    try {
      const res = await fetch("/api/arena/forge-quiz/toggle-star", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, starred: next }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      setIsStarred(!next) // revert on failure
    }
    setBusy(false)
    setOpen(false)
  }

  async function doDelete() {
    if (busy || !canModify) return
    setBusy(true)
    try {
      const res = await fetch("/api/arena/forge-quiz/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      })
      if (!res.ok) throw new Error()
      setOpen(false); setConfirming(false)
      router.refresh()
    } catch {
      setBusy(false)
    }
  }

  const itemBase = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors outline-none"

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Card options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-arena-muted transition-colors duration-200 outline-none hover:bg-arena-bg/60 hover:text-arena-fg focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <MoreVertical className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-xl border border-arena-border bg-surface shadow-xl shadow-black/50"
        >
          {confirming ? (
            <div className="p-3">
              <p className="text-xs leading-relaxed text-arena-fg">Delete this quiz? This cannot be undone.</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={doDelete}
                  disabled={busy}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  {busy ? "Deleting…" : "Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="rounded-lg border border-arena-border bg-arena-bg/60 px-3 py-2 text-xs font-medium text-arena-muted transition-colors hover:text-arena-fg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="py-1">
              <button
                type="button"
                role="menuitem"
                onClick={toggleStar}
                disabled={!canModify || busy}
                className={`${itemBase} ${canModify ? "text-arena-fg hover:bg-arena-bg/60" : "cursor-not-allowed text-arena-muted/50"}`}
              >
                <Star className={`h-4 w-4 ${isStarred ? "fill-ember text-ember" : ""}`} aria-hidden />
                {isStarred ? "Unstar" : "Star"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => setConfirming(true)}
                disabled={!canModify || busy}
                className={`${itemBase} ${canModify ? "text-red-300 hover:bg-red-500/10" : "cursor-not-allowed text-arena-muted/50"}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete
              </button>
              <button
                type="button"
                role="menuitem"
                disabled
                className={`${itemBase} cursor-not-allowed justify-between text-arena-muted/50`}
              >
                <span className="inline-flex items-center gap-2">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  Assign
                </span>
                <span className="rounded-full border border-arena-border bg-arena-bg/60 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide">
                  Coming soon
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Quick-play: pick a format (self-paced / live), relaunch, and start. No
// editing step. Only offered on owned quiz cards (relaunch requires ownership).
function QuickPlayModal({ quizId, onClose }: { quizId: string; onClose: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState<"self_paced" | "live" | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && !busy) onClose() }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev }
  }, [busy, onClose])

  async function run(mode: "self_paced" | "live") {
    if (busy) return
    setBusy(mode); setError("")
    try {
      const relRes = await fetch("/api/arena/forge-quiz/relaunch", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalQuizId: quizId, playMode: mode }),
      })
      const rel = await relRes.json()
      if (!relRes.ok || !rel.newQuizId) throw new Error(rel.error || "Could not start the quiz")

      if (mode === "self_paced") {
        router.push(`/arena/forge-quiz/${rel.newQuizId}/lobby`)
        return
      }
      // Live: open a fresh session for the relaunched quiz, then host it.
      const sesRes = await fetch("/api/arena/forge-quiz/live/start-session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: rel.newQuizId }),
      })
      const ses = await sesRes.json()
      if (!sesRes.ok || !ses.sessionId) throw new Error(ses.error || "Could not open the live room")
      router.push(`/arena/forge-quiz/live/${ses.sessionId}/host`)
    } catch (e: any) {
      setError(e.message || "Something went wrong")
      setBusy(null)
    }
  }

  return (
    <div
      onClick={() => !busy && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-arena-bg/80 p-5 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-arena-border bg-surface p-6 shadow-2xl shadow-black/60"
      >
        <button
          type="button"
          onClick={() => !busy && onClose()}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-arena-muted transition-colors hover:bg-arena-bg/60 hover:text-arena-fg"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-lg font-semibold tracking-tight text-arena-fg">Play again</h3>
        <p className="mt-1 text-sm text-arena-muted">How do you want to run it?</p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => run("self_paced")}
            disabled={!!busy}
            className="flex items-center gap-3 rounded-xl border border-arena-border bg-arena-bg/60 p-4 text-left transition-colors hover:border-brand/50 hover:bg-brand/10 disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-brand/12 text-brand-foreground">
              {busy === "self_paced" ? <Loader2 className="h-5 w-5 animate-spin" /> : <ListChecks className="h-5 w-5" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-arena-fg">Self-paced</span>
              <span className="block text-xs text-arena-muted">Share a link · players go at their own pace</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => run("live")}
            disabled={!!busy}
            className="flex items-center gap-3 rounded-xl border border-arena-border bg-arena-bg/60 p-4 text-left transition-colors hover:border-ember/50 hover:bg-ember/10 disabled:opacity-60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ember/30 bg-ember/12 text-ember">
              {busy === "live" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Gamepad2 className="h-5 w-5" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-arena-fg">Live Room</span>
              <span className="block text-xs text-arena-muted">Players join with a code · you host</span>
            </span>
          </button>
        </div>

        {error && <p className="mt-3 text-sm font-medium text-red-400">{error}</p>}
      </div>
    </div>
  )
}

export function CreatedQuizCard({ quiz }: { quiz: CreatedCard }) {
  const [quickPlay, setQuickPlay] = useState(false)
  const canModify = quiz.kind === "quiz" && !!quiz.quizId

  return (
    <CardShell>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-brand/12 text-brand-foreground">
          {quiz.mode === "Live" ? <Radio className="h-5 w-5" aria-hidden /> : <ListChecks className="h-5 w-5" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {quiz.starred && <Star className="h-3.5 w-3.5 shrink-0 fill-ember text-ember" aria-label="Starred" />}
            <h3 className="truncate text-base font-semibold leading-6 text-arena-fg">{quiz.title}</h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-arena-border bg-arena-bg/60 px-2 py-0.5 text-[11px] text-arena-muted">
              {quiz.mode}
            </span>
            <StatusBadge active={quiz.active} activeLabel={quiz.mode === "Live" ? "Live" : "Active"} />
          </div>
        </div>
        <CardMenu quizId={quiz.quizId} canModify={canModify} starred={quiz.starred} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-arena-muted">
        <Meta icon={Users}>{quiz.players} players</Meta>
        {quiz.meta ? <Meta icon={Clock}>{quiz.meta}</Meta> : null}
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Link
          href={quiz.manageHref}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-arena-border bg-arena-bg/60 px-3 py-2.5 text-sm font-medium text-arena-fg transition-colors duration-200 outline-none hover:border-brand/50 hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Manage
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        {quiz.kind === "quiz" && (
          <button
            type="button"
            onClick={() => setQuickPlay(true)}
            aria-label={`Play "${quiz.title}" again`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-ember/40 bg-ember/12 text-ember transition-colors duration-200 outline-none hover:bg-ember/20 focus-visible:ring-2 focus-visible:ring-ember/40"
          >
            <Play className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {quickPlay && <QuickPlayModal quizId={quiz.quizId} onClose={() => setQuickPlay(false)} />}
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
        {/* Joined (non-owned) — star/delete are owner-only, shown disabled. */}
        <CardMenu quizId="" canModify={false} starred={false} />
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

      {quiz.active && quiz.playHref && (
        <div className="mt-auto flex items-center justify-end gap-2">
          <Link
            href={quiz.playHref}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-ember/40 bg-ember/12 px-4 py-2 text-sm font-medium text-ember transition-colors duration-200 outline-none hover:bg-ember/20 focus-visible:ring-2 focus-visible:ring-ember/40"
          >
            <Play className="h-4 w-4" aria-hidden />
            Play again
          </Link>
        </div>
      )}
    </CardShell>
  )
}
