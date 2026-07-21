"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"

const FREE = [
  "2 AI questions per day",
  "2 worksheets per day",
  "1 SAT practice set per day",
  "Access to tutor marketplace",
  "Basic XP tracking",
  "Ad supported",
]

const PREMIUM = [
  "Unlimited AI questions ⚡",
  "Unlimited worksheets ⚡",
  "Unlimited SAT practice ⚡",
  "No wait time between generations",
  "Premium tutor rate ($34.99/hr vs $49.99/hr)",
  "Ad free experience",
  "Bonus XP on level up",
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Pricing
          </span>
          <h2 className="mt-3 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Simple. Honest. Cheap.
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 items-center gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Free - smaller */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-border bg-card p-8"
          >
            <p className="font-serif text-2xl font-semibold text-foreground">Free</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything to get started.
            </p>
            <p className="mt-6 font-serif text-5xl font-semibold text-foreground">
              $0
            </p>
            <p className="text-sm text-muted-foreground">/ month</p>

            <ul className="mt-8 space-y-3">
              {FREE.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="mt-8 flex w-full items-center justify-center rounded-full border border-border py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Get Started Free
            </Link>
          </motion.div>

          {/* Premium - larger */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[2rem] bg-primary p-10 text-primary-foreground glow-green lg:p-12"
          >
            <div
              aria-hidden="true"
              className="dot-grid pointer-events-none absolute inset-0 opacity-10"
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="font-serif text-3xl font-semibold">Premium</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5" /> Most Popular
                </span>
              </div>
              <p className="mt-2 text-primary-foreground/80">
                Unlimited everything. No limits, no waiting.
              </p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-6xl font-semibold">$5.99</span>
                <span className="text-primary-foreground/70">/ month</span>
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {PREMIUM.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className="mt-9 flex w-full items-center justify-center rounded-full bg-primary-foreground py-3.5 text-base font-semibold text-primary transition-transform hover:-translate-y-0.5"
              >
                Upgrade to Premium
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
