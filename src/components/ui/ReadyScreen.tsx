'use client'

import { useRef } from 'react'

// Shown for ~2.5s after a generation completes, before navigating to the result.
export default function ReadyScreen({ subject, topic, outputType }: { subject: string; topic: string; outputType: string }) {
  const particles = useRef(
    Array.from({ length: 10 }, () => ({
      left: Math.random() * 100,
      size: 5 + Math.random() * 9,
      delay: Math.random() * 2.2,
      dur: 3 + Math.random() * 2,
    }))
  ).current
  const kind = outputType === 'worksheet' ? 'worksheet' : 'questions'

  return (
    <div className="ready-glow" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgb(240,247,234), rgb(228,242,218), rgb(240,247,234))' }}>
      {/* Floating particles */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {particles.map((p, i) => (
          <span key={i} style={{ position: 'absolute', bottom: '-24px', left: `${p.left}%`, width: `${p.size}px`, height: `${p.size}px`, borderRadius: '50%', background: 'rgb(34,85,14)', opacity: 0.35, animation: `readyFloatUp ${p.dur}s ease-in ${p.delay}s infinite` }} />
        ))}
      </div>

      <div className="ready-enter" style={{ textAlign: 'center', maxWidth: '32rem', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Animated checkmark */}
        <div style={{ width: '96px', height: '96px', margin: '0 auto 1.75rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,85,14,0.12), rgba(34,85,14,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 52 52" style={{ width: '80px', height: '80px' }}>
            <circle cx="26" cy="26" r="24" fill="none" stroke="rgb(34,85,14)" strokeWidth="3" opacity="0.25" />
            <path className="ready-check" fill="none" stroke="rgb(34,85,14)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" d="M14 27 L23 36 L39 18" />
          </svg>
        </div>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'rgb(26,26,20)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
          Your {topic || subject} {kind} is ready!
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgb(107,107,88)', marginBottom: '1.75rem' }}>
          Redirecting you now<span className="ready-dots"><span>.</span><span>.</span><span>.</span></span>
        </p>

        <div style={{ width: '100%', maxWidth: '22rem', margin: '0 auto', height: '8px', background: 'rgba(34,85,14,0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '9999px', background: 'linear-gradient(90deg, rgb(34,85,14), rgb(74,122,40))', animation: 'readyBar 2.5s linear forwards' }} />
        </div>
      </div>

      <style>{`
        @keyframes drawCheck { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
        .ready-check { stroke-dasharray: 100; stroke-dashoffset: 100; animation: drawCheck 0.6s cubic-bezier(0.65,0,0.45,1) 0.25s forwards; }
        @keyframes readyEnter { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        .ready-enter { animation: readyEnter 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes readyFloatUp { 0% { opacity: 0; transform: translateY(0) scale(0.5); } 50% { opacity: 0.5; } 100% { opacity: 0; transform: translateY(-100vh) scale(1); } }
        @keyframes readyBar { from { width: 0%; } to { width: 100%; } }
        @keyframes readyGlow { 0%,100% { box-shadow: inset 0 0 120px rgba(34,85,14,0.05); } 50% { box-shadow: inset 0 0 160px rgba(34,85,14,0.12); } }
        .ready-glow { animation: readyGlow 2.5s ease-in-out infinite; }
        .ready-dots span { animation: readyDot 1.4s infinite; opacity: 0; }
        .ready-dots span:nth-child(2) { animation-delay: 0.2s; }
        .ready-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes readyDot { 0%,100% { opacity: 0; } 50% { opacity: 1; } }
      `}</style>
    </div>
  )
}
