"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

const WITHOUT = [
  "Generic textbook questions",
  "No instant feedback",
  "Expensive tutors ($100+/hr)",
  "Hours of wasted study time",
  "No progress tracking",
]

const WITH = [
  "AI questions for any topic",
  "Instant explanations",
  "Verified tutors from $34.99/hr",
  "Study smarter, not harder",
  "XP tracking & analytics",
]

export default function SplitComparison() {
  return (
    <section id="compare" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            The difference
          </span>
          <h2 className="mt-3 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Study nights, reimagined.
          </h2>
        </div>

        <div className="relative mt-14 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-0">
          {/* Without */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-border bg-card p-8 lg:rounded-r-none lg:p-10"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Without AceForge
            </p>
            <h3 className="mt-2 font-serif text-3xl font-semibold text-muted-foreground">
              Guesswork &amp; grind
            </h3>
            <ul className="mt-8 space-y-4">
              {WITHOUT.map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                    <X className="h-3.5 w-3.5" />
                  </span>
                  <span className="leading-relaxed line-through decoration-muted-foreground/40">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* With */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-3xl bg-primary p-8 text-primary-foreground lg:-my-6 lg:rounded-l-none lg:p-10 lg:shadow-2xl"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
              With AceForge
            </p>
            <h3 className="mt-2 font-serif text-3xl font-semibold">
              Focus &amp; flow
            </h3>
            <ul className="mt-8 space-y-4">
              {WITH.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
