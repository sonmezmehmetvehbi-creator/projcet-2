'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const AVATARS = ['🎓', '📚', '⚡', '🔥', '💡', '🧠', '🏆', '🎯', '🚀', '💪', '🦁', '🐯', '🦊', '🐉', '⚔️', '🛡️', '🌟', '👑', '🎮', '🎲']

export default function JoinIdentityClient({
  sessionId, quiz, currentUserId, defaultName, existing, initialCount,
}: {
  sessionId: string
  quiz: any
  currentUserId: string
  defaultName: string
  existing: { name: string; avatar: string; kicked: boolean } | null
  initialCount: number
}) {
  const router = useRouter()
  const color = quiz.banner_color || '#7c3aed'

  const initialPhase = existing?.kicked ? 'kicked' : existing ? 'joined' : 'identity'
  const [phase, setPhase] = useState<'identity' | 'joined' | 'kicked'>(initialPhase)
  const [name, setName] = useState(existing?.name?.slice(0, 15) || defaultName)
  const [avatar, setAvatar] = useState(existing?.avatar || '🎓')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [changingIcon, setChangingIcon] = useState(false)
  const [count, setCount] = useState(initialCount)

  const redirectedRef = useRef(false)

  const goToPlay = () => {
    if (redirectedRef.current) return
    redirectedRef.current = true
    router.push(`/arena/forge-quiz/live/${sessionId}/play`)
  }

  // Realtime: watch session status (start → play) + own kicked state + count.
  useEffect(() => {
    const supabase = createClient()
    const refreshCount = async () => {
      const { count: c } = await supabase
        .from('forge_quiz_live_players')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('is_kicked', false)
      if (typeof c === 'number') setCount(c)
    }
    const channel = supabase
      .channel(`live-join-${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'forge_quiz_live_sessions', filter: `id=eq.${sessionId}` }, (payload: any) => {
        if (payload.new?.status === 'active') goToPlay()
        else if (payload.new?.status === 'ended') router.push('/arena')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forge_quiz_live_players', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
        const row = payload.new
        if (row && row.user_id === currentUserId && row.is_kicked) { setPhase('kicked'); return }
        refreshCount()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, currentUserId])

  async function join() {
    if (!name.trim() || joining) return
    setJoining(true); setError('')
    try {
      const res = await fetch('/api/arena/forge-quiz/live/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, displayName: name.trim().slice(0, 15), avatarEmoji: avatar }),
      })
      const data = await res.json()
      if (data.kicked) { setPhase('kicked'); return }
      if (!data.playerId) throw new Error(data.error || 'Could not join')
      setPhase('joined')
    } catch (e: any) {
      setError(e.message || 'Could not join')
    } finally {
      setJoining(false)
    }
  }

  async function pickAvatar(a: string) {
    setAvatar(a)
    if (phase === 'joined') {
      try {
        await fetch('/api/arena/forge-quiz/live/update-avatar', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, avatarEmoji: a }),
        })
      } catch {}
    }
  }

  // ── Kicked ──
  if (phase === 'kicked') {
    return (
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '34rem', height: '20rem', borderRadius: '9999px', background: 'rgba(239,68,68,0.14)', filter: 'blur(120px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '28rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>🚫</div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem' }}>You&apos;ve been removed</h1>
          <p style={{ fontSize: '1rem', color: 'rgb(180,180,200)', marginBottom: '2rem' }}>The host removed you from this game.</p>
          <button onClick={() => router.push('/arena')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3.25rem', padding: '0 2rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
            Back to Arena →
          </button>
        </div>
      </div>
    )
  }

  // ── Waiting room (joined) ──
  if (phase === 'joined') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '9999px', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', animation: 'jiPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <Check style={{ width: '2.25rem', height: '2.25rem', color: 'rgb(74,222,128)' }} />
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem' }}>You&apos;re in! 🎉</h1>

        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', borderRadius: '1.25rem', border: `1px solid ${color}`, background: 'rgba(19,19,31,0.7)', padding: '1.5rem 2.5rem', marginBottom: '1.25rem', boxShadow: `0 0 40px ${color}33` }}>
          <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>{avatar}</span>
          <span style={{ marginTop: '0.5rem', fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{name}</span>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          {!changingIcon ? (
            <button onClick={() => setChangingIcon(true)} style={{ borderRadius: '0.75rem', border: '1px solid rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.1)', color: 'rgb(196,181,253)', fontWeight: 700, fontSize: '0.875rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>Change Icon</button>
          ) : (
            <div style={{ maxWidth: '22rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '0.35rem', marginBottom: '0.5rem' }}>
                {AVATARS.map((a) => (
                  <button key={a} onClick={() => pickAvatar(a)}
                    style={{ aspectRatio: '1', borderRadius: '0.5rem', border: avatar === a ? '2px solid rgb(124,58,237)' : '1px solid rgba(255,255,255,0.1)', background: avatar === a ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.03)', boxShadow: avatar === a ? '0 0 12px rgba(124,58,237,0.6)' : 'none', fontSize: '1.1rem', cursor: 'pointer' }}>{a}</button>
                ))}
              </div>
              <button onClick={() => setChangingIcon(false)} style={{ background: 'none', border: 'none', color: 'rgb(148,148,168)', fontSize: '0.8125rem', cursor: 'pointer' }}>Done</button>
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'rgb(196,181,253)', marginBottom: '0.5rem' }}>{count} player{count === 1 ? '' : 's'} in the lobby</p>
        <p style={{ color: 'rgb(148,148,168)', fontSize: '0.9375rem' }}>Waiting for host to start<span className="jidots"><span>.</span><span>.</span><span>.</span></span></p>

        <style>{`
          @keyframes jiPop { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
          .jidots span { animation: jiBlink 1.4s infinite both; } .jidots span:nth-child(2){animation-delay:0.2s} .jidots span:nth-child(3){animation-delay:0.4s}
          @keyframes jiBlink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        `}</style>
      </div>
    )
  }

  // ── Identity setup ──
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '27rem', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid rgba(124,58,237,0.35)', background: 'linear-gradient(135deg, rgb(13,13,25), rgb(18,18,35))', boxShadow: '0 0 60px rgba(124,58,237,0.22)' }}>
        <div style={{ height: '0.5rem', background: color }} />
        <div style={{ padding: '2rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: '0.25rem' }}>{quiz.title}</h1>
          <p style={{ color: 'rgb(148,148,168)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>Choose your name & icon</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(196,181,253)' }}>Choose your name</label>
            <span style={{ fontSize: '0.75rem', color: name.length >= 15 ? 'rgb(251,146,60)' : 'rgb(120,120,140)' }}>{name.length}/15</span>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 15))} maxLength={15}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.35)', color: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: '1.25rem', fontSize: '1rem' }} />

          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(196,181,253)', marginBottom: '0.5rem' }}>Pick an icon</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '0.35rem', marginBottom: '1.5rem' }}>
            {AVATARS.map((a) => (
              <button key={a} onClick={() => setAvatar(a)}
                style={{ aspectRatio: '1', borderRadius: '0.5rem', border: avatar === a ? '2px solid rgb(124,58,237)' : '1px solid rgba(255,255,255,0.1)', background: avatar === a ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.03)', boxShadow: avatar === a ? '0 0 12px rgba(124,58,237,0.6)' : 'none', fontSize: '1.1rem', cursor: 'pointer' }}>{a}</button>
            ))}
          </div>

          {error && <p style={{ color: 'rgb(248,113,113)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center' }}>{error}</p>}

          <button onClick={join} disabled={joining || !name.trim()}
            style={{ width: '100%', height: '3.25rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: joining ? 'wait' : 'pointer', opacity: name.trim() ? 1 : 0.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {joining ? <><Loader2 style={{ width: '1.15rem', height: '1.15rem' }} className="animate-spin" /> Joining…</> : 'Join Game →'}
          </button>
        </div>
      </div>
    </div>
  )
}
