"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Sparkles, Rocket, type LucideIcon } from "lucide-react"

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel: string
  actionHref?: string
  tone?: "brand" | "sky"
}

export function EmptyState({
  icon: Icon = Rocket,
  title,
  description,
  actionLabel,
  actionHref = "/arena/forge-quiz/create",
  tone = "brand",
}: EmptyStateProps) {
  const reduceMotion = useReducedMotion()
  const toneRing = tone === "brand" ? "border-brand/35 bg-brand/12 text-brand-foreground" : "border-sky/35 bg-sky/12 text-sky"

  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-dashed border-arena-border bg-surface/40 px-6 py-12 text-center sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-brand/20 blur-3xl"
      />

      <motion.div
        animate={reduceMotion ? undefined : { y: [-6, 6, -6] }}
        transition={{ duration: 4.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="relative"
      >
        <span className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${toneRing}`}>
          <Icon className="h-8 w-8" aria-hidden />
        </span>
        <motion.span
          aria-hidden
          animate={reduceMotion ? undefined : { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute -top-2 -right-2 text-ember"
        >
          <Sparkles className="h-4 w-4" />
        </motion.span>
      </motion.div>

      <h3 className="relative mt-6 text-lg font-semibold text-balance text-arena-fg">{title}</h3>
      <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-arena-muted text-pretty">
        {description}
      </p>

      <Link
        href={actionHref}
        className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-transform duration-200 outline-none hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-brand/40 active:scale-[0.99]"
      >
        {actionLabel}
      </Link>
    </div>
  )
}
