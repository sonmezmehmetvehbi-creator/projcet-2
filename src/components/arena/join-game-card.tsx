"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Gamepad2, LogIn, ScanLine, Loader2 } from "lucide-react"
import { GameCodeInput } from "@/components/arena/game-code-input"

// Presentational card wired to the REAL join flow via props supplied by
// ArenaClient (find-session for live, find-by-code for self-paced).
export function JoinGameCard({
  onJoin,
  joining = false,
  error = "",
}: {
  onJoin: (code: string) => void
  joining?: boolean
  error?: string
}) {
  const reduceMotion = useReducedMotion()
  const [code, setCode] = useState("")
  const ready = code.length === 6

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-arena-border bg-surface/70 p-6 shadow-xl shadow-black/40 backdrop-blur-sm transition-colors duration-300 hover:border-sky/45 sm:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 h-52 w-52 rounded-full bg-sky/15 blur-3xl sm:opacity-70"
      />

      <div className="relative flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky/40 bg-sky/12 text-sky shadow-lg shadow-sky/15">
          <Gamepad2 className="h-6 w-6" aria-hidden />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-arena-border bg-arena-bg/60 px-2.5 py-1 text-[11px] font-medium text-arena-muted">
          <ScanLine className="h-3 w-3" aria-hidden />
          Or scan QR
        </span>
      </div>

      <h3 className="relative mt-5 text-2xl font-semibold tracking-tight text-arena-fg">Join a Game</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-arena-muted">
        Got a code from your host? Drop it in below and jump straight into the lobby.
      </p>

      <div className="relative mt-6">
        <label className="mb-2.5 block text-xs font-medium tracking-wide text-arena-muted uppercase">
          Game code
        </label>
        <GameCodeInput onChange={setCode} onComplete={(c) => { if (!joining) onJoin(c) }} />
        {error && <p className="mt-2.5 text-sm font-medium text-red-400">{error}</p>}
      </div>

      <div className="mt-auto pt-6">
        <button
          type="button"
          disabled={!ready || joining}
          onClick={() => onJoin(code)}
          className={`relative inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-ember/40 sm:text-base ${
            ready && !joining
              ? "animate-idle-glow-ember bg-ember text-arena-bg hover:scale-[1.02] active:scale-[0.99]"
              : "cursor-not-allowed border border-arena-border bg-arena-bg/50 text-arena-muted"
          }`}
        >
          {joining ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
          {joining ? "Finding…" : ready ? "Enter the arena" : "Enter 6 characters"}
        </button>
      </div>
    </motion.div>
  )
}
