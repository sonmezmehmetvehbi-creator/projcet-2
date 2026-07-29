'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, RotateCcw, Share2, Zap } from 'lucide-react'

type Participant = {
  user_id: string
  display_name: string
  avatar_emoji: string
  score: number
  correct: number
  attempted: number
  best_streak: number
  completion_time_seconds: number | null
  completed: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']
const MEDAL_COLOR = ['rgb(251,191,36)', 'rgb(203,213,225)', 'rgb(217,119,6)']
const MEDAL_TINT = ['rgba(251,191,36,0.12)', 'rgba(203,213,225,0.1)', 'rgba(217,119,6,0.1)']
const MEDAL_BORDER = ['rgba(251,191,36,0.45)', 'rgba(203,213,225,0.4)', 'rgba(217,119,6,0.4)']

function accuracyOf(p: { correct: number; attempted: number }) {
  return p.attempted > 0 ? Math.round((p.correct / p.attempted) * 100) : 0
}

export default function ResultsClient({
  challenge,
  me,
  leaderboard,
  currentUserId,
  canCreate,
}: {
  challenge: any
  me: Participant
  leaderboard: Participant[]
  currentUserId: string
  canCreate: boolean
}) {
  const router = useRouter()

  const completed = useMemo(
    () => leaderboard.filter((p) => p.completed).sort((a, b) => b.score - a.score),
    [leaderboard]
  )
  const totalPlayers = completed.length
  const myRank = Math.max(1, completed.findIndex((p) => p.user_id === currentUserId) + 1)
  const isTop3 = myRank <= 3
  const percentile = totalPlayers > 1 ? Math.round(((totalPlayers - myRank) / (totalPlayers - 1)) * 100) : 100
  const accuracy = accuracyOf(me)

  // Rank count-up (for non-medal ranks).
  const [rankDisplay, setRankDisplay] = useState(isTop3 ? myRank : 0)
  useEffect(() => {
    if (isTop3) return
    let raf = 0
    const start = performance.now()
    const dur = 800
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      setRankDisplay(Math.round(1 + (myRank - 1) * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isTop3, myRank])

  // Performance bar fill on mount.
  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(percentile), 150)
    return () => clearTimeout(t)
  }, [percentile])

  const [copied, setCopied] = useState(false)
  async function shareResult() {
    const text = `I ranked #${myRank} in ${challenge.title} on AceForge with ${me.score} points! 🏆`
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2200) } catch {}
  }

  const glow = isTop3 ? MEDAL_COLOR[myRank - 1] : 'rgb(196,181,253)'

  const stats = [
    { label: 'Score', value: `${me.score}` },
    { label: 'Accuracy', value: `${accuracy}%` },
    { label: 'Best Streak', value: `${me.best_streak}` },
    { label: 'Time Used', value: me.completion_time_seconds != null ? `${me.completion_time_seconds}s` : '—' },
  ]

  return (
    <div className="animate-fade-in" style={{ position: 'relative', maxWidth: '44rem', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}>
      <div style={{ position: 'absolute', top: '4rem', left: '50%', transform: 'translateX(-50%)', width: '34rem', height: '20rem', borderRadius: '9999px', background: `${glow}22`, filter: 'blur(120px)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: '2rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(196,181,253)', marginBottom: '0.75rem' }}>⚡ Forge Results</span>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '0.375rem' }}>{challenge.title}</h1>
        <p style={{ fontSize: '0.9375rem', color: 'rgb(148,148,168)' }}>{challenge.subject}{challenge.topic ? ` · ${challenge.topic}` : ''} · Hosted by {challenge.creator_name}</p>
      </div>

      {/* Placement hero */}
      <div style={{ position: 'relative', textAlign: 'center', borderRadius: '1.5rem', border: `1px solid ${glow}55`, background: 'rgba(19,19,31,0.7)', padding: '2.5rem 1.5rem', marginBottom: '1.5rem', boxShadow: `0 0 50px ${glow}22`, animation: 'forgeRankPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, color: glow, textShadow: `0 0 40px ${glow}80` }}>
          {isTop3 ? MEDALS[myRank - 1] : `#${rankDisplay}`}
        </div>
        <p style={{ fontSize: '0.9375rem', color: 'rgb(148,148,168)', marginTop: '0.5rem' }}>out of {totalPlayers} player{totalPlayers === 1 ? '' : 's'}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', marginTop: '1.25rem' }}>
          <span style={{ fontSize: '4rem', lineHeight: 1 }}>{me.avatar_emoji}</span>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{me.display_name}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(19,19,31,0.7)', padding: '1.25rem', textAlign: 'center', animation: 'slideup 0.4s ease both', animationDelay: `${i * 0.08}s` }}>
            <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'rgb(251,191,36)', lineHeight: 1.1 }}>{s.value}</p>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgb(148,148,168)', marginTop: '0.3rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Performance bar */}
      <div style={{ borderRadius: '1rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.9375rem', color: 'white', fontWeight: 700, marginBottom: '0.75rem' }}>
          You scored better than <span style={{ color: 'rgb(196,181,253)' }}>{percentile}%</span> of participants
        </p>
        <div style={{ height: '0.6rem', width: '100%', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barWidth}%`, borderRadius: '9999px', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(251,191,36))', transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
        </div>
      </div>

      {/* Final standings */}
      <div style={{ borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Zap style={{ width: '1.1rem', height: '1.1rem', color: 'rgb(196,181,253)' }} />
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Final Standings</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {completed.map((p, i) => {
            const isMe = p.user_id === currentUserId
            const isHost = p.user_id === challenge.creator_id
            const top3 = i < 3
            const bg = isMe ? 'rgba(124,58,237,0.14)' : top3 ? MEDAL_TINT[i] : 'rgba(255,255,255,0.03)'
            const border = isMe ? 'rgba(124,58,237,0.6)' : top3 ? MEDAL_BORDER[i] : 'rgba(255,255,255,0.06)'
            return (
              <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.875rem', padding: '0.75rem 1rem', border: `1px solid ${border}`, background: bg, boxShadow: isMe ? '0 0 22px rgba(124,58,237,0.35)' : 'none', animation: 'slidein 0.4s ease both', animationDelay: `${i * 0.05}s` }}>
                <span style={{ width: '1.75rem', textAlign: 'center', fontWeight: 800, color: top3 ? MEDAL_COLOR[i] : 'rgb(180,180,200)' }}>
                  {top3 ? MEDALS[i] : i + 1}
                </span>
                <span style={{ fontSize: '1.35rem' }}>{p.avatar_emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.display_name}</span>
                    {isHost && <span style={{ fontSize: '0.625rem', fontWeight: 800, color: 'rgb(245,158,11)', background: 'rgba(245,158,11,0.12)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>HOST</span>}
                    {isMe && <span style={{ fontSize: '0.625rem', fontWeight: 800, color: 'rgb(196,181,253)' }}>YOU</span>}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'rgb(148,148,168)' }}>{accuracyOf(p)}% accuracy</span>
                </div>
                <span style={{ fontWeight: 900, color: 'rgb(251,191,36)', fontSize: '1.05rem' }}>{p.score}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {canCreate && (
          <button onClick={() => router.push('/arena/forge/create')}
            style={{ flex: '1 1 12rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, fontSize: '0.9375rem', cursor: 'pointer', boxShadow: '0 0 26px rgba(124,58,237,0.4)' }}>
            <RotateCcw style={{ width: '1.05rem', height: '1.05rem' }} /> Play Again 🔄
          </button>
        )}
        <button onClick={shareResult}
          style={{ flex: '1 1 12rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', borderRadius: '0.875rem', border: '1px solid rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.1)', color: 'rgb(196,181,253)', fontWeight: 800, fontSize: '0.9375rem', cursor: 'pointer' }}>
          <Share2 style={{ width: '1.05rem', height: '1.05rem' }} /> {copied ? 'Copied!' : 'Share my result'}
        </button>
        <button onClick={() => router.push('/arena')}
          style={{ flex: '1 1 12rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgb(200,200,215)', fontWeight: 800, fontSize: '0.9375rem', cursor: 'pointer' }}>
          Back to Arena <ArrowRight style={{ width: '1.05rem', height: '1.05rem' }} />
        </button>
      </div>

      <style>{`@keyframes forgeRankPop { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  )
}
