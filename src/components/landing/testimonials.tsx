import { Star } from 'lucide-react'
import { Reveal } from '@/components/landing/reveal'

const TESTIMONIALS = [
  {
    quote:
      'AceForge helped me go from a 1180 to 1420 on the SAT in just 2 months. The AI questions are spot on!',
    name: 'Sarah K.',
    detail: 'High School Junior',
    initials: 'SK',
  },
  {
    quote:
      'Way better than any AP prep book. The questions actually match the real exam style and the explanations are amazing.',
    name: 'Marcus T.',
    detail: 'AP Biology Student',
    initials: 'MT',
  },
  {
    quote:
      'Found an amazing calculus tutor in minutes. My grade went from a C to an A by the end of the semester.',
    name: 'Priya S.',
    detail: 'College Freshman',
    initials: 'PS',
  },
]

export default function Testimonials() {
  return (
    <section id="reviews" className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Loved by students
          </span>
          <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Real results from real students
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delayIndex={i}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
                <div className="flex items-center gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-pretty leading-relaxed text-foreground">
                  {`“${t.quote}”`}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                    {t.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {t.name}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {t.detail}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
