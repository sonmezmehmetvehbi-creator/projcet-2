"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * "The Power Behind AceForge" — a scroll-driven scrollytelling sequence that
 * sits between the hero and the Features section. On desktop (with motion
 * allowed) it pins and scrubs a 6-scene story through a central evolving
 * visual. On mobile or with prefers-reduced-motion it degrades to a simple
 * stacked set of fade/slide-in scenes (no pin, no scrub).
 *
 * All visuals are pure SVG/CSS — no image or video assets.
 */

type Palette = "green" | "purple" | "amber"

const SCENES = [
  {
    id: "ai",
    eyebrow: "The power behind AceForge",
    title: "Powered by AI.",
    copy: "AceForge fuses genuine AI with the study tools you actually use — so every question, quiz, and lesson is built around you.",
    palette: "green" as Palette,
  },
  {
    id: "generation",
    eyebrow: "AI Generation",
    title: "Generate Anything, Instantly",
    copy: "Questions, worksheets, flashcards, and full SAT sets — generated on demand for any subject, grade, and difficulty.",
    palette: "green" as Palette,
  },
  {
    id: "arena",
    eyebrow: "Arena",
    title: "Compete. Challenge. Win.",
    copy: "Go live with friends, host quiz rooms, and climb the leaderboard. Studying, turned into a game worth showing up for.",
    palette: "purple" as Palette,
  },
  {
    id: "sat",
    eyebrow: "SAT Prep",
    title: "Score Higher, Faster",
    copy: "AI-tuned practice that matches real exam difficulty, targets your weak spots, and tracks every point of improvement.",
    palette: "amber" as Palette,
  },
  {
    id: "tutoring",
    eyebrow: "Tutoring",
    title: "Real Tutors, When You Need Them",
    copy: "When AI isn't enough, book a verified human tutor from the marketplace and get 1-on-1 help the moment it matters.",
    palette: "green" as Palette,
  },
  {
    id: "converge",
    eyebrow: "One platform",
    title: "It All Works Together",
    copy: "Generation, Arena, SAT Prep, and Tutoring — one connected platform built to move your grades forward.",
    palette: "green" as Palette,
  },
]

const PALETTES: Record<Palette, { core: string; glow: string; ring: string; soft: string; text: string }> = {
  green: { core: "rgb(134,196,84)", glow: "rgba(122,182,72,0.55)", ring: "rgba(122,182,72,0.35)", soft: "rgba(122,182,72,0.12)", text: "rgb(190,224,160)" },
  purple: { core: "rgb(167,139,250)", glow: "rgba(139,92,246,0.6)", ring: "rgba(139,92,246,0.4)", soft: "rgba(139,92,246,0.14)", text: "rgb(206,190,253)" },
  amber: { core: "rgb(245,190,90)", glow: "rgba(232,160,32,0.55)", ring: "rgba(232,160,32,0.38)", soft: "rgba(232,160,32,0.12)", text: "rgb(247,214,150)" },
}

export default function PowerSequence({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([])
  // "full" = pinned scrub scrollytelling; "simple" = stacked fade-in scenes.
  // Start in "simple" so SSR / no-JS shows real, readable content.
  const [mode, setMode] = useState<"full" | "simple">("simple")
  // Only true once the JS scroll-reveal is wired up — gates the hidden
  // pre-state so no-JS / reduced-motion users always see the content.
  const [jsReveal, setJsReveal] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches
    const useFull = isDesktop && !reduce
    setMode(useFull ? "full" : "simple")

    if (!useFull) {
      // Simple mode: light-weight one-shot reveals as each scene scrolls in.
      // Skip entirely under reduced-motion (content is already visible).
      if (reduce) return
      setJsReveal(true)
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("ps-revealed")
              observer.unobserve(e.target)
            }
          })
        },
        { threshold: 0.2 },
      )
      sceneRefs.current.forEach((s) => s && observer.observe(s))
      return () => observer.disconnect()
    }

    // Full mode: pin the stage and scrub the story with GSAP ScrollTrigger.
    gsap.registerPlugin(ScrollTrigger)
    const scenes = sceneRefs.current.filter(Boolean) as HTMLDivElement[]

    const ctx = gsap.context(() => {
      // Initial state: only scene 1 visible.
      scenes.forEach((s, i) => gsap.set(s, { autoAlpha: i === 0 ? 1 : 0, scale: i === 0 ? 1 : 1.06 }))

      // Intro for scene 1 (one-shot on mount, not scrubbed).
      gsap.from(scenes[0].querySelectorAll("[data-anim]"), {
        y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.1, ease: "power3.out", delay: 0.15,
      })

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * (scenes.length * 0.85),
          pin: stageRef.current,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      for (let i = 1; i < scenes.length; i++) {
        tl.to(scenes[i - 1], { autoAlpha: 0, scale: 0.9, duration: 0.4 }, "+=0.55")
          .fromTo(
            scenes[i],
            { autoAlpha: 0, scale: 1.06 },
            { autoAlpha: 1, scale: 1, duration: 0.4 },
            "<",
          )
          .fromTo(
            scenes[i].querySelectorAll("[data-anim]"),
            { y: 22, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.35 },
            "<0.12",
          )
      }
      // Hold the final scene (with its CTA) before the pin releases.
      tl.to({}, { duration: 0.7 })
    }, rootRef)

    return () => ctx.revert()
  }, [])

  const isFull = mode === "full"

  return (
    <section
      ref={rootRef}
      id="power"
      className={`ps-root ${isFull ? "ps-full" : "ps-simple"}${jsReveal ? " ps-js" : ""}`}
      aria-label="The power behind AceForge"
    >
      <div ref={stageRef} className="ps-stage">
        {SCENES.map((scene, i) => (
          <div
            key={scene.id}
            ref={(el) => { sceneRefs.current[i] = el }}
            className="ps-scene"
            data-scene={scene.id}
          >
            <div className="ps-scene-inner">
              <div className="ps-visual" aria-hidden="true">
                <SceneVisual id={scene.id} palette={scene.palette} />
              </div>
              <div className="ps-text">
                <p className="ps-eyebrow" data-anim style={{ color: PALETTES[scene.palette].text }}>
                  {scene.eyebrow}
                </p>
                <h2 className="ps-title" data-anim>{scene.title}</h2>
                <p className="ps-copy" data-anim>{scene.copy}</p>

                {scene.id === "converge" && (
                  <div className="ps-cta" data-anim>
                    {isLoggedIn ? (
                      <Link href="/dashboard" className="ps-btn-primary">
                        Go to Dashboard <span aria-hidden>→</span>
                      </Link>
                    ) : (
                      <>
                        <Link href="/signup" className="ps-btn-primary">
                          Get Started Free <span aria-hidden>→</span>
                        </Link>
                        <Link href="/login" className="ps-btn-secondary">
                          Already have an account? Sign in
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <PowerStyles />
    </section>
  )
}

/* ─────────────────────────── Visuals (SVG/CSS only) ─────────────────────── */

function SceneVisual({ id, palette }: { id: string; palette: Palette }) {
  switch (id) {
    case "ai":
      return <NeuralCore palette={palette} />
    case "generation":
      return (
        <OrbitSystem
          palette={palette}
          centerEmoji="🧠"
          centerLabel="AI Core"
          nodes={[
            { emoji: "❓", label: "Questions" },
            { emoji: "📝", label: "Worksheets" },
            { emoji: "🃏", label: "Flashcards" },
            { emoji: "🎯", label: "SAT Sets" },
          ]}
        />
      )
    case "arena":
      return (
        <OrbitSystem
          palette={palette}
          centerEmoji="⚔️"
          centerLabel="Live Quiz"
          energetic
          nodes={[
            { emoji: "🦊", label: "P1" },
            { emoji: "🐯", label: "P2" },
            { emoji: "🦁", label: "P3" },
            { emoji: "🐉", label: "P4" },
            { emoji: "🚀", label: "P5" },
          ]}
        />
      )
    case "sat":
      return <SatGoal palette={palette} />
    case "tutoring":
      return <TutorLink palette={palette} />
    case "converge":
      return <ConvergeVisual />
    default:
      return null
  }
}

function NeuralCore({ palette }: { palette: Palette }) {
  const p = PALETTES[palette]
  // Fixed node layout for a brain-ish network.
  const nodes = [
    [110, 60], [190, 50], [250, 110], [60, 120], [150, 120],
    [230, 175], [90, 200], [165, 210], [255, 235], [130, 265],
  ]
  const links: [number, number][] = [
    [0, 1], [0, 3], [0, 4], [1, 2], [1, 4], [2, 5], [3, 4],
    [3, 6], [4, 5], [4, 7], [5, 8], [6, 7], [7, 9], [7, 8], [8, 9], [6, 9],
  ]
  return (
    <svg viewBox="0 0 320 320" className="ps-neural" role="img">
      <defs>
        <radialGradient id={`ncore-${palette}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={p.core} stopOpacity="0.9" />
          <stop offset="100%" stopColor={p.core} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="160" r="150" fill={`url(#ncore-${palette})`} opacity="0.25" />
      {links.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={p.ring} strokeWidth="1.4"
          className="ps-neural-link"
          style={{ animationDelay: `${(i % 6) * 0.35}s` }}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle
          key={i} cx={x} cy={y} r={i % 3 === 0 ? 6 : 4}
          fill={p.core} className="ps-neural-node"
          style={{ animationDelay: `${(i % 5) * 0.4}s`, filter: `drop-shadow(0 0 6px ${p.glow})` }}
        />
      ))}
    </svg>
  )
}

function OrbitSystem({
  palette, centerEmoji, centerLabel, nodes, energetic = false,
}: {
  palette: Palette
  centerEmoji: string
  centerLabel: string
  nodes: { emoji: string; label: string }[]
  energetic?: boolean
}) {
  const p = PALETTES[palette]
  return (
    <div className={`ps-orbit ${energetic ? "ps-orbit-fast" : ""}`} style={{ ["--pcore" as any]: p.core, ["--pglow" as any]: p.glow, ["--pring" as any]: p.ring, ["--psoft" as any]: p.soft }}>
      <div className="ps-orbit-halo" />
      <div className="ps-orbit-ring ps-orbit-ring-1" />
      <div className="ps-orbit-ring ps-orbit-ring-2" />
      <div className="ps-orbit-center">
        <span className="ps-orbit-center-emoji">{centerEmoji}</span>
        <span className="ps-orbit-center-label" style={{ color: p.text }}>{centerLabel}</span>
      </div>
      <div className="ps-orbit-spinner">
        {nodes.map((n, i) => {
          const angle = (360 / nodes.length) * i
          return (
            <div
              key={i}
              className="ps-orbit-node"
              style={{ transform: `rotate(${angle}deg) translateX(var(--orbit-r)) rotate(-${angle}deg)` }}
            >
              <div className="ps-orbit-node-inner">
                <span className="ps-orbit-node-emoji">{n.emoji}</span>
                <span className="ps-orbit-node-label" style={{ color: p.text }}>{n.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SatGoal({ palette }: { palette: Palette }) {
  const p = PALETTES[palette]
  const bars = [38, 52, 46, 68, 61, 82, 96]
  const R = 92
  const C = 2 * Math.PI * R
  return (
    <div className="ps-sat" style={{ ["--pcore" as any]: p.core, ["--pglow" as any]: p.glow, ["--psoft" as any]: p.soft }}>
      <svg viewBox="0 0 240 240" className="ps-sat-ring" role="img">
        <circle cx="120" cy="120" r={R} fill="none" stroke={p.soft} strokeWidth="12" />
        <circle
          cx="120" cy="120" r={R} fill="none" stroke={p.core} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C}
          className="ps-sat-progress"
          style={{ ["--dash" as any]: C, transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
        <text x="120" y="112" textAnchor="middle" className="ps-sat-score" fill={p.core}>+210</text>
        <text x="120" y="140" textAnchor="middle" className="ps-sat-score-sub" fill={p.text}>avg. score gain</text>
      </svg>
      <div className="ps-sat-bars" aria-hidden="true">
        {bars.map((h, i) => (
          <span key={i} className="ps-sat-bar" style={{ ["--h" as any]: `${h}%`, animationDelay: `${i * 0.1}s`, background: p.core }} />
        ))}
      </div>
      <div className="ps-sat-symbols" aria-hidden="true">
        {["∑", "π", "√", "×"].map((s, i) => (
          <span key={i} className="ps-sat-symbol" style={{ color: p.text, animationDelay: `${i * 0.5}s` }}>{s}</span>
        ))}
      </div>
    </div>
  )
}

function TutorLink({ palette }: { palette: Palette }) {
  const p = PALETTES[palette]
  return (
    <div className="ps-tutor" style={{ ["--pcore" as any]: p.core, ["--pglow" as any]: p.glow, ["--psoft" as any]: p.soft }}>
      <div className="ps-tutor-figure ps-tutor-student">
        <span className="ps-tutor-emoji">🧑‍🎓</span>
        <span className="ps-tutor-label" style={{ color: p.text }}>Student</span>
      </div>
      <svg viewBox="0 0 220 80" className="ps-tutor-link" role="img" aria-hidden="true">
        <line x1="14" y1="40" x2="206" y2="40" stroke={p.ring} strokeWidth="2" />
        <line x1="14" y1="40" x2="206" y2="40" stroke={p.core} strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="10 14" className="ps-tutor-signal" />
        <circle cx="110" cy="40" r="7" fill={p.core} className="ps-tutor-pulse" style={{ filter: `drop-shadow(0 0 8px ${p.glow})` }} />
      </svg>
      <div className="ps-tutor-figure ps-tutor-teacher">
        <span className="ps-tutor-emoji">🧑‍🏫</span>
        <span className="ps-tutor-label" style={{ color: p.text }}>Tutor</span>
      </div>
    </div>
  )
}

function ConvergeVisual() {
  // Four pillar satellites pull inward toward the central AI core.
  const pillars = [
    { emoji: "🧠", color: PALETTES.green.core, angle: 0 },
    { emoji: "⚔️", color: PALETTES.purple.core, angle: 90 },
    { emoji: "🎯", color: PALETTES.amber.core, angle: 180 },
    { emoji: "🧑‍🏫", color: PALETTES.green.core, angle: 270 },
  ]
  return (
    <div className="ps-converge">
      <div className="ps-converge-core">
        <span>✦</span>
      </div>
      {pillars.map((p, i) => (
        <div
          key={i}
          className="ps-converge-pillar"
          style={{
            ["--angle" as any]: `${p.angle}deg`,
            ["--pc" as any]: p.color,
            animationDelay: `${i * 0.15}s`,
          }}
        >
          <span>{p.emoji}</span>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────── Styles ─────────────────────────────────── */

function PowerStyles() {
  return (
    <style>{`
      .ps-root {
        position: relative;
        background:
          radial-gradient(1200px 600px at 50% -10%, rgba(122,182,72,0.10), transparent 60%),
          linear-gradient(180deg, rgb(9,11,9) 0%, rgb(12,14,11) 55%, rgb(9,11,9) 100%);
        color: rgb(236,240,230);
        overflow: hidden;
      }
      .ps-root::before, .ps-root::after {
        content: ""; position: absolute; left: 0; right: 0; height: 90px; pointer-events: none; z-index: 3;
      }
      .ps-root::before { top: 0; background: linear-gradient(180deg, rgba(248,250,245,0.9), transparent); }
      .ps-root::after { bottom: 0; background: linear-gradient(0deg, rgba(248,250,245,0.9), transparent); }

      /* ── Full (pinned) mode ── */
      .ps-full { height: 100vh; }
      .ps-full .ps-stage {
        position: relative; height: 100vh; width: 100%;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden;
      }
      .ps-full .ps-scene {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        padding: 6rem 1.5rem 4rem;
      }

      /* ── Simple (stacked) mode ── */
      .ps-simple .ps-stage { display: block; }
      .ps-simple .ps-scene {
        min-height: 88vh;
        display: flex; align-items: center; justify-content: center;
        padding: 4.5rem 1.25rem;
        opacity: 1;
      }
      /* Reveal-on-scroll (motion allowed). Reduced-motion users never get the
         .ps-hidden pre-state because JS skips the observer, so content shows. */
      .ps-simple.ps-js .ps-scene { opacity: 0; transform: translateY(28px); }
      .ps-simple .ps-scene.ps-revealed {
        opacity: 1; transform: none;
        transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1);
      }

      .ps-scene-inner {
        display: flex; flex-direction: column; align-items: center; text-align: center;
        gap: 2rem; max-width: 46rem; width: 100%;
      }
      .ps-visual {
        width: min(360px, 82vw); height: min(360px, 82vw);
        display: flex; align-items: center; justify-content: center;
        position: relative; flex-shrink: 0;
      }
      .ps-eyebrow {
        font-family: 'Syne','DM Sans',sans-serif; text-transform: uppercase;
        letter-spacing: 0.18em; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.9rem;
      }
      .ps-title {
        font-family: 'Fraunces', Georgia, serif; font-weight: 700; line-height: 1.02;
        font-size: clamp(2.1rem, 5.4vw, 3.6rem); color: rgb(244,247,238);
        letter-spacing: -0.02em; margin: 0 0 1rem;
      }
      .ps-copy {
        color: rgb(176,186,166); font-size: clamp(1rem, 1.4vw, 1.15rem);
        line-height: 1.6; max-width: 34rem; margin: 0 auto;
      }

      /* ── CTA (scene 6) ── */
      .ps-cta { margin-top: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
      .ps-btn-primary {
        display: inline-flex; align-items: center; gap: 0.6rem;
        background: linear-gradient(90deg, rgb(74,122,40), rgb(122,182,72));
        color: white; font-weight: 700; font-size: 1.0625rem;
        border-radius: 9999px; padding: 0.95rem 2.1rem; text-decoration: none;
        box-shadow: 0 10px 40px rgba(122,182,72,0.35); transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .ps-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 48px rgba(122,182,72,0.5); }
      .ps-btn-secondary {
        color: rgb(190,200,180); font-weight: 600; font-size: 0.95rem;
        text-decoration: none; border-bottom: 1px solid rgba(190,200,180,0.35); padding-bottom: 1px;
        transition: color 0.2s ease, border-color 0.2s ease;
      }
      .ps-btn-secondary:hover { color: white; border-color: white; }

      /* ── Neural network ── */
      .ps-neural { width: 100%; height: 100%; }
      .ps-neural-node { animation: psNodePulse 2.8s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
      .ps-neural-link { stroke-dasharray: 6 8; animation: psDashFlow 3s linear infinite; opacity: 0.75; }
      @keyframes psNodePulse { 0%,100% { opacity: 0.55; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.15); } }
      @keyframes psDashFlow { to { stroke-dashoffset: -28; } }

      /* ── Orbit system ── */
      .ps-orbit { position: relative; width: 100%; height: 100%; --orbit-r: 42%; }
      .ps-orbit-halo {
        position: absolute; inset: 12%; border-radius: 50%;
        background: radial-gradient(circle, var(--psoft), transparent 70%);
        animation: psBreathe 4s ease-in-out infinite;
      }
      .ps-orbit-ring { position: absolute; inset: 8%; border-radius: 50%; border: 1px solid var(--pring); }
      .ps-orbit-ring-2 { inset: 22%; border-style: dashed; opacity: 0.6; animation: psSpin 26s linear infinite reverse; }
      .ps-orbit-center {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
        width: 33%; height: 33%; border-radius: 50%;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
        background: radial-gradient(circle at 50% 40%, var(--pcore), rgba(0,0,0,0.2));
        box-shadow: 0 0 40px var(--pglow), inset 0 0 20px rgba(255,255,255,0.15);
        z-index: 2;
      }
      .ps-orbit-center-emoji { font-size: clamp(1.4rem, 4vw, 2rem); line-height: 1; }
      .ps-orbit-center-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
      .ps-orbit-spinner { position: absolute; inset: 0; animation: psSpin 22s linear infinite; }
      .ps-orbit-fast .ps-orbit-spinner { animation-duration: 12s; }
      .ps-orbit-node { position: absolute; top: 50%; left: 50%; margin: -26px 0 0 -26px; width: 52px; height: 52px; }
      .ps-orbit-node-inner {
        width: 52px; height: 52px; border-radius: 50%;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
        background: rgba(255,255,255,0.05); border: 1px solid var(--pring);
        box-shadow: 0 0 18px var(--pglow); backdrop-filter: blur(2px);
        animation: psSpin 22s linear infinite reverse;
      }
      .ps-orbit-fast .ps-orbit-node-inner { animation-duration: 12s; }
      .ps-orbit-node-emoji { font-size: 1.25rem; line-height: 1; }
      .ps-orbit-node-label { font-size: 0.55rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }

      /* ── SAT goal ── */
      .ps-sat { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
      .ps-sat-ring { width: 84%; height: 84%; }
      .ps-sat-progress { animation: psRingFill 2.4s ease-out forwards; }
      @keyframes psRingFill { to { stroke-dashoffset: calc(var(--dash) * 0.12); } }
      .ps-sat-score { font-family: 'Fraunces', serif; font-weight: 700; font-size: 2rem; }
      .ps-sat-score-sub { font-family: 'DM Sans', sans-serif; font-size: 0.72rem; letter-spacing: 0.05em; }
      .ps-sat-bars { position: absolute; bottom: 8%; left: 50%; transform: translateX(-50%); display: flex; align-items: flex-end; gap: 5px; height: 28%; }
      .ps-sat-bar { width: 9px; height: var(--h); border-radius: 3px; opacity: 0.9; transform-origin: bottom; animation: psBarGrow 1.4s cubic-bezier(0.16,1,0.3,1) both; }
      @keyframes psBarGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      .ps-sat-symbols { position: absolute; inset: 0; pointer-events: none; }
      .ps-sat-symbol { position: absolute; font-size: 1.3rem; font-weight: 700; opacity: 0.85; animation: psFloat 5s ease-in-out infinite; }
      .ps-sat-symbol:nth-child(1) { top: 6%; left: 18%; }
      .ps-sat-symbol:nth-child(2) { top: 14%; right: 14%; }
      .ps-sat-symbol:nth-child(3) { bottom: 30%; left: 8%; }
      .ps-sat-symbol:nth-child(4) { bottom: 20%; right: 10%; }

      /* ── Tutor link ── */
      .ps-tutor { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; }
      .ps-tutor-figure {
        display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
        width: 84px; height: 84px; border-radius: 50%; flex-shrink: 0;
        justify-content: center; position: relative;
        background: radial-gradient(circle at 50% 40%, var(--psoft), transparent 70%);
        border: 1px solid var(--pcore);
        box-shadow: 0 0 26px var(--pglow);
        animation: psBreathe 3.4s ease-in-out infinite;
      }
      .ps-tutor-teacher { animation-delay: 1.7s; }
      .ps-tutor-emoji { font-size: 2rem; line-height: 1; }
      .ps-tutor-label { position: absolute; bottom: -1.6rem; font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
      .ps-tutor-link { width: 44%; height: 70px; }
      .ps-tutor-signal { stroke-dasharray: 10 14; animation: psDashFlow2 1.6s linear infinite; }
      @keyframes psDashFlow2 { to { stroke-dashoffset: -48; } }
      .ps-tutor-pulse { animation: psNodePulse 1.8s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }

      /* ── Converge ── */
      .ps-converge { position: relative; width: 100%; height: 100%; }
      .ps-converge-core {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
        width: 30%; height: 30%; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        font-size: clamp(1.4rem, 4vw, 2.2rem); color: white;
        background: radial-gradient(circle at 50% 40%, rgb(134,196,84), rgba(0,0,0,0.25));
        box-shadow: 0 0 60px rgba(122,182,72,0.6), inset 0 0 24px rgba(255,255,255,0.2);
        animation: psCorePulse 2.6s ease-in-out infinite; z-index: 2;
      }
      .ps-converge-pillar {
        position: absolute; top: 50%; left: 50%;
        width: 54px; height: 54px; margin: -27px 0 0 -27px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
        background: rgba(255,255,255,0.06); border: 1px solid var(--pc);
        box-shadow: 0 0 20px var(--pc);
        transform: rotate(var(--angle)) translateX(120px) rotate(calc(-1 * var(--angle)));
        animation: psConverge 3.4s ease-in-out infinite;
      }
      @keyframes psConverge {
        0%, 100% { transform: rotate(var(--angle)) translateX(120px) rotate(calc(-1 * var(--angle))); opacity: 0.9; }
        50% { transform: rotate(var(--angle)) translateX(46px) rotate(calc(-1 * var(--angle))); opacity: 1; }
      }
      @keyframes psCorePulse { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.12); } }

      /* ── Shared keyframes ── */
      @keyframes psSpin { to { transform: rotate(360deg); } }
      @keyframes psBreathe { 0%,100% { transform: scale(0.94); opacity: 0.7; } 50% { transform: scale(1.06); opacity: 1; } }
      @keyframes psFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

      @media (prefers-reduced-motion: reduce) {
        .ps-neural-node, .ps-neural-link, .ps-orbit-spinner, .ps-orbit-node-inner,
        .ps-orbit-ring-2, .ps-orbit-halo, .ps-sat-progress, .ps-sat-bar, .ps-sat-symbol,
        .ps-tutor-figure, .ps-tutor-signal, .ps-tutor-pulse, .ps-converge-core, .ps-converge-pillar {
          animation: none !important;
        }
        .ps-converge-pillar { transform: rotate(var(--angle)) translateX(72px) rotate(calc(-1 * var(--angle))); }
        .ps-sat-progress { stroke-dashoffset: calc(var(--dash) * 0.12); }
        .ps-sat-bar { transform: scaleY(1); }
      }
    `}</style>
  )
}
