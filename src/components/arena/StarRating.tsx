"use client"

import { useState } from "react"
import { Star } from "lucide-react"

// Read-only average-rating display: ★★★★☆ 4.2 (12)
export function StarDisplay({
  value,
  count,
  size = 14,
  showCount = true,
}: {
  value: number
  count?: number
  size?: number
  showCount?: boolean
}) {
  const rounded = Math.round(value * 2) / 2 // nearest half
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = rounded >= i
          const half = !filled && rounded >= i - 0.5
          return (
            <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
              <Star className="absolute inset-0 text-arena-muted/40" style={{ width: size, height: size }} aria-hidden />
              {(filled || half) && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: half ? size / 2 : size }}>
                  <Star className="fill-ember text-ember" style={{ width: size, height: size }} aria-hidden />
                </span>
              )}
            </span>
          )
        })}
      </span>
      {value > 0 && <span className="text-xs font-semibold text-arena-fg tabular-nums">{value.toFixed(1)}</span>}
      {showCount && <span className="text-xs text-arena-muted">({count ?? 0})</span>}
    </span>
  )
}

// Interactive 1-5 selector. The saved rating ONLY changes on click (onRate).
// Hover is a purely-visual preview kept in separate state; leaving the widget
// clears it, so the display always falls back to the committed `value` — it
// never follows the cursor or "sticks" without a click.
export function StarInput({
  value,
  onRate,
  size = 30,
  disabled = false,
}: {
  value: number
  onRate: (rating: number) => void
  size?: number
  disabled?: boolean
}) {
  const [hover, setHover] = useState(0)
  // Preview follows the cursor only while hovering; otherwise show the committed value.
  const shown = disabled ? value : (hover || value)
  return (
    <div
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label="Rate this quiz"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i === 1 ? "" : "s"}`}
          disabled={disabled}
          onMouseEnter={() => { if (!disabled) setHover(i) }}
          onFocus={() => { if (!disabled) setHover(i) }}
          onBlur={() => setHover(0)}
          onClick={() => { if (!disabled) onRate(i) }}
          className="rounded outline-none transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ember/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Star
            className={shown >= i ? "fill-ember text-ember" : "text-arena-muted/50"}
            style={{ width: size, height: size }}
            aria-hidden
          />
        </button>
      ))}
    </div>
  )
}
