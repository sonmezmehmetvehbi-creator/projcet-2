'use client'

import { useEffect, useState } from 'react'

// Colorful confetti raining from the top. Relies on the `confettiFall` keyframe
// in globals.css. `intense` roughly doubles the density for a winner burst.
export default function Confetti({ count = 60, intense = false, zIndex = 5 }: { count?: number; intense?: boolean; zIndex?: number }) {
  const colors = ['#f97316', '#9333ea', '#38bdf8', '#22c55e', '#fbbf24', '#ec4899']
  const n = Math.round(intense ? count * 1.7 : count)
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex }}>
      {Array.from({ length: n }).map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * (intense ? 1.2 : 3)
        const dur = 2.5 + Math.random() * 2.8
        const size = 6 + Math.random() * 8
        const circle = i % 3 === 0
        return (
          <span key={i} style={{
            position: 'absolute', top: '-24px', left: `${left}%`,
            width: size, height: circle ? size : size * 1.7,
            background: colors[i % colors.length], borderRadius: circle ? '50%' : '2px',
            animation: `confettiFall ${dur}s linear ${delay}s infinite`,
          }} />
        )
      })}
    </div>
  )
}

// Score that counts up from 0 on mount.
export function CountUp({ value, duration = 1100 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      setN(Math.round(value * (1 - Math.pow(1 - p, 3)))) // ease-out
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{n.toLocaleString()}</>
}
