'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Suspense } from 'react'

function ConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function handleConfirm() {
      const code = searchParams.get('code')
      const next = searchParams.get('next') ?? '/dashboard'

      if (!code) {
        router.push('/login?error=no_code')
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Confirm error:', error)
        router.push('/login?error=confirm_error')
      } else {
        router.push(next)
        router.refresh()
      }
    }

    handleConfirm()
  }, [])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'2.5rem', height:'2.5rem', border:'3px solid rgba(34,85,14,0.2)', borderTop:'3px solid rgb(34,85,14)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 1rem' }} />
        <p style={{ color:'rgb(107,107,88)', fontSize:'0.9375rem' }}>Signing you in...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><p>Loading...</p></div>}>
      <ConfirmInner />
    </Suspense>
  )
}
