"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Gamepad2, LogIn, ScanLine, Loader2, X } from "lucide-react"
import { GameCodeInput } from "@/components/arena/game-code-input"

// The card is just a call-to-action; the 6-character entry happens in a centered
// modal popup (consistent with the other Arena code-entry modals). Wired to the
// REAL join flow via props from ArenaClient (find-session live / find-by-code).
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
  const [open, setOpen] = useState(false)

  return (
    <>
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
          Got a code from your host? Enter it to jump straight into the lobby.
        </p>

        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="animate-idle-glow-ember relative inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-ember px-5 py-3.5 text-sm font-semibold text-arena-bg transition-transform duration-200 outline-none hover:scale-[1.02] focus-visible:ring-4 focus-visible:ring-ember/40 active:scale-[0.99] sm:text-base"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Enter a code
          </button>
        </div>
      </motion.div>

      {open && (
        <JoinCodeModal onJoin={onJoin} joining={joining} error={error} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

function JoinCodeModal({
  onJoin,
  joining,
  error,
  onClose,
}: {
  onJoin: (code: string) => void
  joining: boolean
  error: string
  onClose: () => void
}) {
  const [code, setCode] = useState("")
  const ready = code.length === 6

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !joining) onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [joining, onClose])

  return (
    <div
      onClick={() => !joining && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-arena-bg/80 p-5 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-arena-border bg-surface p-6 shadow-2xl shadow-black/60"
      >
        <button
          type="button"
          onClick={() => !joining && onClose()}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-arena-muted transition-colors hover:bg-arena-bg/60 hover:text-arena-fg"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky/40 bg-sky/12 text-sky">
            <Gamepad2 className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight text-arena-fg">Join a Game</h3>
            <p className="text-sm text-arena-muted">Enter the 6-character code</p>
          </div>
        </div>

        <div className="mt-5">
          <GameCodeInput
            autoFocus
            onChange={setCode}
            onComplete={(c) => { if (!joining) onJoin(c) }}
          />
          {error && <p className="mt-3 text-sm font-medium text-red-400">{error}</p>}
        </div>

        <button
          type="button"
          disabled={!ready || joining}
          onClick={() => onJoin(code)}
          className={`mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-ember/40 sm:text-base ${
            ready && !joining
              ? "bg-ember text-arena-bg hover:scale-[1.02] active:scale-[0.99]"
              : "cursor-not-allowed border border-arena-border bg-arena-bg/50 text-arena-muted"
          }`}
        >
          {joining ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
          {joining ? "Finding…" : ready ? "Enter the arena" : "Enter 6 characters"}
        </button>
      </div>
    </div>
  )
}
