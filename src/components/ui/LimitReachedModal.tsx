'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, X } from 'lucide-react'
import { formatTimeUntilMidnight } from '@/lib/resetTime'

interface Props {
  open: boolean
  onClose: () => void
  // e.g. "2 free generations" or "1 free SAT practice set"
  limitLabel: string
  bonusRemaining: number
}

export default function LimitReachedModal({ open, onClose, limitLabel, bonusRemaining }: Props) {
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    if (!open) return
    const tick = () => setCountdown(formatTimeUntilMidnight())
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(26,26,20,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ position:'relative', width:'100%', maxWidth:'26rem', background:'white', borderRadius:'1.25rem', padding:'2rem', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', textAlign:'center' }}
      >
        <button onClick={onClose} aria-label="Close"
          style={{ position:'absolute', top:'1rem', right:'1rem', background:'transparent', border:'none', cursor:'pointer', color:'rgb(107,107,88)', padding:'0.25rem', borderRadius:'50%', display:'flex' }}>
          <X style={{ width:'1.125rem', height:'1.125rem' }} />
        </button>

        <div style={{ width:'3.5rem', height:'3.5rem', borderRadius:'50%', background:'rgba(232,160,32,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
          <Zap style={{ width:'1.75rem', height:'1.75rem', color:'rgb(180,120,10)' }} />
        </div>

        <h3 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
          You've reached your daily limit of {limitLabel}
        </h3>
        <p style={{ fontSize:'0.9375rem', color:'rgb(107,107,88)', lineHeight:1.6, marginBottom:'1.25rem' }}>
          Free accounts reset every day at midnight. Upgrade to Premium for unlimited generations.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem', marginBottom:'1.5rem' }}>
          <div style={{ padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.05)', border:'1px solid rgba(34,85,14,0.12)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>🎁 Bonus generations left</span>
            <span style={{ fontSize:'0.9375rem', fontWeight:700, color:'rgb(34,85,14)' }}>{bonusRemaining}</span>
          </div>
          <div style={{ padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.05)', border:'1px solid rgba(34,85,14,0.12)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>⏰ Resets at midnight</span>
            <span style={{ fontSize:'0.9375rem', fontWeight:700, color:'rgb(26,26,20)' }}>in {countdown}</span>
          </div>
        </div>

        <Link href="/pricing" className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.875rem', fontSize:'1rem', textDecoration:'none' }}>
          <Zap style={{ width:'1rem', height:'1rem' }} />
          Upgrade to Premium
        </Link>
        <button onClick={onClose}
          style={{ marginTop:'0.75rem', background:'transparent', border:'none', cursor:'pointer', fontSize:'0.875rem', color:'rgb(107,107,88)', fontWeight:500 }}>
          Maybe later
        </button>
      </div>
    </div>
  )
}
