'use client'

import { useState } from 'react'

export default function ShareButton({ tutorId }: { tutorId: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = `https://aceforge.app/tutoring/tutor/${tutorId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <button onClick={share} className="btn-secondary"
      style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.0625rem', padding: '0.875rem 2rem', cursor: 'pointer' }}>
      {copied ? '✅ Link copied!' : '🔗 Share this Tutor'}
    </button>
  )
}
