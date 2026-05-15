'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert(data.error || 'Something went wrong')
        setLoading(false)
      }
    } catch {
      alert('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="btn-primary"
      style={{ width:'100%', justifyContent:'center', boxShadow:'0 4px 16px rgba(34,85,14,0.2)' }}
    >
      <Zap style={{ width:'1rem', height:'1rem' }} />
      {loading ? 'Redirecting to checkout...' : 'Upgrade to Premium →'}
    </button>
  )
}