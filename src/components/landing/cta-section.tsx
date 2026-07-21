import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/landing/reveal'

export default function CtaSection({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section id="cta" className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center sm:px-12 lg:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  'radial-gradient(30rem 20rem at 20% 0%, #e8f0e0 0%, transparent 60%), radial-gradient(30rem 20rem at 90% 100%, #e8f0e0 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
                Ready to ace your exams?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-primary-foreground/80">
                Join thousands of students studying smarter with AceForge. Start
                completely free today.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4">
                <Link
                  href={isLoggedIn ? '/dashboard' : '/signup'}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-background px-8 text-base font-semibold text-primary transition-transform hover:-translate-y-0.5"
                >
                  {isLoggedIn ? 'Go to Dashboard' : 'Create Free Account'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/tutoring"
                  className="text-sm font-semibold text-primary-foreground/80 underline-offset-4 transition-colors hover:text-primary-foreground hover:underline"
                >
                  Or find a tutor →
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
