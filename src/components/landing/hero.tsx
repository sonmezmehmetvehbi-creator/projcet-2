"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Check, Search, Sparkles } from "lucide-react"
import { Typewriter } from "@/components/landing/typewriter"

export default function Hero({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28"
    >
      {/* dot grid background */}
      <div
        aria-hidden="true"
        className="dot-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        {/* Left column */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered study platform
          </motion.div>

          <h1 className="font-serif text-6xl font-semibold leading-[0.92] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              Study Smarter.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="block italic text-primary"
            >
              Score Higher.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground"
          >
            Instantly generate unlimited practice questions{" "}
            <span className="font-semibold text-foreground">
              <Typewriter
                phrases={[
                  "for SAT Math",
                  "for Calculus",
                  "for AP Biology",
                  "for Essay Writing",
                  "for Chemistry",
                  "for US History",
                ]}
              />
            </span>
            <br />
            AI-powered questions, worksheets, and expert tutors — all in one
            place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  Start Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/tutoring"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  <Search className="h-4 w-4" />
                  Find a Tutor
                </Link>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-8 flex items-center gap-6 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" /> 1,000+ students
            </span>
          </motion.div>
        </div>

        {/* Right column - floating cards */}
        <div className="relative h-[420px] sm:h-[480px]">
          <FloatingCards />
        </div>
      </div>
    </section>
  )
}

function FloatingCards() {
  return (
    <div className="relative h-full w-full">
      {/* Card 1 - main question */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="glow-green animate-float absolute left-0 top-4 w-[78%] max-w-sm rounded-2xl border border-border bg-card p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            SAT Math
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Q 04 / 10
          </span>
        </div>
        <p className="text-sm font-medium leading-relaxed text-foreground">
          {"If 3x + 7 = 22, what is the value of x + 4?"}
        </p>
        <div className="mt-4 space-y-2">
          {["A. 5", "B. 9", "C. 11", "D. 15"].map((opt, i) => (
            <div
              key={opt}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                i === 1
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {opt}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Card 2 - progress */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 8 }}
        animate={{ opacity: 1, y: 0, rotate: 5 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="animate-float-slow absolute bottom-2 right-0 w-[62%] max-w-[15rem] rounded-2xl border border-border bg-card p-5 shadow-xl"
      >
        <p className="text-xs font-medium text-muted-foreground">
          Weekly progress
        </p>
        <p className="mt-1 font-serif text-3xl font-semibold text-foreground">
          +38%
        </p>
        <div className="mt-3 flex items-end gap-1.5">
          {[40, 55, 45, 70, 60, 85, 95].map((h, i) => (
            <motion.span
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.6, delay: 0.6 + i * 0.06 }}
              className="w-full rounded-sm bg-primary/80"
              style={{ minHeight: 4 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Card 3 - small badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="animate-float absolute right-6 top-0 flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 shadow-lg"
      >
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">
          AI generated
        </span>
      </motion.div>
    </div>
  )
}
