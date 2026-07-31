"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, Star, Users, ListChecks, Play, Radio, Compass } from "lucide-react"
import { StarDisplay } from "@/components/arena/StarRating"

export type BrowseQuiz = {
  id: string
  title: string
  bannerColor: string
  playMode: "self_paced" | "live"
  creatorName: string
  isOwner: boolean
  subject: string
  topic: string
  questionCount: number
  playCount: number
  starCount: number
  starred: boolean
  avgRating: number
  ratingCount: number
  myRating: number
  createdAt: string
}

type Sort = "popular" | "rated" | "newest" | "saved"
const RATING_MIN = 3 // "Highest Rated" needs at least this many ratings to rank above sparse ones

function abbrev(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0).replace(/\.0$/, "") + "k"
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
}

export default function BrowseClient({ quizzes }: { quizzes: BrowseQuiz[] }) {
  const [rawSearch, setRawSearch] = useState("")
  const [search, setSearch] = useState("")
  const [subject, setSubject] = useState("all")
  const [sort, setSort] = useState<Sort>("popular")

  // Optimistic star state (id → starred / count override).
  const [starOn, setStarOn] = useState<Record<string, boolean>>({})
  const [starCt, setStarCt] = useState<Record<string, number>>({})

  // Debounced search (~300ms).
  useEffect(() => {
    const t = setTimeout(() => setSearch(rawSearch.trim().toLowerCase()), 300)
    return () => clearTimeout(t)
  }, [rawSearch])

  const isStarred = (q: BrowseQuiz) => starOn[q.id] ?? q.starred
  const starCountOf = (q: BrowseQuiz) => starCt[q.id] ?? q.starCount

  // Subjects actually present across public quizzes.
  const subjects = useMemo(() => {
    const set = new Set<string>()
    for (const q of quizzes) if (q.subject) set.add(q.subject)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [quizzes])

  const filtered = useMemo(() => {
    const list = quizzes.filter((q) => {
      if (subject !== "all" && q.subject !== subject) return false
      if (search) {
        const hay = `${q.title} ${q.subject} ${q.topic}`.toLowerCase()
        if (!hay.includes(search)) return false
      }
      return true
    })
    return list.sort((a, b) => {
      if (sort === "popular") return b.playCount - a.playCount
      if (sort === "saved") return starCountOf(b) - starCountOf(a)
      if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      // "rated": enough-ratings first, then by average, then by rating volume.
      const aEnough = a.ratingCount >= RATING_MIN
      const bEnough = b.ratingCount >= RATING_MIN
      if (aEnough !== bEnough) return aEnough ? -1 : 1
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating
      return b.ratingCount - a.ratingCount
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizzes, subject, search, sort, starOn, starCt])

  async function toggleStar(q: BrowseQuiz) {
    const currentlyStarred = isStarred(q)
    const baseCount = starCountOf(q)
    const next = !currentlyStarred
    setStarOn((s) => ({ ...s, [q.id]: next }))
    setStarCt((c) => ({ ...c, [q.id]: baseCount + (next ? 1 : -1) }))
    try {
      const res = await fetch("/api/arena/forge-quiz/toggle-star", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: q.id, starred: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setStarOn((s) => ({ ...s, [q.id]: currentlyStarred }))
      setStarCt((c) => ({ ...c, [q.id]: baseCount }))
    }
  }

  const selectClass = "rounded-xl border border-arena-border bg-surface/60 px-3 py-2.5 text-sm font-medium text-arena-fg outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [color-scheme:dark]"

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-arena-bg text-arena-fg">
      <section className="relative mx-auto w-full max-w-6xl px-5 pt-14 pb-24 sm:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-arena-fg sm:text-4xl">🔍 Browse Quizzes</h1>
          <p className="mt-2 text-sm text-arena-muted sm:text-base">Discover and play quizzes created by the community</p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-arena-muted" aria-hidden />
            <input
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              placeholder="Search by title or subject…"
              aria-label="Search quizzes"
              className="w-full rounded-xl border border-arena-border bg-surface/60 py-2.5 pl-9 pr-3 text-sm text-arena-fg outline-none transition-colors placeholder:text-arena-muted/60 focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand/30"
            />
          </div>
          <select aria-label="Filter by subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={selectClass}>
            <option value="all">All subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select aria-label="Sort quizzes" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectClass}>
            <option value="popular">Most Popular</option>
            <option value="rated">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="saved">Most Saved</option>
          </select>
        </div>

        {/* Results */}
        <div className="mt-8">
          {quizzes.length === 0 ? (
            <EmptyState title="No public quizzes yet" description="When creators make a quiz public, it'll show up here for everyone to discover." />
          ) : filtered.length === 0 ? (
            <EmptyState title="No quizzes match" description="Try a different search term, subject, or clear your filters." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((q, i) => (
                <motion.li
                  key={q.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="[&>*]:h-full"
                >
                  <BrowseCard q={q} starred={isStarred(q)} starCount={starCountOf(q)} onToggleStar={() => toggleStar(q)} />
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function BrowseCard({
  q, starred, starCount, onToggleStar,
}: { q: BrowseQuiz; starred: boolean; starCount: number; onToggleStar: () => void }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-arena-border bg-surface/60 backdrop-blur-sm transition-all duration-300 hover:border-brand/40 hover:bg-surface/85 hover:shadow-xl hover:shadow-brand/10">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: q.bannerColor }} />
      <Link href={`/arena/browse/${q.id}`} className="flex flex-1 flex-col gap-3 p-4 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/30 bg-brand/12 text-brand-foreground">
            {q.playMode === "live" ? <Radio className="h-5 w-5" aria-hidden /> : <ListChecks className="h-5 w-5" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-semibold leading-6 text-arena-fg">{q.title}</h3>
            <p className="mt-0.5 truncate text-xs text-arena-muted">by {q.creatorName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {q.subject && (
            <span className="rounded-md border border-arena-border bg-arena-bg/60 px-2 py-0.5 text-[11px] text-arena-muted">{q.subject}</span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-arena-muted">
            <Users className="h-3.5 w-3.5" aria-hidden /> {q.questionCount} Q
          </span>
        </div>

        <StarDisplay value={q.avgRating} count={q.ratingCount} />

        <div className="mt-auto flex items-center gap-4 pt-1 text-xs text-arena-muted">
          <span className="inline-flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5" aria-hidden /> {abbrev(q.playCount)} play{q.playCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" aria-hidden /> {abbrev(starCount)}
          </span>
        </div>
      </Link>

      {/* Save quick-action — outside the Link so clicking it never navigates. */}
      <div className="border-t border-arena-border p-3">
        <button
          type="button"
          onClick={onToggleStar}
          aria-pressed={starred}
          className={`inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ember/40 ${
            starred
              ? "border-ember/50 bg-ember/15 text-ember"
              : "border-arena-border bg-arena-bg/60 text-arena-fg hover:border-ember/50 hover:text-ember"
          }`}
        >
          <Star className={`h-4 w-4 ${starred ? "fill-ember" : ""}`} aria-hidden />
          {starred ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-arena-border bg-surface/40 px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/35 bg-brand/12 text-brand-foreground">
        <Compass className="h-8 w-8" aria-hidden />
      </span>
      <h3 className="mt-6 text-lg font-semibold text-arena-fg">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-arena-muted">{description}</p>
    </div>
  )
}
