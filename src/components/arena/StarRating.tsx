"use client"

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

// Interactive 1-5 selector. Click-only: the display is driven purely by the
// committed `value` prop and updates solely when a star is clicked (onRate). It
// never tracks the cursor — no hover preview.
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
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rate this quiz">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i === 1 ? "" : "s"}`}
          disabled={disabled}
          onClick={() => { console.log('[StarInput] clicked star', i, 'current value:', value); if (!disabled) onRate(i) }}
          className="rounded outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ember/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Star
            className={value >= i ? "fill-ember text-ember" : "text-arena-muted/50"}
            style={{ width: size, height: size }}
            aria-hidden
          />
        </button>
      ))}
    </div>
  )
}
