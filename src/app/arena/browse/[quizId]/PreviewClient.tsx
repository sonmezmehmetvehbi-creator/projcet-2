"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Play, Star, Check, Pencil, Users, ListChecks, Radio, SlidersHorizontal, Type } from "lucide-react"
import { LaunchChooser } from "@/components/arena/LaunchChooser"
import { StarDisplay, StarInput } from "@/components/arena/StarRating"
import { ANSWER_STYLES, AnswerShape } from "@/components/arena/AnswerShapes"
import { createClient } from "@/lib/supabase"

type PreviewQuestion = {
  id: string
  question_text: string
  question_type: "mc" | "tf" | "slider" | "fr"
  options: string[] | null
  correct_index: number | null
  correct_answer: string | null
  slider_min: number | null
  slider_max: number | null
  slider_correct: number | null
  image_url: string | null
}

export type PreviewData = {
  id: string
  title: string
  bannerColor: string
  creatorName: string
  subject: string
  topic: string
  playMode: "self_paced" | "live"
  questionCount: number
  playCount: number
  starCount: number
  starred: boolean
  avgRating: number
  ratingCount: number
  myRating: number
  isOwner: boolean
  questions: PreviewQuestion[]
}

export default function PreviewClient({ data }: { data: PreviewData }) {
  const [playOpen, setPlayOpen] = useState(false)

  // Optimistic star.
  const [starred, setStarred] = useState(data.starred)
  const [starCount, setStarCount] = useState(data.starCount)

  // Rating — no optimistic math. myRating/avgRating/ratingCount are ONLY set from
  // the server's authoritative response after a successful rate call.
  const [myRating, setMyRating] = useState(data.myRating)
  const [avgRating, setAvgRating] = useState(data.avgRating)
  const [ratingCount, setRatingCount] = useState(data.ratingCount)
  const [ratingBusy, setRatingBusy] = useState(false)

  async function toggleStar() {
    const next = !starred
    // Optimistic button state only. The "X saved" COUNT is driven by the Realtime
    // subscription below (+1/-1), so we never double-count our own action here.
    setStarred(next)
    try {
      const res = await fetch("/api/arena/forge-quiz/toggle-star", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: data.id, starred: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setStarred(!next)
    }
  }

  // ── Realtime: keep the aggregate rating + save count fresh for everyone ──
  // Ratings: on any insert/update, re-read the aggregate for this quiz and set the
  // average + count (absolute recompute — never touches the user's own myRating).
  // Stars: increment/decrement the save count incrementally on insert/delete.
  // (Both tables have RLS disabled and are in the supabase_realtime publication;
  //  forge_quiz_stars needs REPLICA IDENTITY FULL so DELETE payloads carry quiz_id.
  //  -- ALTER PUBLICATION supabase_realtime ADD TABLE forge_quiz_ratings;
  //  -- ALTER TABLE forge_quiz_stars REPLICA IDENTITY FULL;)
  useEffect(() => {
    const supabase = createClient()

    async function refreshRatingAggregate() {
      const { data: rows } = await supabase
        .from("forge_quiz_ratings")
        .select("rating")
        .eq("quiz_id", data.id)
      const count = rows?.length ?? 0
      const avg = count > 0 ? rows!.reduce((s, r: any) => s + (r.rating ?? 0), 0) / count : 0
      setRatingCount(count)
      setAvgRating(avg)
    }

    const channel = supabase
      .channel(`browse-preview-${data.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forge_quiz_ratings", filter: `quiz_id=eq.${data.id}` }, refreshRatingAggregate)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "forge_quiz_ratings", filter: `quiz_id=eq.${data.id}` }, refreshRatingAggregate)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forge_quiz_stars", filter: `quiz_id=eq.${data.id}` }, () => {
        setStarCount((c) => c + 1)
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "forge_quiz_stars", filter: `quiz_id=eq.${data.id}` }, () => {
        setStarCount((c) => Math.max(0, c - 1))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [data.id])

  async function handleRate(n: number) {
    if (ratingBusy) return
    setRatingBusy(true)
    try {
      const res = await fetch("/api/arena/forge-quiz/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: data.id, rating: n }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setMyRating(json.myRating)
        setAvgRating(json.avgRating)
        setRatingCount(json.ratingCount)
      }
    } finally {
      setRatingBusy(false)
    }
  }

  const accent = data.bannerColor

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-arena-bg text-arena-fg">
      <div style={{ height: "0.375rem", background: accent }} />
      <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-8 sm:px-8">
        <Link href="/arena/browse" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-arena-muted outline-none transition-colors hover:text-arena-fg focus-visible:ring-2 focus-visible:ring-brand/40">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Browse
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border" style={{ borderColor: `${accent}66`, background: `${accent}22`, color: "#fff" }}>
            {data.playMode === "live" ? <Radio className="h-6 w-6" aria-hidden /> : <ListChecks className="h-6 w-6" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-arena-fg sm:text-3xl">{data.title}</h1>
            <p className="mt-1 text-sm text-arena-muted">by {data.creatorName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {data.subject && <span className="rounded-md border border-arena-border bg-arena-bg/60 px-2 py-0.5 text-[11px] text-arena-muted">{data.subject}</span>}
              {data.topic && <span className="rounded-md border border-arena-border bg-arena-bg/60 px-2 py-0.5 text-[11px] text-arena-muted">{data.topic}</span>}
              <span className="rounded-md border border-arena-border bg-arena-bg/60 px-2 py-0.5 text-[11px] text-arena-muted">Read-only preview</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-arena-muted">
          <StarDisplay value={avgRating} count={ratingCount} size={16} />
          <span className="inline-flex items-center gap-1.5"><Play className="h-4 w-4" aria-hidden /> {data.playCount.toLocaleString()} plays</span>
          <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4" aria-hidden /> {starCount.toLocaleString()} saved</span>
          <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" aria-hidden /> {data.questionCount} questions</span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPlayOpen(true)}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground outline-none transition-transform hover:scale-[1.02] focus-visible:ring-4 focus-visible:ring-brand/40 active:scale-[0.99]"
          >
            <Play className="h-4 w-4" aria-hidden /> Play Now
          </button>
          <button
            type="button"
            onClick={toggleStar}
            aria-pressed={starred}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ember/40 ${
              starred ? "border-ember/50 bg-ember/15 text-ember" : "border-arena-border bg-arena-bg/60 text-arena-fg hover:border-ember/50 hover:text-ember"
            }`}
          >
            <Star className={`h-4 w-4 ${starred ? "fill-ember" : ""}`} aria-hidden /> {starred ? "Saved to Library" : "Save to My Library"}
          </button>
          {data.isOwner && (
            <Link
              href={`/arena/forge-quiz/${data.id}/edit`}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-arena-border bg-arena-bg/60 px-5 py-2.5 text-sm font-semibold text-arena-fg outline-none transition-colors hover:border-brand/50 hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <Pencil className="h-4 w-4" aria-hidden /> Manage
            </Link>
          )}
        </div>

        {/* Rating widget — available to any logged-in user (click-to-set). */}
        <div className="mt-6 rounded-2xl border border-arena-border bg-surface/60 p-4 sm:p-5">
          <p className="text-sm font-semibold text-arena-fg">{myRating ? "Your rating" : "Rate this quiz"}</p>
          <p className="mt-0.5 text-xs text-arena-muted">{myRating ? "Tap a star to change it." : "Help others discover great quizzes."}</p>
          <div className="mt-3">
            <StarInput value={myRating} onRate={handleRate} disabled={ratingBusy} />
          </div>
        </div>

        {/* Full question list (read-only) */}
        <h2 className="mb-3 mt-8 text-lg font-semibold text-arena-fg">All {data.questions.length} questions</h2>
        <div className="flex flex-col gap-3">
          {data.questions.map((q, i) => (
            <QuestionPreview key={q.id} q={q} index={i} />
          ))}
          {data.questions.length === 0 && <p className="text-sm text-arena-muted">This quiz has no questions.</p>}
        </div>
      </div>

      {playOpen && (
        <LaunchChooser
          quizId={data.id}
          onClose={() => setPlayOpen(false)}
          owner={data.isOwner}
          editHref={`/arena/forge-quiz/${data.id}/edit`}
          title="Play now"
        />
      )}
    </div>
  )
}

function QuestionPreview({ q, index }: { q: PreviewQuestion; index: number }) {
  const isChoice = q.question_type === "mc" || q.question_type === "tf"
  const nOptions = q.question_type === "tf" ? 2 : Math.min(4, q.options?.length ?? 0)

  return (
    <div className="rounded-2xl border border-arena-border bg-surface/60 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand/30 bg-brand/12 text-xs font-bold text-brand-foreground">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-6 text-arena-fg">{q.question_text}</p>
          {q.image_url && <img src={q.image_url} alt="" className="mt-2 max-h-40 rounded-xl" />}

          {isChoice && (
            <div className="mt-3 grid gap-2">
              {Array.from({ length: nOptions }).map((_, i) => {
                const s = ANSWER_STYLES[i]
                const label = q.question_type === "tf" ? (i === 0 ? "True" : "False") : q.options?.[i]
                const correct = i === q.correct_index
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${correct ? "border-green-400/60 bg-green-500/10" : "border-arena-border bg-arena-bg/40"}`}
                  >
                    <AnswerShape shape={s.shape} size={20} />
                    <span className={`flex-1 text-sm ${correct ? "font-semibold text-arena-fg" : "text-arena-muted"}`}>{label}</span>
                    {correct && <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-300"><Check className="h-4 w-4" aria-hidden /> Correct</span>}
                  </div>
                )
              })}
            </div>
          )}

          {q.question_type === "slider" && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-400/50 bg-green-500/10 px-3 py-2.5 text-sm">
              <SlidersHorizontal className="h-4 w-4 text-green-300" aria-hidden />
              <span className="text-arena-muted">Answer between {q.slider_min ?? 0}–{q.slider_max ?? 100}:</span>
              <span className="font-semibold text-arena-fg">{q.slider_correct}</span>
            </div>
          )}

          {q.question_type === "fr" && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-400/50 bg-green-500/10 px-3 py-2.5 text-sm">
              <Type className="h-4 w-4 text-green-300" aria-hidden />
              <span className="text-arena-muted">Accepted answer:</span>
              <span className="font-semibold text-arena-fg">{q.correct_answer}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
