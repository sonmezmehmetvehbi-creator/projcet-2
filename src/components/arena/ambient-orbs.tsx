"use client"

import { useEffect, useState } from "react"

export function AmbientOrbs() {
  // Below the mobile breakpoint, render a lighter version: fewer orbs, a smaller
  // blur radius, and no drift animation. Animating large blurred layers is a
  // known repaint hotspot that janks on lower-end phones.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const blur = isMobile ? "blur-[60px]" : "blur-[120px]"

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* purple */}
      <div className={`${isMobile ? "" : "animate-orb-a"} absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-brand/35 ${blur}`} />
      {/* orange */}
      <div className={`${isMobile ? "" : "animate-orb-b"} absolute -top-16 right-[-6rem] h-[22rem] w-[22rem] rounded-full bg-ember/25 ${blur}`} />
      {/* baby blue — desktop only (third animated orb is the heaviest to omit) */}
      {!isMobile && (
        <div className="animate-orb-c absolute top-40 left-1/3 h-[20rem] w-[20rem] rounded-full bg-sky/20 blur-[120px]" />
      )}

      <div className="absolute inset-0 grid-veil" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-arena-bg" />
    </div>
  )
}
