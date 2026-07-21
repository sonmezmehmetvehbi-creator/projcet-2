import { Reveal } from '@/components/landing/reveal'

const STATS = [
  { value: '50,000+', label: 'Questions Generated' },
  { value: '1,000+', label: 'Students' },
  { value: '50+', label: 'Verified Tutors' },
  { value: '4.9★', label: 'Average Rating' },
]

export default function StatsBar() {
  return (
    <section className="border-y border-border bg-secondary">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:py-12">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delayIndex={i} className="text-center">
            <p className="font-serif text-3xl font-semibold text-primary sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
