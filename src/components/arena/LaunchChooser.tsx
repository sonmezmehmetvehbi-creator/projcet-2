"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X, Play, Link2, Gamepad2, Pencil, Loader2, ArrowLeft } from "lucide-react"
import { DURATIONS, pill, input, sel, customHours } from "@/components/arena/forgeShared"

// Unified launch chooser used from every entry point: My Quizzes card, the
// Manage/edit screen, and a public quiz's Browse preview. Launching always spins
// up a fresh copy of the quiz (relaunch → source_quiz_id), decoupled from the
// original template.
//
//   • Play Solo       — private single-player self-paced attempt, no room/sharing
//   • Self-Paced Room — pick a duration, get a shareable link/lobby
//   • Host Live        — open a live waiting room to host
//
// `owner` shows a Manage/Edit shortcut; non-creators never see it.
export function LaunchChooser({
  quizId,
  onClose,
  owner = false,
  editHref,
  title = "Launch quiz",
}: {
  quizId: string
  onClose: () => void
  owner?: boolean
  editHref?: string
  title?: string
}) {
  const router = useRouter()
  const [view, setView] = useState<"choose" | "room">("choose")
  const [busy, setBusy] = useState<"solo" | "room" | "live" | null>(null)
  const [error, setError] = useState("")

  // Self-Paced Room duration state (same presets as create/edit).
  const [duration, setDuration] = useState("24h")
  const [durationMode, setDurationMode] = useState<"preset" | "custom">("preset")
  const [customValue, setCustomValue] = useState(3)
  const [customUnit, setCustomUnit] = useState<"hours" | "days">("hours")

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && !busy) onClose() }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev }
  }, [busy, onClose])

  // Clone the quiz into a fresh instance and return the new quiz id.
  async function relaunch(playMode: "self_paced" | "live", opts: { duration?: string; customDurationHours?: number | null } = {}) {
    const relRes = await fetch("/api/arena/forge-quiz/relaunch", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalQuizId: quizId, playMode, duration: opts.duration ?? "7d", customDurationHours: opts.customDurationHours ?? null }),
    })
    const rel = await relRes.json()
    if (!relRes.ok || !rel.newQuizId) throw new Error(rel.error || "Could not start the quiz")
    return rel.newQuizId as string
  }

  async function playSolo() {
    if (busy) return
    setBusy("solo"); setError("")
    try {
      // Private single-player attempt: a long-lived self-paced copy, straight to play.
      const newId = await relaunch("self_paced", { duration: "7d" })
      router.push(`/arena/forge-quiz/${newId}/play`)
    } catch (e: any) { setError(e.message || "Something went wrong"); setBusy(null) }
  }

  async function startRoom() {
    if (busy) return
    setBusy("room"); setError("")
    try {
      const customDurationHours = durationMode === "custom" ? customHours(customValue, customUnit) : null
      const newId = await relaunch("self_paced", { duration, customDurationHours })
      router.push(`/arena/forge-quiz/${newId}/lobby`)
    } catch (e: any) { setError(e.message || "Something went wrong"); setBusy(null) }
  }

  async function hostLive() {
    if (busy) return
    setBusy("live"); setError("")
    try {
      const newId = await relaunch("live")
      const sesRes = await fetch("/api/arena/forge-quiz/live/start-session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: newId }),
      })
      const ses = await sesRes.json()
      if (!sesRes.ok || !ses.sessionId) throw new Error(ses.error || "Could not open the live room")
      router.push(`/arena/forge-quiz/live/${ses.sessionId}/host`)
    } catch (e: any) { setError(e.message || "Something went wrong"); setBusy(null) }
  }

  return (
    <div
      onClick={() => !busy && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-arena-bg/80 p-5 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-arena-border bg-surface p-6 shadow-2xl shadow-black/60"
      >
        <button
          type="button"
          onClick={() => !busy && onClose()}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-arena-muted transition-colors hover:bg-arena-bg/60 hover:text-arena-fg"
        >
          <X className="h-4 w-4" />
        </button>

        {view === "choose" ? (
          <>
            <h3 className="text-lg font-semibold tracking-tight text-arena-fg">{title}</h3>
            <p className="mt-1 text-sm text-arena-muted">How do you want to run it?</p>

            <div className="mt-5 grid gap-3">
              <OptionButton
                icon={busy === "solo" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                accent="brand" title="▶ Play Solo" desc="Play it yourself right now · private, no sharing"
                onClick={playSolo} disabled={!!busy}
              />
              <OptionButton
                icon={<Link2 className="h-5 w-5" />}
                accent="sky" title="🔗 Self-Paced Room" desc="Pick a duration, share a link · players go at their own pace"
                onClick={() => setView("room")} disabled={!!busy}
              />
              <OptionButton
                icon={busy === "live" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Gamepad2 className="h-5 w-5" />}
                accent="ember" title="🎮 Host Live" desc="Players join with a code · you host like Kahoot"
                onClick={hostLive} disabled={!!busy}
              />
            </div>

            {owner && editHref && (
              <a
                href={editHref}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-arena-border bg-arena-bg/60 px-4 py-2.5 text-sm font-medium text-arena-muted outline-none transition-colors hover:border-brand/50 hover:text-arena-fg focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <Pencil className="h-4 w-4" aria-hidden /> Manage / Edit questions
              </a>
            )}

            {error && <p className="mt-3 text-sm font-medium text-red-400">{error}</p>}
          </>
        ) : (
          <>
            <button type="button" onClick={() => !busy && setView("choose")} className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-arena-muted transition-colors hover:text-arena-fg">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </button>
            <h3 className="text-lg font-semibold tracking-tight text-arena-fg">🔗 Self-Paced Room</h3>
            <p className="mt-1 text-sm text-arena-muted">How long should the room stay open?</p>

            {/* Same duration UI as create/edit */}
            <div className="mt-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "0.5rem" }}>
              {DURATIONS.map((d) => (
                <button key={d.value} type="button" onClick={() => { setDurationMode("preset"); setDuration(d.value) }} style={pill(durationMode === "preset" && duration === d.value)}>{d.label}</button>
              ))}
              <button type="button" onClick={() => setDurationMode("custom")} style={pill(durationMode === "custom")}>Custom…</button>
            </div>
            {durationMode === "custom" && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", maxWidth: "20rem" }}>
                <input style={input} type="number" min={1} value={customValue} onChange={(e) => setCustomValue(Math.max(1, Number(e.target.value) || 1))} />
                <select style={{ ...sel, maxWidth: "9rem" }} value={customUnit} onChange={(e) => setCustomUnit(e.target.value as "hours" | "days")}>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
              </div>
            )}

            {error && <p className="mt-3 text-sm font-medium text-red-400">{error}</p>}

            <button
              type="button"
              onClick={startRoom}
              disabled={!!busy}
              className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-sky px-5 py-3 text-sm font-semibold text-arena-bg outline-none transition-transform hover:scale-[1.01] focus-visible:ring-4 focus-visible:ring-sky/40 active:scale-[0.99] disabled:opacity-60"
            >
              {busy === "room" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
              {busy === "room" ? "Creating room…" : "Create Room & Share"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function OptionButton({
  icon, accent, title, desc, onClick, disabled,
}: {
  icon: React.ReactNode
  accent: "brand" | "sky" | "ember"
  title: string
  desc: string
  onClick: () => void
  disabled?: boolean
}) {
  const ring = accent === "brand" ? "hover:border-brand/50 hover:bg-brand/10" : accent === "sky" ? "hover:border-sky/50 hover:bg-sky/10" : "hover:border-ember/50 hover:bg-ember/10"
  const iconBox = accent === "brand" ? "border-brand/30 bg-brand/12 text-brand-foreground" : accent === "sky" ? "border-sky/30 bg-sky/12 text-sky" : "border-ember/30 bg-ember/12 text-ember"
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 rounded-xl border border-arena-border bg-arena-bg/60 p-4 text-left transition-colors disabled:opacity-60 ${ring}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconBox}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-arena-fg">{title}</span>
        <span className="block text-xs text-arena-muted">{desc}</span>
      </span>
    </button>
  )
}
