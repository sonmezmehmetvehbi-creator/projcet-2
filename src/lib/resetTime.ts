// Client-safe helpers for the free-plan daily reset, which happens at local
// midnight in the user's own timezone.

export function msUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}

export function hoursUntilMidnight(now: Date = new Date()): number {
  return Math.max(1, Math.ceil(msUntilMidnight(now) / (1000 * 60 * 60)))
}

// Human-readable countdown, e.g. "5h 12m" or "43m".
export function formatTimeUntilMidnight(now: Date = new Date()): string {
  const totalMinutes = Math.max(0, Math.floor(msUntilMidnight(now) / 60000))
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
