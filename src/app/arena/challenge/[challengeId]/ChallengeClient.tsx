'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

export default function ChallengeClient({ challenge, profile }: { challenge: any; profile: any }) {
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const isGuest = !profile

  // Let guests see the challenge first, then prompt them to sign up.
  useEffect(() => {
    if (isGuest) {
      const timer = setTimeout(() => setShowAuthModal(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [isGuest])

  const startParams = new URLSearchParams({
    subject: challenge.subject ?? '',
    topic: challenge.topic ?? '',
    difficulty: challenge.difficulty ?? 'medium',
    challengeId: challenge.id,
    challengerName: challenge.challenger_name ?? 'A friend',
    challengerScore: String(challenge.challenger_score ?? 0),
  }).toString()

  function acceptChallenge() {
    if (isGuest) { setShowAuthModal(true); return }
    router.push(`/arena/speed-round?${startParams}`)
  }

  const challengerName = challenge.challenger_name ?? 'A friend'
  const score = challenge.challenger_score ?? 0

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <Navbar profile={profile} />
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '40rem', height: '24rem', borderRadius: '9999px', background: 'rgba(124,58,237,0.14)', filter: 'blur(120px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '36rem', margin: '0 auto', padding: '7rem 1.5rem 4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎯</div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.25rem', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '1rem' }}>
            {challengerName} challenges you!
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'rgb(180,180,200)', marginBottom: '2rem' }}>
            Beat their score on <strong style={{ color: 'white' }}>{challenge.subject}</strong>
            {challenge.topic ? <> · <span style={{ color: 'rgb(196,181,253)' }}>{challenge.topic}</span></> : null}{' '}
            <span style={{ color: 'rgb(196,181,253)' }}>({challenge.difficulty})</span> Speed Round.
          </p>

          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', borderRadius: '1.5rem', border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.06)', padding: '1.75rem 3rem', marginBottom: '1.25rem', boxShadow: '0 0 40px rgba(245,158,11,0.15)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgb(245,158,11)', marginBottom: '0.5rem' }}>
              Score to Beat
            </span>
            <span style={{ fontSize: '4rem', fontWeight: 900, color: 'rgb(251,191,36)', lineHeight: 1, textShadow: '0 0 30px rgba(245,158,11,0.5)' }}>
              {score}
            </span>
          </div>

          <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '2rem' }}>
            Can you beat {score}?
          </p>

          <div>
            <button
              onClick={acceptChallenge}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.5rem', padding: '0 2.5rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, fontSize: '1.0625rem', cursor: 'pointer', boxShadow: '0 0 30px rgba(124,58,237,0.45)' }}
            >
              Accept Challenge →
            </button>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/arena" style={{ fontSize: '0.875rem', color: 'rgb(148,148,168)', textDecoration: 'none' }}>
              ← Back to Arena
            </Link>
          </div>

          {/* Blurred game preview for guests — hints at what's behind the login. */}
          {isGuest && (
            <div style={{ position: 'relative', marginTop: '2.5rem' }}>
              <div style={{ filter: 'blur(7px)', opacity: 0.6, pointerEvents: 'none', userSelect: 'none' }} aria-hidden>
                <div style={{ borderRadius: '1.5rem', border: '1px solid rgba(124,58,237,0.3)', background: 'linear-gradient(180deg, rgb(19,19,31), rgb(13,13,24))', padding: '2rem', boxShadow: '0 0 40px rgba(124,58,237,0.15)' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1.25rem' }}>
                    Which of these is the correct answer?
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {['Option A', 'Option B', 'Option C', 'Option D'].map((o) => (
                      <div key={o} style={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '1rem', color: 'rgb(200,200,215)', fontWeight: 600 }}>
                        {o}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(196,181,253)', background: 'rgba(10,10,20,0.7)', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid rgba(124,58,237,0.35)' }}>
                  🔒 Sign in to play
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guest auth modal */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
            animation: 'slideup 0.4s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgb(13,13,25), rgb(18,18,35))',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: '1.5rem',
              padding: '2.5rem',
              maxWidth: '24rem',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(124,58,237,0.2)',
              animation: 'slideup 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <button
              onClick={() => setShowAuthModal(false)}
              aria-label="Close"
              style={{ position: 'absolute', top: '1rem', right: '1rem', width: '2rem', height: '2rem', borderRadius: '0.5rem', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgb(180,180,200)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X style={{ width: '1.1rem', height: '1.1rem' }} />
            </button>

            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚔️</div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '0.75rem' }}>
              {challengerName} challenged you!
            </h2>
            <p style={{ fontSize: '0.9375rem', color: 'rgb(180,180,200)', marginBottom: '1.75rem' }}>
              Create a free account to accept this challenge and compete!
            </p>

            <Link
              href={`/signup?challenge=${challenge.id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', borderRadius: '0.875rem', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}
            >
              Create Free Account →
            </Link>

            <div style={{ marginTop: '1rem' }}>
              <Link href={`/login?challenge=${challenge.id}`} style={{ fontSize: '0.875rem', color: 'rgb(196,181,253)', textDecoration: 'none', fontWeight: 600 }}>
                Already have an account? Sign in →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
