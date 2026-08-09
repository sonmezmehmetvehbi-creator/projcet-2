// Lightweight abuse guardrails for the Forge Quiz guest-join flow (LIVE Host +
// Self-Paced Room). Sized for the real use case — a classroom of students, some
// of them bored and mashing refresh — NOT for internet-scale attack traffic. No
// CAPTCHA, no external store: just an in-memory sliding window plus a small
// nickname blocklist. Good enough to stop accidental spam and obvious abuse.

// ── Client IP ──────────────────────────────────────────────────────────────
// On Vercel the real client IP is the first entry of x-forwarded-for. Fall back
// to x-real-ip, then a constant so the limiter still groups "unknown" callers.
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

// ── Rate limit: new guest joins per IP, per room ─────────────────────────────
// More than MAX_JOINS brand-new guest joins from one IP into the same room
// within WINDOW_MS is treated as spam. Rejoins (same guest_id reusing its row)
// never reach this check, so a single student refreshing is unaffected — this
// only trips when one IP keeps minting *distinct* guests.
const WINDOW_MS = 60_000
const MAX_JOINS = 5

// key (`${ip}::${roomId}`) -> recent join timestamps (ms). Module-level so it
// persists across requests within a warm serverless instance.
const joinLog = new Map<string, number[]>()

// Opportunistic cleanup so the map can't grow unbounded on a long-lived
// instance: occasionally drop keys whose windows have fully expired.
let opsSinceSweep = 0
function maybeSweep(now: number) {
  if (++opsSinceSweep < 500) return
  opsSinceSweep = 0
  joinLog.forEach((times, key) => {
    if (times.every((t) => now - t >= WINDOW_MS)) joinLog.delete(key)
  })
}

// Record a new-guest join attempt and report whether it's allowed. Call this
// ONLY on the new-row path for guests (not on rejoin, not for authed users).
export function allowGuestJoin(ip: string, roomId: string): boolean {
  const now = Date.now()
  maybeSweep(now)
  const key = `${ip}::${roomId}`
  const recent = (joinLog.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_JOINS) {
    joinLog.set(key, recent) // keep the pruned window; don't record the blocked attempt
    return false
  }
  recent.push(now)
  joinLog.set(key, recent)
  return true
}

// ── Nickname filtering ───────────────────────────────────────────────────────
// A compact blocklist of clearly-inappropriate roots. Not exhaustive by design —
// it catches the obvious cases a student would try. Matching is done on a
// normalized form (lowercased, common leet substitutions, punctuation/spacing
// stripped) so "n1ce" style evasions of the obvious words are still caught,
// while ordinary names pass through.
const BLOCKED = [
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'bastard', 'dick', 'pussy',
  'cock', 'nigger', 'nigga', 'faggot', 'fag', 'retard', 'rape', 'slut',
  'whore', 'penis', 'vagina', 'boobs', 'porn', 'sex', 'nazi', 'hitler',
  'kys', 'jizz', 'cum', 'wank', 'twat', 'prick', 'dildo',
]

function normalizeForFilter(name: string): string {
  return name
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-z]/g, '')
}

// True when the nickname is acceptable. Empty/whitespace names are considered
// acceptable here — callers already substitute a default like "Player".
export function isNicknameClean(name: string): boolean {
  const normalized = normalizeForFilter(String(name ?? ''))
  if (!normalized) return true
  return !BLOCKED.some((word) => normalized.includes(word))
}
