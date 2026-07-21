"use client"

import { useEffect, useRef, useState } from "react"

export function Typewriter({
  phrases,
  className,
}: {
  phrases: string[]
  className?: string
}) {
  const [text, setText] = useState("")
  const idx = useRef(0)
  const char = useRef(0)
  const deleting = useRef(false)

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(phrases[0] ?? "")
      return
    }

    let timeout: ReturnType<typeof setTimeout>

    const tick = () => {
      const current = phrases[idx.current]
      if (!deleting.current) {
        char.current += 1
        setText(current.slice(0, char.current))
        if (char.current === current.length) {
          deleting.current = true
          timeout = setTimeout(tick, 1600)
          return
        }
        timeout = setTimeout(tick, 70)
      } else {
        char.current -= 1
        setText(current.slice(0, char.current))
        if (char.current === 0) {
          deleting.current = false
          idx.current = (idx.current + 1) % phrases.length
          timeout = setTimeout(tick, 400)
          return
        }
        timeout = setTimeout(tick, 38)
      }
    }

    timeout = setTimeout(tick, 400)
    return () => clearTimeout(timeout)
  }, [phrases])

  return (
    <span className={className} aria-live="polite">
      {text}
      <span className="caret bg-current" aria-hidden="true">
        &nbsp;
      </span>
    </span>
  )
}
