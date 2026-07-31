'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CountUp } from './Confetti'
import { burstCannons, burstGold } from '@/lib/confettiBursts'

export type PodiumPlayer = { user_id: string; display_name: string; avatar_emoji: string; score: number }

const MEDALS = ['🥇', '🥈', '🥉']
const PLACE_LABEL = ['1st Place — WINNER!', '2nd Place', '3rd Place']
// Accent + intro riser height per rank (0 = 1st … 2 = 3rd). Gold / silver / bronze.
const ACCENT = ['#fbbf24', '#cbd5e1', '#cd7f32']
const RISER_H = [190, 140, 100]

export default function LivePodium({
  players, quizTitle, bannerColor = '#7c3aed', animated = true, highlightUserId, controls,
}: {
  players: PodiumPlayer[]
  quizTitle: string
  bannerColor?: string
  animated?: boolean
  highlightUserId?: string
  controls?: React.ReactNode
}) {
  const ranked = [...players].sort((a, b) => b.score - a.score)
  const top3 = ranked.slice(0, 3)
  const mentions = ranked.slice(3, 5)
  const [stage, setStage] = useState(animated ? 0 : 4)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!animated) return
    // Reveal 3rd → 2nd → 1st → full podium with escalating suspense: a longer
    // pause before 2nd, and the longest hold before the 1st-place reveal.
    const DELAYS = [1500, 4000, 7500, 10500] // stages 1..4
    const timers = DELAYS.map((d, i) => setTimeout(() => setStage(i + 1), d))
    return () => timers.forEach(clearTimeout)
  }, [animated])

  // Fire confetti once per key stage: a gold blast for the 1st-place reveal,
  // and the bottom-corner cannons when the full podium lands.
  useEffect(() => {
    if (stage === 3) burstGold()
    if (stage >= 4) burstCannons()
  }, [stage])

  // Intro stages: announce one place at a time (3rd first, then 2nd, then 1st).
  const introFor: Record<number, number> = { 1: 2, 2: 1, 3: 0 }
  const introRank = introFor[stage]

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(8,8,16)', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient drifting glows — keep the dark screen feeling alive during the
          reveal pauses (CSS-only, low-opacity, non-distracting). */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', width: '50rem', height: '30rem', borderRadius: '9999px', background: 'rgba(251,191,36,0.12)', filter: 'blur(150px)', animation: 'ambientDrift 16s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-6rem', left: '10%', width: '34rem', height: '34rem', borderRadius: '9999px', background: 'rgba(124,58,237,0.10)', filter: 'blur(140px)', animation: 'ambientDrift2 22s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '30%', right: '5%', width: '28rem', height: '28rem', borderRadius: '9999px', background: 'rgba(56,189,248,0.08)', filter: 'blur(130px)', animation: 'ambientDrift2 19s ease-in-out infinite reverse' }} />
      </div>

      {/* ── Intro reveal sequence ── */}
      {stage < 4 && (
        <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
          {stage === 0 && (
            <>
              <div style={{ fontSize: '4rem' }}>🎉</div>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white' }}>Tallying the final scores…</h1>
            </>
          )}
          {introRank != null && top3[introRank] && (
            <IntroCard rank={introRank} player={top3[introRank]} />
          )}
        </div>
      )}

      {/* ── Full podium ── */}
      {stage >= 4 && (
        <div style={{ position: 'relative', maxWidth: '52rem', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
          <p style={{ textAlign: 'center', color: 'rgb(196,181,253)', fontWeight: 800, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{quizTitle}</p>
          <h1 style={{ textAlign: 'center', fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '2.5rem' }}>🏆 Final Results</h1>

          {/* Pedestals: 2nd | 1st | 3rd */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            {[1, 0, 2].map((r) => {
              const p = top3[r]
              if (!p) return <div key={r} style={{ flex: 1, maxWidth: '11rem' }} />
              const isFirst = r === 0
              const accent = ACCENT[r]
              const mine = p.user_id === highlightUserId
              return (
                <div key={r} style={{ flex: 1, maxWidth: '11rem', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'podiumRise 0.7s cubic-bezier(0.22,1.4,0.36,1) both', animationDelay: `${r * 0.12}s` }}>
                  <div style={{ fontSize: isFirst ? '3rem' : '2.4rem' }}>{isFirst ? '👑' : ''}</div>
                  <div style={{ fontSize: isFirst ? '2.75rem' : '2.25rem' }}>{p.avatar_emoji}</div>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: isFirst ? '1.1rem' : '0.95rem', textAlign: 'center', margin: '0.25rem 0', maxWidth: '10rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.display_name}{mine && ' (You)'}
                  </p>
                  <p style={{ color: accent, fontWeight: 900, fontSize: isFirst ? '1.35rem' : '1.1rem' }}><CountUp value={p.score} /></p>
                  <div style={{
                    width: '100%', height: RISER_H[r], marginTop: '0.5rem', borderRadius: '0.75rem 0.75rem 0 0',
                    background: `linear-gradient(180deg, ${accent}${isFirst ? '59' : '2b'}, ${accent}12)`,
                    border: `1px solid ${accent}${isFirst ? '99' : '55'}`,
                    borderBottom: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
                    animation: isFirst ? 'goldPulse 2.2s ease-in-out infinite' : 'none',
                  }}>
                    <span style={{ fontSize: '2rem' }}>{MEDALS[r]}</span>
                    <span style={{ color: accent, fontWeight: 900, fontSize: '1.5rem' }}>{r + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Honorable mentions */}
          {mentions.length > 0 && (
            <div style={{ maxWidth: '30rem', margin: '0 auto 1.5rem' }}>
              <p style={{ textAlign: 'center', color: 'rgb(148,148,168)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Honorable Mentions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {mentions.map((p, i) => (
                  <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.75rem', border: p.user_id === highlightUserId ? `1px solid ${bannerColor}` : '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.9rem' }}>
                    <span style={{ width: '1.5rem', fontWeight: 900, color: 'rgb(180,180,200)' }}>{i + 4}</span>
                    <span style={{ fontSize: '1.25rem' }}>{p.avatar_emoji}</span>
                    <span style={{ flex: 1, color: 'white', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}{p.user_id === highlightUserId && ' (You)'}</span>
                    <span style={{ fontWeight: 800, color: 'rgb(251,191,36)' }}>{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full leaderboard toggle */}
          {ranked.length > 0 && (
            <div style={{ maxWidth: '30rem', margin: '0 auto 1.5rem', textAlign: 'center' }}>
              <button onClick={() => setShowAll((s) => !s)}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '9999px', color: 'rgb(196,181,253)', fontWeight: 700, fontSize: '0.875rem', padding: '0.5rem 1.25rem', cursor: 'pointer' }}>
                {showAll ? 'Hide full results' : `📊 View Full Results (${ranked.length} players)`}
              </button>
              {showAll && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', textAlign: 'left' }}>
                  {ranked.map((p, i) => (
                    <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.625rem', background: p.user_id === highlightUserId ? `${bannerColor}22` : 'rgba(255,255,255,0.02)', padding: '0.5rem 0.85rem' }}>
                      <span style={{ width: '1.75rem', fontWeight: 800, color: 'rgb(148,148,168)' }}>{i + 1}</span>
                      <span style={{ fontSize: '1.1rem' }}>{p.avatar_emoji}</span>
                      <span style={{ flex: 1, color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</span>
                      <span style={{ fontWeight: 700, color: 'rgb(251,191,36)' }}>{p.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          {controls && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem' }}>{controls}</div>}

          <div style={{ textAlign: 'center' }}>
            <Link href="/arena" style={{ color: 'rgb(148,148,168)', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none' }}>← Back to Arena</Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes introPop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes riserGrow { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
        @keyframes ambientDrift { 0%, 100% { transform: translate(-50%, 0) scale(1); } 50% { transform: translate(-46%, 20px) scale(1.12); } }
        @keyframes ambientDrift2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -24px) scale(1.15); } }
      `}</style>
    </div>
  )
}

function IntroCard({ rank, player }: { rank: number; player: PodiumPlayer }) {
  const isFirst = rank === 0
  const accent = ACCENT[rank]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', animation: 'introPop 0.5s ease both' }}>
      {isFirst && <div style={{ fontSize: '3rem', animation: 'introPop 0.6s ease both 0.15s' }}>👑</div>}
      <div style={{ fontSize: isFirst ? '3.5rem' : '2.75rem' }}>{MEDALS[rank]}</div>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: isFirst ? '2.75rem' : '2rem', fontWeight: 900, color: isFirst ? accent : 'white', textAlign: 'center' }}>{PLACE_LABEL[rank]}</h2>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
        padding: isFirst ? '1.5rem 2.5rem' : '1.25rem 2rem', borderRadius: '1.25rem',
        border: '1px solid ' + accent + (isFirst ? '' : '55'),
        background: isFirst ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)',
        boxShadow: `0 0 26px ${accent}${isFirst ? '55' : '22'}`,
        animation: 'podiumRise 0.7s cubic-bezier(0.22,1.4,0.36,1) both' + (isFirst ? ', goldPulse 2s ease-in-out infinite 0.7s' : ''),
      }}>
        <div style={{ fontSize: isFirst ? '3.5rem' : '2.75rem' }}>{player.avatar_emoji}</div>
        <p style={{ color: 'white', fontWeight: 800, fontSize: isFirst ? '1.5rem' : '1.2rem' }}>{player.display_name}</p>
        <p style={{ color: accent, fontWeight: 900, fontSize: isFirst ? '2rem' : '1.5rem' }}><CountUp value={player.score} /></p>
      </div>
      {/* Riser pedestal — taller for higher places, grows up from the floor. */}
      <div style={{
        width: isFirst ? '9rem' : '7rem', height: RISER_H[rank], marginTop: '0.25rem',
        borderRadius: '0.75rem 0.75rem 0 0', transformOrigin: 'bottom',
        background: `linear-gradient(180deg, ${accent}55, ${accent}11)`,
        border: `1px solid ${accent}66`, borderBottom: 'none',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '0.6rem',
        animation: 'riserGrow 0.6s cubic-bezier(0.22,1.4,0.36,1) both 0.25s',
      }}>
        <span style={{ color: accent, fontWeight: 900, fontSize: '1.75rem' }}>{rank + 1}</span>
      </div>
    </div>
  )
}
