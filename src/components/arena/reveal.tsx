"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

type RevealProps = {
  children: ReactNode
  delay?: number
  className?: string
  /** animate when scrolled into view instead of on mount */
  onScroll?: boolean
}

export function Reveal({ children, delay = 0, className, onScroll = false }: RevealProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) return <div className={className}>{children}</div>

  const animation = {
    initial: { opacity: 0, y: 24 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  }

  if (onScroll) {
    return (
      <motion.div
        className={className}
        initial={animation.initial}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={animation.transition}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={className}
      initial={animation.initial}
      animate={{ opacity: 1, y: 0 }}
      transition={animation.transition}
    >
      {children}
    </motion.div>
  )
}
