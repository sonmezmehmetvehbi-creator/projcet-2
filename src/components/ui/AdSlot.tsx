'use client'

import AdBanner from './AdBanner'
import Link from 'next/link'

interface AdSlotProps {
  isPremium: boolean
  slot: string
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'
  style?: React.CSSProperties
  label?: boolean
}

export default function AdSlot({ isPremium, slot, format, style, label = true }: AdSlotProps) {
  if (isPremium) return null

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem', ...style }}>
      {label && (
        <p style={{ fontSize:'0.6875rem', color:'rgb(107,107,88)', textAlign:'center', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          Advertisement
        </p>
      )}
      <AdBanner slot={slot} format={format} />
      <p style={{ fontSize:'0.6875rem', color:'rgb(107,107,88)', textAlign:'center' }}>
        <Link href="/pricing" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>
          Upgrade to Premium
        </Link>
        {' '}to remove ads
      </p>
    </div>
  )
}