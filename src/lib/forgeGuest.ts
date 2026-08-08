// Guest (no-account) identity for Forge Quiz LIVE Host + Self-Paced Room joining.
//
// A guest gets a random, stable-per-tab id kept in sessionStorage so that
// refreshing the same tab during a game re-uses the same player row instead of
// creating a duplicate/orphan. Nothing is persisted beyond the browser session
// and no account/email is ever created.

const GUEST_ID_KEY = 'fq_guest_id'

export function getForgeGuestId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = window.sessionStorage.getItem(GUEST_ID_KEY)
    if (!id) {
      id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `g_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
      window.sessionStorage.setItem(GUEST_ID_KEY, id)
    }
    return id
  } catch {
    // Private mode / storage disabled — fall back to an ephemeral id.
    return `g_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  }
}

// Trim + cap a nickname to the flow's existing character limit, mirroring what
// registered users are held to. Returns '' for a whitespace-only name so the
// caller can reject empty joins.
export function sanitizeNickname(name: string, maxLen: number): string {
  return String(name ?? '').trim().slice(0, maxLen)
}
