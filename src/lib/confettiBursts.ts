// Celebratory confetti bursts for the Forge Quiz podium / results screens.
// canvas-confetti is imported dynamically so it never runs during SSR and stays
// out of the initial bundle — each helper is a one-shot (call it once per stage,
// never on a loop).

const GOLD = ['#fbbf24', '#f59e0b', '#fcd34d', '#fde68a', '#eab308']
const PARTY = ['#fbbf24', '#a78bfa', '#38bdf8', '#22c55e', '#f97316', '#ec4899']

async function load() {
  if (typeof window === 'undefined') return null
  try {
    return (await import('canvas-confetti')).default
  } catch {
    return null
  }
}

// Angled confetti cannons firing from both bottom corners for ~1s — the big
// "the podium is here" moment.
export async function burstCannons() {
  const confetti = await load()
  if (!confetti) return
  const end = Date.now() + 1000
  ;(function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, startVelocity: 62, origin: { x: 0, y: 1 }, colors: PARTY })
    confetti({ particleCount: 5, angle: 120, spread: 60, startVelocity: 62, origin: { x: 1, y: 1 }, colors: PARTY })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

// A more intense, gold-forward double burst — reserved for the 1st-place reveal.
export async function burstGold() {
  const confetti = await load()
  if (!confetti) return
  confetti({ particleCount: 160, spread: 100, startVelocity: 48, origin: { y: 0.5 }, colors: GOLD, scalar: 1.1 })
  setTimeout(() => confetti({ particleCount: 120, spread: 130, startVelocity: 38, origin: { y: 0.4 }, colors: GOLD, scalar: 1.3, gravity: 0.9 }), 260)
}

// Smaller, personal-scale burst for a player's own result screen. Gold + bigger
// for a winner; a lighter party mix otherwise.
export async function burstPersonal(winner: boolean) {
  const confetti = await load()
  if (!confetti) return
  confetti({
    particleCount: winner ? 130 : 80,
    spread: winner ? 90 : 70,
    startVelocity: 42,
    origin: { y: 0.6 },
    colors: winner ? GOLD : PARTY,
    scalar: winner ? 1.05 : 0.9,
  })
}
