"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion"
import { Trophy, Sparkles, Zap } from "lucide-react"

export function FloatingTrophy() {
  const reduceMotion = useReducedMotion()

  // Cursor-parallax is a mouse-only affordance. On touch devices there is no
  // hover cursor, so we never attach the listener nor apply the tilt transform —
  // the trophy just keeps its gentle bob loop with no stuck/leftover transform.
  const [hasFinePointer, setHasFinePointer] = useState(false)
  useEffect(() => {
    setHasFinePointer(window.matchMedia("(pointer: fine)").matches)
  }, [])

  const tiltEnabled = hasFinePointer && !reduceMotion

  // normalized cursor position (-0.5 .. 0.5)
  const px = useMotionValue(0)
  const py = useMotionValue(0)

  const sx = useSpring(px, { stiffness: 90, damping: 18, mass: 0.6 })
  const sy = useSpring(py, { stiffness: 90, damping: 18, mass: 0.6 })

  const rotateY = useTransform(sx, [-0.5, 0.5], [12, -12])
  const rotateX = useTransform(sy, [-0.5, 0.5], [-10, 10])
  const shiftX = useTransform(sx, [-0.5, 0.5], [14, -14])
  const shiftY = useTransform(sy, [-0.5, 0.5], [10, -10])

  useEffect(() => {
    if (!tiltEnabled) return

    function onMove(e: MouseEvent) {
      px.set(e.clientX / window.innerWidth - 0.5)
      py.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [px, py, tiltEnabled])

  return (
    <div className="relative flex items-center justify-center [perspective:1000px]">
      <motion.div
        style={tiltEnabled ? { rotateX, rotateY, x: shiftX, y: shiftY } : undefined}
        className="relative"
      >
        <motion.div
          animate={reduceMotion ? undefined : { y: [-8, 8, -8] }}
          transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="relative"
        >
          {/* halo */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 scale-125 rounded-[2.5rem] bg-brand/30 blur-3xl"
          />

          {/* card stack behind */}
          <div
            aria-hidden
            className="absolute -bottom-4 left-1/2 h-24 w-40 -translate-x-1/2 rotate-6 rounded-2xl border border-arena-border bg-surface/70 backdrop-blur-sm sm:w-48"
          />
          <div
            aria-hidden
            className="absolute -bottom-2 left-1/2 h-24 w-40 -translate-x-1/2 -rotate-3 rounded-2xl border border-arena-border bg-surface/85 backdrop-blur-sm sm:w-48"
          />

          {/* main plate */}
          <div className="relative flex h-40 w-40 items-center justify-center rounded-[2rem] border border-brand/30 bg-gradient-to-br from-surface to-arena-bg shadow-2xl shadow-brand/25 sm:h-48 sm:w-48">
            <div className="absolute inset-px rounded-[calc(2rem-1px)] bg-gradient-to-br from-brand/15 via-transparent to-ember/10" />
            <Trophy className="relative h-16 w-16 text-ember drop-shadow-[0_0_18px_oklch(0.73_0.18_55/0.55)] sm:h-20 sm:w-20" />
          </div>

          {/* floating sparks */}
          <motion.div
            aria-hidden
            animate={reduceMotion ? undefined : { y: [0, -10, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute -top-5 -right-5 rounded-xl border border-sky/30 bg-surface/90 p-2 shadow-lg shadow-sky/20 backdrop-blur"
          >
            <Sparkles className="h-4 w-4 text-sky" />
          </motion.div>
          <motion.div
            aria-hidden
            animate={reduceMotion ? undefined : { y: [0, 10, 0], rotate: [0, -8, 0] }}
            transition={{ duration: 4.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.4 }}
            className="absolute -bottom-2 -left-6 rounded-xl border border-brand/40 bg-surface/90 p-2 shadow-lg shadow-brand/25 backdrop-blur"
          >
            <Zap className="h-4 w-4 text-brand-foreground" />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
