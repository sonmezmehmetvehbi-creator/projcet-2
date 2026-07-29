'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function JoinLiveClient() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function submit() {
    const c = code.trim().toUpperCase()
    if (c.length < 4 || joining) return
    setJoining(true); setError('')
    try {
      const res = await fetch(`/api/arena/forge-quiz/live/find-session?code=${encodeURIComponent(c)}`)
      const data = await res.json()
      if (!res.ok || !data.sessionId) throw new Error(data.error || 'Game not found or already started')
      router.push(`/arena/forge-quiz/live/${data.sessionId}/join`)
    } catch (e: any) {
      setError(e.message || 'Game not found or already started')
      setShake(true); setTimeout(() => setShake(false), 500)
      setJoining(false)
    }
  }

  // OTP-style boxes reflecting the underlying value.
  const boxes = Array.from({ length: 6 }, (_, i) => code[i] ?? '')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '34rem', height: '20rem', borderRadius: '9999px', background: 'rgba(124,58,237,0.14)', filter: 'blur(120px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '30rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎮</div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Join a Live Game</h1>
        <p style={{ color: 'rgb(148,148,168)', marginBottom: '2rem' }}>Enter the 6-character code from the host&apos;s screen.</p>

        <div onClick={() => inputRef.current?.focus()}
          style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'text', animation: shake ? 'hjShake 0.5s ease' : undefined }}>
          {boxes.map((ch, i) => {
            const activeBox = i === code.length && code.length < 6
            return (
              <div key={i} style={{ width: '3rem', height: '3.75rem', borderRadius: '0.75rem', border: `2px solid ${error ? 'rgba(248,113,113,0.7)' : activeBox ? 'rgb(124,58,237)' : 'rgba(124,58,237,0.35)'}`, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-monospace, monospace', fontSize: '1.75rem', fontWeight: 900, color: 'white' }}>{ch}</div>
            )
          })}
        </div>

        {/* Hidden real input drives the boxes */}
        <input ref={inputRef} value={code} autoFocus inputMode="text" maxLength={6}
          onChange={(e) => { setError(''); setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)) }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }} />

        {error && <p style={{ color: 'rgb(248,113,113)', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1.25rem' }}>{error}</p>}

        <button onClick={submit} disabled={joining || code.length < 4}
          style={{ width: '100%', maxWidth: '20rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.5rem', borderRadius: '0.875rem', border: 'none', background: code.length >= 4 ? 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))' : 'rgba(255,255,255,0.06)', color: code.length >= 4 ? 'white' : 'rgb(120,120,140)', fontWeight: 800, fontSize: '1.0625rem', cursor: code.length >= 4 ? 'pointer' : 'not-allowed', boxShadow: code.length >= 4 ? '0 0 28px rgba(124,58,237,0.4)' : 'none' }}>
          {joining ? <><Loader2 style={{ width: '1.15rem', height: '1.15rem' }} className="animate-spin" /> Finding…</> : <>Join Game <ArrowRight style={{ width: '1.15rem', height: '1.15rem' }} /></>}
        </button>

        <div style={{ marginTop: '1.5rem' }}>
          <button onClick={() => router.push('/arena')} style={{ background: 'none', border: 'none', color: 'rgb(148,148,168)', fontSize: '0.875rem', cursor: 'pointer' }}>← Back to Arena</button>
        </div>
      </div>

      <style>{`@keyframes hjShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }`}</style>
    </div>
  )
}
