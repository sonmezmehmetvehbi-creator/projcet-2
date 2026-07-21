"use client"

import { motion } from "framer-motion"
import {
  Atom,
  BookText,
  BrainCircuit,
  Calculator,
  Code2,
  Dna,
  FlaskConical,
  Globe2,
  Languages,
  LineChart,
  PenTool,
  Shapes,
  Sigma,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { Reveal } from "@/components/landing/reveal"

const SUBJECTS = [
  {
    name: "SAT Math",
    desc: "College Board–style practice, full sections, and timed drills.",
    icon: PenTool,
    className: "sm:col-span-2 sm:row-span-2",
    featured: true,
  },
  { name: "Calculus", desc: "Limits, derivatives, integrals.", icon: Sigma, className: "" },
  { name: "AP Biology", desc: "Cells to ecosystems.", icon: Dna, className: "" },
  { name: "Chemistry", desc: "Reactions & stoichiometry.", icon: FlaskConical, className: "" },
  { name: "Physics", desc: "Mechanics & waves.", icon: Atom, className: "" },
  { name: "US History", desc: "Eras, causes & effects.", icon: Globe2, className: "sm:col-span-2" },
  { name: "Essay Writing", desc: "Structure & argument.", icon: PenTool, className: "" },
  { name: "Spanish", desc: "Vocab & grammar.", icon: Languages, className: "" },
  { name: "Computer Science", desc: "Logic & algorithms.", icon: Code2, className: "" },
  { name: "Economics", desc: "Micro & macro.", icon: TrendingUp, className: "" },
  { name: "Psychology", desc: "Mind & behavior.", icon: BrainCircuit, className: "" },
  { name: "Statistics", desc: "Data & probability.", icon: LineChart, className: "" },
  { name: "Algebra", desc: "Equations & functions.", icon: Calculator, className: "" },
  { name: "AP English", desc: "Rhetoric & analysis.", icon: BookText, className: "" },
  { name: "French", desc: "Vocab & conversation.", icon: Languages, className: "" },
  { name: "Geometry", desc: "Shapes & proofs.", icon: Shapes, className: "" },
]

export default function SubjectGrid() {
  return (
    <section id="subjects" className="relative bg-secondary py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Every subject
          </span>
          <h2 className="mt-3 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            One platform. Endless practice.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Generate exam-quality questions across dozens of subjects. Hover a card to feel the glow.
          </p>
        </Reveal>

        <div className="mt-12 grid auto-rows-[minmax(150px,auto)] grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SUBJECTS.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 ${s.className} ${
                s.featured
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:glow-green"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  s.featured
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                }`}
              >
                <s.icon className="h-6 w-6" />
              </span>
              <div className="mt-6">
                <h3
                  className={`font-serif font-semibold ${
                    s.featured ? "text-3xl" : "text-xl text-foreground"
                  }`}
                >
                  {s.name}
                </h3>
                <p
                  className={`mt-1.5 text-sm leading-relaxed ${
                    s.featured ? "text-primary-foreground/85" : "text-muted-foreground"
                  }`}
                >
                  {s.desc}
                </p>
                {s.featured && (
                  <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5" /> Most popular
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
