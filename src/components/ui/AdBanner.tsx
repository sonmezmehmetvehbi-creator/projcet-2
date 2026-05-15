'use client'

import { useEffect, useRef } from 'react'

interface AdBannerProps {
  slot: string
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'
  style?: React.CSSProperties
}

export default function AdBanner({ slot, format = 'auto', style }: AdBannerProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      // @ts-ignore
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [])

  const publisherId = 'ca-pub-XXXXXXXXXXXXXXXX' // Replace with your real ID after AdSense approval

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(34,85,14,0.02)', borderRadius:'0.75rem',
      border:'1px dashed rgba(34,85,14,0.12)',
      overflow:'hidden', minHeight:'90px',
      ...style,
    }}>
      <ins
        className="adsbygoogle"
        style={{ display:'block', width:'100%' }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}