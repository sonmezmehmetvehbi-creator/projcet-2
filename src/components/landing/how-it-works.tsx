"use client"

import { motion } from "framer-motion"
import { BookOpen, Sparkles, TrendingUp } from "lucide-react"
import { Reveal } from "@/components/landing/reveal"

const STEPS = [
  {
    num: "01",
    tag: "Choose",
    title: "Choose Your Subject",
    body: "Pick from 80+ subjects including SAT, AP courses, languages, and more.",
    icon: BookOpen,
  },
  {
    num: "02",
    tag: "Generate",
    title: "Generate & Practice",
    body: "Get AI-generated questions, worksheets, or SAT practice sets instantly tailored to your level.",
    icon: Sparkles,
  },
  {
    num: "03",
    tag: "Track",
    title: "Track Your Progress",
    body: "Earn XP, level up, and watch your skills improve over time. Book a tutor when you need extra help.",
    icon: TrendingUp,
  },
]

export default function HowItWorks() {
  return (
    <section id="the-way" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal>
          <div className="flex items-end justify-between gap-6 border-b border-border pb-8">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                How it works
              </span>
              <h2 className="mt-3 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                The AceForge Way
              </h2>
            </div>
            <p className="hidden max-w-xs text-right text-muted-foreground md:block">
              Three deliberate steps between you and a higher score.
            </p>
          </div>
        </Reveal>

        {/* horizontal scroll on mobile, grid on desktop */}
        <div className="no-scrollbar -mx-5 mt-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pt-10 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:px-0">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative min-w-[80%] snap-center rounded-3xl border border-border bg-card p-8 transition-all hover:-translate-y-1.5 hover:glow-green sm:min-w-[60%] lg:min-w-0"
            >
              <div className="flex items-start justify-between">
                <span className="font-serif text-7xl font-semibold leading-none text-accent transition-colors group-hover:text-primary/25">
                  {step.num}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <step.icon className="h-6 w-6" />
                </span>
              </div>
              <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-primary">
                {step.num} / {step.tag}
              </p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
