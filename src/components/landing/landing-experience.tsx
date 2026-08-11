'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { LandingHeader } from '@/components/layout/LandingHeader'
import AsciiForestHero from '@/components/landing/AsciiForestHero'
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'
import { MacbookScroll } from '@/components/ui/macbook-scroll'
import {
  DraggableCardBody,
  DraggableCardContainer,
} from '@/components/ui/draggable-card'
import CtaSection from '@/components/landing/cta-section'
import SiteFooter from '@/components/landing/site-footer'

const DRAGGABLE_CARDS = [
  {
    title: 'AI Question Generation',
    description: 'Turn any topic into questions & worksheets in seconds.',
    image: '/landing/feature-generate.png',
    scatter: 'absolute left-[6%] top-8 rotate-[-7deg]',
  },
  {
    title: 'Arena — Live Quizzes',
    description: 'Host and join fast-paced multiplayer quiz battles.',
    image: '/landing/feature-arena.png',
    scatter: 'absolute left-[38%] top-4 rotate-[5deg]',
  },
  {
    title: 'SAT Prep',
    description: 'Adaptive practice tuned to lift your SAT score.',
    image: '/landing/feature-sat.png',
    scatter: 'absolute left-[18%] top-48 rotate-[8deg]',
  },
  {
    title: 'Real Tutors',
    description: 'Book vetted human tutors for 1-on-1 help.',
    image: '/landing/feature-tutoring.png',
    scatter: 'absolute left-[54%] top-44 rotate-[-4deg]',
  },
]

export default function LandingExperience() {
  return (
    <div className="dark min-h-screen w-full bg-[#08090c] text-neutral-100">
      <LandingHeader />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <AsciiForestHero />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(74,222,128)]/30 bg-[rgb(74,222,128)]/10 px-4 py-1.5 text-sm font-medium text-[rgb(134,196,84)]">
            <Sparkles className="h-4 w-4" />
            AI-Powered Study Platform
          </span>
          <h1 className="mt-6 font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-7xl">
            Study Smarter.
            <br />
            <span className="text-[rgb(74,222,128)]">Powered by AI.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
            AceForge combines AI-generated questions, worksheets, and SAT prep
            with live multiplayer quiz competitions and real human tutors —
            everything you need to study smarter and score higher.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-transparent px-8 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3D Card ──────────────────────────────────────────────────────── */}
      <section className="px-4 py-10">
        <CardContainer className="inter-var">
          <CardBody className="group/card relative h-auto w-[min(90vw,32rem)] rounded-2xl border border-white/10 bg-black/60 p-6 shadow-2xl">
            <CardItem
              translateZ={50}
              className="font-serif text-2xl font-bold text-white"
            >
              One platform. Every tool you need.
            </CardItem>
            <CardItem
              translateZ={30}
              className="mt-2 max-w-sm text-sm text-neutral-300"
            >
              Generate, compete, and get tutored — all in one place.
            </CardItem>
            <CardItem translateZ={100} className="mt-5 w-full">
              <img
                src="/landing/hero-screenshot.png"
                alt="AceForge dashboard preview"
                className="h-60 w-full rounded-xl object-cover shadow-xl"
              />
            </CardItem>
            <div className="mt-6 flex items-center justify-between">
              <CardItem
                as={Link}
                href="/signup"
                translateZ={20}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-[rgb(134,196,84)]"
              >
                Explore AceForge →
              </CardItem>
              <CardItem
                as={Link}
                href="/signup"
                translateZ={20}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Get Started
              </CardItem>
            </div>
          </CardBody>
        </CardContainer>
      </section>

      {/* ── Macbook Scroll ───────────────────────────────────────────────── */}
      <section className="overflow-hidden bg-[#08090c]">
        <MacbookScroll
          src="/landing/hero-screenshot.png"
          title="See it in action"
          showGradient={false}
        />
      </section>

      {/* ── Draggable Cards ──────────────────────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            Explore what you can do
          </h2>
          <p className="mt-3 text-neutral-400">Drag the cards around ↔</p>
        </div>

        {/* Desktop / tablet: scattered draggable pile */}
        <DraggableCardContainer className="relative mx-auto mt-6 hidden h-[38rem] w-full max-w-5xl md:block">
          {DRAGGABLE_CARDS.map((card) => (
            <DraggableCardBody
              key={card.title}
              className={`${card.scatter} bg-neutral-900`}
            >
              <img
                src={card.image}
                alt={card.title}
                className="pointer-events-none relative z-10 h-56 w-full rounded-lg object-cover"
              />
              <h3 className="mt-4 text-center text-xl font-bold text-white">
                {card.title}
              </h3>
              <p className="mt-1 text-center text-sm text-neutral-300">
                {card.description}
              </p>
            </DraggableCardBody>
          ))}
        </DraggableCardContainer>

        {/* Mobile: simple stacked list (scatter/drag doesn't fit narrow widths) */}
        <div className="mx-auto mt-8 flex max-w-sm flex-col gap-6 md:hidden">
          {DRAGGABLE_CARDS.map((card) => (
            <div
              key={card.title}
              className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900 p-4"
            >
              <img
                src={card.image}
                alt={card.title}
                className="h-48 w-full rounded-lg object-cover"
              />
              <h3 className="mt-3 text-lg font-bold text-white">{card.title}</h3>
              <p className="mt-1 text-sm text-neutral-300">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing ──────────────────────────────────────────────────────── */}
      <section className="bg-[#08090c] px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            Everything you need to ace it
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-neutral-300">
            From your first practice question to test day, AceForge keeps you
            moving — AI that adapts to you, competitions that keep it fun, and
            real tutors when you need a human. Study smarter, not harder.
          </p>
        </div>
      </section>

      {/* ── Final CTA + Footer ───────────────────────────────────────────── */}
      <CtaSection isLoggedIn={false} />
      <SiteFooter />
    </div>
  )
}
