"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BadgeCheck, Sparkles, Star } from "lucide-react"

const TUTORS = [
  {
    name: "Alex M.",
    initials: "AM",
    subjects: ["SAT Math", "Calculus"],
    rating: 4.9,
    reviews: 47,
    rate: "$34.99/hr",
    badge: "Premium",
  },
  {
    name: "Sarah J.",
    initials: "SJ",
    subjects: ["AP Biology", "Chemistry"],
    rating: 4.8,
    reviews: 32,
    rate: "$34.99/hr",
    badge: "Premium",
  },
  {
    name: "David K.",
    initials: "DK",
    subjects: ["Essay Writing", "AP English"],
    rating: 5.0,
    reviews: 28,
    rate: "$34.99/hr",
    badge: "Premium",
  },
]

export default function TutorShowcase() {
  return (
    <section id="tutors" className="relative bg-secondary py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Verified tutors
            </span>
            <h2 className="mt-3 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Real experts, on demand.
            </h2>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TUTORS.map((t, i) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1.5 hover:glow-green"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary font-serif text-xl font-semibold text-primary-foreground">
                    {t.initials}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-serif text-lg font-semibold text-foreground">
                        {t.name}
                      </h3>
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-primary">{t.rate}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                  <Sparkles className="h-3 w-3" /> {t.badge}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {t.subjects.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {t.rating.toFixed(1)}
                </span>
                <span className="text-muted-foreground">{t.reviews} reviews</span>
              </div>

              <Link
                href="/tutoring"
                className="mt-4 w-full rounded-full bg-accent py-2.5 text-center text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
              >
                Book a session
              </Link>
            </motion.article>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/tutoring"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Browse All Tutors
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
