'use client'

import { useEffect, useState } from 'react'

const LEVELS = [
  { level: 1, name: 'Freshman', emoji: '📚', xpRequired: 0 },
  { level: 2, name: 'Apprentice', emoji: '✏️', xpRequired: 150 },
  { level: 3, name: 'Scholar', emoji: '🎓', xpRequired: 400 },
  { level: 4, name: 'Analyst', emoji: '🔍', xpRequired: 800 },
  { level: 5, name: 'Achiever', emoji: '⭐', xpRequired: 1500 },
  { level: 6, name: 'Expert', emoji: '🧠', xpRequired: 2500 },
  { level: 7, name: 'Master', emoji: '🏆', xpRequired: 4000 },
  { level: 8, name: 'Prodigy', emoji: '⚡', xpRequired: 6000 },
  { level: 9, name: 'Sage', emoji: '🌟', xpRequired: 9000 },
  { level: 10, name: 'Legend', emoji: '👑', xpRequired: 13000 },
]

interface XPResult {
  xpEarned: number
  breakdown: { reason: string; amount: number }[]
  oldXP: number
  newXP: number
  oldLevel: { level: number; name: string; emoji: string; xpRequired: number }
  newLevel: { level: number; name: string; emoji: string; xpRequired: number }
  nextLevel: { level: number; name: string; emoji: string; xpRequired: number } | null
  didLevelUp: boolean
  newStreak: number
  streakBonus: number
  streakMessage: string
  bonusGenerationsAdded: number
  isPremium: boolean
}

interface Props {
  result: XPResult
  onClose: () => void
}

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    color: ['#22550e', '#7ab648', '#f5c842', '#4a7a28', '#a8d878', '#e8a020'][Math.floor(Math.random() * 6)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }))

  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:10001, overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute',
          left:`${p.x}%`,
          top:'-20px',
          width:`${p.size}px`,
          height:`${p.size}px`,
          background: p.color,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          transform: `rotate(${p.rotation}deg)`,
          animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function XPModal({ result, onClose }: Props) {
  const [phase, setPhase] = useState<'enter' | 'xpFill' | 'levelUp' | 'streak' | 'done'>('enter')
  const [displayXP, setDisplayXP] = useState(result.oldXP)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const { newLevel, nextLevel, oldXP, newXP, didLevelUp, newStreak, bonusGenerationsAdded } = result

  const currentLevelXP = newLevel.xpRequired
  const nextLevelXP = nextLevel?.xpRequired ?? newXP + 1000
  const xpIntoLevel = newXP - currentLevelXP
  const xpNeeded = nextLevelXP - currentLevelXP
  const progressPct = Math.min((xpIntoLevel / xpNeeded) * 100, 100)

  const oldProgressPct = Math.min(
    ((oldXP - currentLevelXP) / xpNeeded) * 100,
    100
  )

  useEffect(() => {
    // Phase 1: show modal
    const t1 = setTimeout(() => {
      setPhase('xpFill')
      setShowBreakdown(true)
      // Animate XP counter
      const start = result.oldXP
      const end = result.newXP
      const dur = 1500
      const startTime = Date.now()
      const tick = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / dur, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayXP(Math.round(start + (end - start) * eased))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, 400)

    const t2 = setTimeout(() => {
      if (didLevelUp) {
        setPhase('levelUp')
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      } else if (newStreak > 1) {
        setPhase('streak')
      } else {
        setPhase('done')
      }
    }, 2200)

    const t3 = setTimeout(() => setPhase('done'), 4000)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <>
      {showConfetti && <Confetti />}

      <div style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
        zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'1.5rem', backdropFilter:'blur(4px)',
        animation:'fadeIn 0.3s ease',
      }} onClick={phase === 'done' ? onClose : undefined}>

        <div style={{
          background:'white', borderRadius:'1.5rem',
          padding:'2rem', maxWidth:'28rem', width:'100%',
          boxShadow:'0 24px 64px rgba(0,0,0,0.2)',
          animation:'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
          position:'relative', overflow:'hidden',
        }} onClick={e => e.stopPropagation()}>

          {/* Top accent */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:'4px',
            background:'linear-gradient(90deg, rgb(34,85,14), rgb(122,182,72))',
          }} />

          {/* Level Up Phase */}
          {phase === 'levelUp' && (
            <div style={{ textAlign:'center', marginBottom:'1.5rem', animation:'popIn 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
              <div style={{ fontSize:'4rem', marginBottom:'0.5rem', animation:'bounce 0.6s ease infinite alternate' }}>
                {newLevel.emoji}
              </div>
              <div style={{
                background:'linear-gradient(135deg, rgb(34,85,14), rgb(74,122,40))',
                color:'white', borderRadius:'9999px',
                padding:'0.375rem 1.25rem', display:'inline-block',
                fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'0.8125rem',
                letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'0.75rem',
              }}>⬆️ Level Up!</div>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
                You're now {newLevel.name}!
              </h2>
              {bonusGenerationsAdded > 0 && (
                <div style={{ marginTop:'0.75rem', padding:'0.75rem 1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.06)', border:'1px solid rgba(34,85,14,0.15)' }}>
                  <p style={{ fontSize:'0.9375rem', color:'rgb(34,85,14)', fontWeight:600 }}>
                    🎁 +{bonusGenerationsAdded} free bonus generation{bonusGenerationsAdded > 1 ? 's' : ''} added to your account!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Streak Phase */}
          {phase === 'streak' && newStreak > 1 && (
            <div style={{ textAlign:'center', marginBottom:'1.5rem', animation:'popIn 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
              <div style={{ fontSize:'3.5rem', marginBottom:'0.5rem', animation:'fireShake 0.3s ease infinite alternate' }}>🔥</div>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
                {newStreak} Day Streak!
              </h2>
              <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>
                {newStreak >= 30 ? "Legendary dedication! 👑" : newStreak >= 7 ? "You're on fire! Keep it up 🔥" : "Keep studying daily to grow your streak!"}
              </p>
              {result.streakBonus > 0 && (
                <div style={{ marginTop:'0.75rem', padding:'0.625rem 1rem', borderRadius:'0.875rem', background:'rgba(232,160,32,0.1)', border:'1px solid rgba(232,160,32,0.3)' }}>
                  <p style={{ fontSize:'0.875rem', color:'rgb(180,120,10)', fontWeight:600 }}>+{result.streakBonus} XP streak bonus!</p>
                </div>
              )}
            </div>
          )}

          {/* Normal/Done Phase header */}
          {(phase === 'xpFill' || phase === 'done' || phase === 'enter') && !didLevelUp && (
            <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>
                {result.xpEarned >= 50 ? '🚀' : result.xpEarned >= 30 ? '⭐' : '✨'}
              </div>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'rgb(26,26,20)' }}>
                +{result.xpEarned} XP earned!
              </h2>
            </div>
          )}

          {/* XP Bar */}
          <div style={{ marginBottom:'1.25rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <span style={{ fontSize:'1.25rem' }}>{newLevel.emoji}</span>
                <div>
                  <p style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'0.875rem', color:'rgb(26,26,20)' }}>
                    Level {newLevel.level} — {newLevel.name}
                  </p>
                  <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)' }}>{displayXP} XP total</p>
                </div>
              </div>
              {nextLevel && (
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)' }}>
                    {nextLevelXP - displayXP} XP to {nextLevel.name}
                  </p>
                </div>
              )}
            </div>
            <div style={{ width:'100%', height:'12px', background:'rgba(34,85,14,0.1)', borderRadius:'9999px', overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:'9999px',
                background:'linear-gradient(90deg, rgb(34,85,14), rgb(122,182,72))',
                width: phase === 'enter' ? `${oldProgressPct}%` : `${progressPct}%`,
                transition:'width 1.5s cubic-bezier(0.16,1,0.3,1)',
                boxShadow:'0 0 8px rgba(34,85,14,0.4)',
                position:'relative',
              }}>
                <div style={{
                  position:'absolute', right:0, top:'50%', transform:'translateY(-50%)',
                  width:'16px', height:'16px', borderRadius:'50%',
                  background:'white', border:'2px solid rgb(34,85,14)',
                  boxShadow:'0 0 6px rgba(34,85,14,0.5)',
                }} />
              </div>
            </div>
          </div>

          {/* XP Breakdown */}
          {showBreakdown && result.breakdown.length > 0 && (
            <div style={{
              background:'rgba(34,85,14,0.03)', border:'1px solid rgba(34,85,14,0.08)',
              borderRadius:'0.875rem', padding:'1rem', marginBottom:'1.25rem',
              animation:'fadeIn 0.4s ease',
            }}>
              <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(107,107,88)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.625rem' }}>
                XP Breakdown
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                {result.breakdown.map((b, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.875rem', color:'rgb(26,26,20)' }}>{b.reason}</span>
                    <span style={{ fontSize:'0.875rem', fontWeight:700, color:'rgb(34,85,14)' }}>+{b.amount}</span>
                  </div>
                ))}
                <div style={{ borderTop:'1px solid rgba(34,85,14,0.1)', paddingTop:'0.375rem', marginTop:'0.25rem', display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'0.875rem', fontWeight:700, color:'rgb(26,26,20)' }}>Total</span>
                  <span style={{ fontSize:'0.875rem', fontWeight:700, color:'rgb(34,85,14)' }}>+{result.xpEarned} XP</span>
                </div>
              </div>
            </div>
          )}

          {/* Streak display */}
          {newStreak > 0 && phase !== 'streak' && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem', padding:'0.625rem 1rem', borderRadius:'0.875rem', background:'rgba(232,160,32,0.08)', border:'1px solid rgba(232,160,32,0.2)' }}>
              <span style={{ fontSize:'1.25rem' }}>🔥</span>
              <p style={{ fontSize:'0.875rem', color:'rgb(180,120,10)', fontWeight:600 }}>{newStreak} day streak</p>
              {result.streakBonus > 0 && <span style={{ marginLeft:'auto', fontSize:'0.8125rem', color:'rgb(180,120,10)', fontWeight:700 }}>+{result.streakBonus} XP</span>}
            </div>
          )}

          {/* Close button */}
          <button onClick={onClose} style={{
            width:'100%', padding:'0.875rem', borderRadius:'0.875rem',
            background: phase === 'done' || phase === 'levelUp' || phase === 'streak'
              ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.08)',
            color: phase === 'done' || phase === 'levelUp' || phase === 'streak'
              ? 'white' : 'rgb(34,85,14)',
            border:'none', cursor:'pointer',
            fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'1rem',
            transition:'all 0.3s',
          }}>
            {phase === 'done' || phase === 'levelUp' || phase === 'streak' ? 'Keep studying 🚀' : 'Loading...'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
        @keyframes popIn { from { opacity:0; transform:scale(0.7) } to { opacity:1; transform:scale(1) } }
        @keyframes bounce { from { transform:translateY(0) } to { transform:translateY(-12px) } }
        @keyframes fireShake { from { transform:rotate(-5deg) scale(1) } to { transform:rotate(5deg) scale(1.1) } }
      `}</style>
    </>
  )
}