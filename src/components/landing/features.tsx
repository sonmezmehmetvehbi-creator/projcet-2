import { ArrowUpRight, GraduationCap, Sparkles, Target } from "lucide-react"
import { Reveal } from "@/components/landing/reveal"

const FEATURES = [
  {
    icon: Sparkles,
    index: "01",
    title: "AI Question Generator",
    description:
      "Generate custom questions for any subject and grade level. Multiple choice, free response, and worksheets. Powered by GPT-4o.",
  },
  {
    icon: Target,
    index: "02",
    title: "SAT & ACT Prep",
    description:
      "College Board-style practice questions with detailed explanations. Track your weak areas and improve your score.",
  },
  {
    icon: GraduationCap,
    index: "03",
    title: "Expert Tutors",
    description:
      "Book verified 1-on-1 tutors for any subject. Starting at $34.99/hr with Premium. Satisfaction guaranteed.",
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Everything you need
          </span>
          <h2 className="mt-3 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Prep, practice, improve.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delayIndex={i}>
              <article className="group flex h-full flex-col bg-card p-8 transition-colors hover:bg-accent">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </span>
                  <span className="font-serif text-4xl font-semibold text-border transition-colors group-hover:text-primary/30">
                    {feature.index}
                  </span>
                </div>
                <h3 className="mt-8 flex items-center gap-1.5 font-serif text-2xl font-semibold text-foreground">
                  {feature.title}
                  <ArrowUpRight className="h-5 w-5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
