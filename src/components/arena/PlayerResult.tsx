'use client'

import { useState } from 'react'
import Link from 'next/link'
import Confetti, { CountUp } from './Confetti'

export default function PlayerResult({
  rank, totalPlayers, score, correct, attempted, bestStreak, quizTitle, bannerColor = '#7c3aed', playerName, avatar,
}: {
  rank: number
  totalPlayers: number
  score: number
  correct: number
  attempted: number
  bestStreak: number
  quizTitle: string
  bannerColor?: string
  playerName: string
  avatar: string
}) {
  const tier = rank >= 1 && rank <= 3 ? 'top3' : rank <= 5 ? 'mention' : 'other'
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
  const medal = ['🥇', '🥈', '🥉'][rank - 1]
  const [copied, setCopied] = useState(false)

  async function share() {
    const text = `I placed #${rank} in ${quizTitle} Live! 🎯`
    try {
      if (navigator.share) { await navigator.share({ text }); return }
      await navigator.clipboard.writeText(text)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const headline =
    tier === 'top3' ? `You got ${['1st', '2nd', '3rd'][rank - 1]} place!`
      : tier === 'mention' ? `Honorable Mention!`
        : 'Great effort!'
  const sub =
    tier === 'mention' ? `You placed #${rank} of ${totalPlayers}`
      : tier === 'other' ? `You placed #${rank} of ${totalPlayers}`
        : `Out of ${totalPlayers} players`

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(8,8,16)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1.5rem 4rem' }}>
      {tier === 'top3' && <Confetti count={60} intense={rank === 1} />}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '40rem', height: '22rem', borderRadius: '9999px', background: `${bannerColor}22`, filter: 'blur(120px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '26rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '4rem', animation: 'introPop 0.5s ease both' }}>{tier === 'top3' ? medal : tier === 'mention' ? '🎖️' : avatar}</div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.25rem', fontWeight: 900, color: tier === 'top3' ? 'rgb(251,191,36)' : 'white', textAlign: 'center', lineHeight: 1.1 }}>{headline}</h1>
        <p style={{ color: 'rgb(180,180,200)', fontWeight: 700 }}>{sub}</p>

        <div style={{ marginTop: '0.5rem', fontFamily: 'Fraunces, Georgia, serif', fontSize: '3.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
          <CountUp value={score} />
        </div>
        <p style={{ color: 'rgb(148,148,168)', fontSize: '0.875rem', fontWeight: 700, marginTop: '-0.5rem' }}>total points</p>

        {/* Stats card */}
        <div style={{ width: '100%', marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Stat label="Correct" value={`${correct}/${attempted}`} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Best Streak" value={`🔥 ${bestStreak}`} />
          <Stat label="Final Rank" value={`#${rank}`} />
        </div>

        <button onClick={share}
          style={{ marginTop: '1.5rem', width: '100%', height: '3.25rem', borderRadius: '9999px', border: 'none', background: bannerColor, color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
          {copied ? 'Copied! ✓' : '📣 Share My Result'}
        </button>
        <Link href="/arena" style={{ marginTop: '0.25rem', width: '100%', textAlign: 'center', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, textDecoration: 'none' }}>
          Back to Arena →
        </Link>
      </div>

      <style>{`@keyframes introPop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '1rem', textAlign: 'center' }}>
      <p style={{ color: 'rgb(148,148,168)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{label}</p>
      <p style={{ color: 'white', fontWeight: 900, fontSize: '1.35rem' }}>{value}</p>
    </div>
  )
}
