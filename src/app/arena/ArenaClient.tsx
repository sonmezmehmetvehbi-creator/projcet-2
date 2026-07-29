'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

export default function ArenaClient({ profile }: { profile?: any }) {
  const router = useRouter()
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '40rem', height: '24rem', borderRadius: '9999px', background: 'rgba(245,158,11,0.12)', filter: 'blur(120px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: '48rem', margin: '0 auto', padding: '6.5rem 1.5rem 4rem' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '3.5rem', fontWeight: 800, color: 'white', lineHeight: 1.05, marginBottom: '0.75rem' }}>
            ⚔️ Arena
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'rgb(148,148,168)', maxWidth: '34rem', margin: '0 auto' }}>
            Build a quiz, challenge your friends, and top the leaderboard.
          </p>
        </div>

        {/* ⚡ Forge Quiz — Kahoot-style quiz builder */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '1.5rem', border: '1px solid rgba(245,158,11,0.4)', background: 'linear-gradient(135deg, rgba(146,64,14,0.4), rgba(19,19,31,0.9))', padding: '2.5rem 2rem', boxShadow: '0 0 50px rgba(245,158,11,0.15)' }}>
          <div style={{ position: 'absolute', top: '-4rem', left: '-4rem', width: '16rem', height: '16rem', borderRadius: '9999px', background: 'rgba(245,158,11,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', marginBottom: '1.25rem', fontSize: '1.75rem' }}>
              ⚡
            </div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Forge Quiz</h2>
            <p style={{ fontSize: '1rem', color: 'rgb(224,200,160)', lineHeight: 1.5, marginBottom: '1.75rem', maxWidth: '34rem' }}>
              Create a Kahoot-style quiz. Manual questions or AI-generated. Play live or share a link.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button type="button" onClick={() => router.push('/arena/forge-quiz/create')}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', padding: '0 1.75rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(245,158,11), rgb(251,191,36))', color: 'rgb(41,28,4)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 26px rgba(245,158,11,0.4)' }}>
                Create Quiz <ArrowRight style={{ width: '1.1rem', height: '1.1rem' }} />
              </button>
              <button type="button" onClick={() => setShowJoin((s) => !s)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', padding: '0 1.75rem', borderRadius: '0.875rem', border: '1px solid rgba(245,158,11,0.5)', background: 'rgba(245,158,11,0.08)', color: 'rgb(251,191,36)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Join with Code →
              </button>
            </div>

            {showJoin && (
              <form onSubmit={(e) => { e.preventDefault(); if (joinCode.trim()) router.push(`/arena/forge-quiz/join?code=${encodeURIComponent(joinCode.trim().toUpperCase())}`) }}
                style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', maxWidth: '22rem' }}>
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter room code" maxLength={6} autoFocus
                  style={{ flex: 1, padding: '0.7rem 0.9rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,158,11,0.4)', color: 'white', fontSize: '1rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', outline: 'none', boxSizing: 'border-box' }} />
                <button type="submit" style={{ borderRadius: '0.75rem', border: 'none', background: 'rgb(245,158,11)', color: 'rgb(41,28,4)', fontWeight: 800, padding: '0 1.25rem', cursor: 'pointer' }}>Join</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
