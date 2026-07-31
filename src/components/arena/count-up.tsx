"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "framer-motion"

type CountUpProps = {
  value: number
  duration?: number
  suffix?: string
  className?: string
}

export function CountUp({ value, duration = 1.4, suffix = "", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  // only trim the bottom edge — a horizontal inset can exclude elements near the page gutters
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" })
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      setDisplay(value)
      return
    }

    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1)
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setDisplay(Math.round(eased * value))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value, duration, reduceMotion])

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}
