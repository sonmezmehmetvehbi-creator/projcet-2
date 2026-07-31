"use client"

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react"

const LENGTH = 6

type GameCodeInputProps = {
  onComplete?: (code: string) => void
  onChange?: (code: string) => void
  autoFocus?: boolean
}

export function GameCodeInput({ onComplete, onChange, autoFocus = false }: GameCodeInputProps) {
  const [chars, setChars] = useState<string[]>(Array(LENGTH).fill(""))
  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  function commit(next: string[]) {
    setChars(next)
    const code = next.join("")
    onChange?.(code)
    if (code.length === LENGTH && !next.includes("")) onComplete?.(code)
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    if (!cleaned) {
      const next = [...chars]
      next[index] = ""
      commit(next)
      return
    }

    const next = [...chars]
    // support typing/pasting multiple characters at once
    for (let i = 0; i < cleaned.length && index + i < LENGTH; i++) {
      next[index + i] = cleaned[i]
    }
    commit(next)

    const focusTarget = Math.min(index + cleaned.length, LENGTH - 1)
    refs.current[focusTarget]?.focus()
    refs.current[focusTarget]?.select()
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault()
      const next = [...chars]
      if (next[index]) {
        next[index] = ""
        commit(next)
      } else if (index > 0) {
        next[index - 1] = ""
        commit(next)
        refs.current[index - 1]?.focus()
      }
      return
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      refs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < LENGTH - 1) {
      e.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  function handlePaste(index: number, e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    handleChange(index, e.clipboardData.getData("text"))
  }

  // Keep the focused box visible once the mobile keyboard slides up and reclaims
  // the lower half of the viewport. Deferred so it runs after the keyboard opens.
  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.select()
    const el = e.currentTarget
    setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300)
  }

  return (
    <div className="flex w-full items-center justify-center gap-1.5 sm:gap-2" role="group" aria-label="6 character game code">
      {chars.map((char, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={char}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={handleFocus}
          // Game codes are alphanumeric (letters + digits), so a numeric/tel
          // keyboard would be wrong — keep the text keyboard but hint uppercase.
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="one-time-code"
          maxLength={LENGTH}
          aria-label={`Character ${i + 1} of ${LENGTH}`}
          className="h-13 min-w-0 flex-1 rounded-xl border border-arena-input bg-arena-bg/70 text-center font-mono text-xl font-semibold uppercase text-arena-fg shadow-inner transition-all duration-200 outline-none placeholder:text-arena-muted/40 focus:border-sky/70 focus:bg-arena-bg focus:ring-4 focus:ring-sky/20 sm:h-14 sm:text-2xl"
          placeholder="•"
        />
      ))}
    </div>
  )
}
