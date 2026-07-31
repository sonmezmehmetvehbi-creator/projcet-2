"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Wand2, ArrowRight, FileText, Users } from "lucide-react"

// Visual card only — the CTA links to the REAL create flow.
export function CreateQuizCard({ href = "/arena/forge-quiz/create" }: { href?: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-arena-border bg-surface/70 p-6 shadow-xl shadow-black/40 backdrop-blur-sm transition-colors duration-300 hover:border-brand/45 sm:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 h-52 w-52 rounded-full bg-brand/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100 sm:opacity-60"
      />

      <div className="relative flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/40 bg-brand/15 text-brand-foreground shadow-lg shadow-brand/20">
          <Wand2 className="h-6 w-6" aria-hidden />
        </span>
        <span className="rounded-full border border-arena-border bg-arena-bg/60 px-2.5 py-1 text-[11px] font-medium text-arena-muted">
          AI assist
        </span>
      </div>

      <h3 className="relative mt-5 text-2xl font-semibold tracking-tight text-arena-fg">Create a Quiz</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-arena-muted">
        Build a question set from scratch or generate one from your notes, then host it live or share it
        self-paced.
      </p>

      <ul className="relative mt-5 flex flex-wrap gap-2 text-xs text-arena-muted">
        <li className="inline-flex items-center gap-1.5 rounded-lg border border-arena-border bg-arena-bg/50 px-2.5 py-1.5">
          <FileText className="h-3.5 w-3.5 text-sky" aria-hidden />
          Any subject
        </li>
        <li className="inline-flex items-center gap-1.5 rounded-lg border border-arena-border bg-arena-bg/50 px-2.5 py-1.5">
          <Users className="h-3.5 w-3.5 text-ember" aria-hidden />
          Up to 200 players
        </li>
      </ul>

      <Link
        href={href}
        className="animate-idle-glow relative mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 text-sm font-semibold text-brand-foreground transition-transform duration-200 outline-none hover:scale-[1.02] focus-visible:ring-4 focus-visible:ring-brand/40 active:scale-[0.99] sm:text-base"
      >
        Start building
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </motion.div>
  )
}
