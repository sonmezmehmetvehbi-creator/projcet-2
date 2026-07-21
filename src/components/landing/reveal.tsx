"use client"

import { motion, type Variants } from "framer-motion"
import type { ReactNode } from "react"

const variants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      delay: i * 0.08,
    },
  }),
}

export function Reveal({
  children,
  className,
  delayIndex = 0,
  as = "div",
}: {
  children: ReactNode
  className?: string
  delayIndex?: number
  as?: "div" | "section" | "li" | "span"
}) {
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      variants={variants}
      custom={delayIndex}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </MotionTag>
  )
}
