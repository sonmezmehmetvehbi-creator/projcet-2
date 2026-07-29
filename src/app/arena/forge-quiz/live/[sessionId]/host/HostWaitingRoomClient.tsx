'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Play, Timer, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// NOTE: live player events require the table to be in the realtime publication:
// -- ALTER PUBLICATION supabase_realtime ADD TABLE forge_quiz_live_players;

type Player = { id: string; user_id: string | null; display_name: string; avatar_emoji: string }

export default function HostWaitingRoomClient({
  session, quiz, initialPlayers,
}: {
  session: any
  quiz: any
  initialPlayers: Player[]
}) {
  const router = useRouter()
  const sessionId = session.id
  const color = quiz.banner_color || '#7c3aed'

  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [removing, setRemoving] = useState<Set<string>>(new Set())
  const [targetAt, setTargetAt] = useState<string | null>(session.countdown_target_at ?? null)
  const [now, setNow] = useState(() => Date.now())
  const [cdMin, setCdMin] = useState(0)
  const [cdSec, setCdSec] = useState(30)
  const [starting, setStarting] = useState(false)
  const [cdCancelled, setCdCancelled] = useState(false)

  const startedRef = useRef(false)

  const count = players.length
  const full = session.max_players ? count >= session.max_players : false

  // Seed once (avoid overwriting the live list on later prop changes).
  useEffect(() => {
    if (players.length === 0 && initialPlayers.length > 0) setPlayers(initialPlayers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goToGame = () => {
    if (startedRef.current) return
    startedRef.current = true
    router.push(`/arena/forge-quiz/live/${sessionId}/host/game`)
  }

  // Realtime: player grid (incremental) + session (status/countdown).
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`live-host-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forge_quiz_live_players', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
        console.log('[Realtime] new live player:', payload.new)
        const row = payload.new
        if (row.is_kicked) return
        setCdCancelled(false)
        setPlayers((prev) => (prev.some((p) => p.id === row.id) ? prev : [...prev, row as Player]))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'forge_quiz_live_players', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
        const row = payload.new
        setPlayers((prev) => {
          if (row.is_kicked) return prev.filter((p) => p.id !== row.id)
          const exists = prev.some((p) => p.id === row.id)
          return exists ? prev.map((p) => (p.id === row.id ? { ...p, ...row } : p)) : [...prev, row as Player]
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'forge_quiz_live_players', filter: `session_id=eq.${sessionId}` }, (payload: any) => {
        const id = payload.old?.id
        if (id) setPlayers((prev) => prev.filter((p) => p.id !== id))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'forge_quiz_live_sessions', filter: `id=eq.${sessionId}` }, (payload: any) => {
        const s = payload.new
        setTargetAt(s.countdown_target_at ?? null)
        if (s.status === 'active') goToGame()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Ticking clock for the countdown.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  const remaining = targetAt ? Math.max(0, Math.ceil((new Date(targetAt).getTime() - now) / 1000)) : null

  // Auto-start when the countdown hits zero — unless nobody has joined, in
  // which case cancel the countdown rather than start an empty game.
  useEffect(() => {
    if (remaining === 0 && targetAt && !startedRef.current) {
      if (count < 1) {
        setCdCancelled(true)
        setCountdown(0)
        return
      }
      startGame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, targetAt, count])

  async function setCountdown(seconds: number) {
    setTargetAt(seconds > 0 ? new Date(Date.now() + seconds * 1000).toISOString() : null)
    try {
      await fetch('/api/arena/forge-quiz/live/set-countdown', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, seconds }),
      })
    } catch {}
  }

  async function startGame() {
    if (starting || startedRef.current || count < 1) return
    setStarting(true)
    try {
      const res = await fetch('/api/arena/forge-quiz/live/start-game', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) { setStarting(false); return }
      goToGame()
    } catch { setStarting(false) }
  }

  async function kick(p: Player) {
    setRemoving((s) => new Set(s).add(p.id))
    try {
      await fetch('/api/arena/forge-quiz/live/kick-player', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, playerId: p.id }),
      })
    } catch {}
    setTimeout(() => {
      setPlayers((ps) => ps.filter((x) => x.id !== p.id))
      setRemoving((s) => { const n = new Set(s); n.delete(p.id); return n })
    }, 320)
  }

  // Cards shrink as more players join so they fit on one screen.
  const cardRem = count > 48 ? 4.2 : count > 24 ? 5.2 : count > 12 ? 6.4 : 8
  const emojiRem = cardRem * 0.42
  const mm = Math.floor((remaining ?? 0) / 60)
  const ss = (remaining ?? 0) % 60

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ height: '0.5rem', background: color }} />
      <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', width: '48rem', height: '26rem', borderRadius: '9999px', background: `${color}22`, filter: 'blur(140px)', pointerEvents: 'none' }} />

      {/* Countdown panel, top-right */}
      <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 40, width: '15rem', borderRadius: '1rem', border: '1px solid rgba(124,58,237,0.35)', background: 'rgba(19,19,31,0.9)', backdropFilter: 'blur(8px)', padding: '1rem', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(196,181,253)', marginBottom: '0.625rem' }}>
          <Timer style={{ width: '0.9rem', height: '0.9rem' }} /> Start in
        </div>
        {remaining != null && remaining > 0 ? (
          <>
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '2rem', fontWeight: 900, color: 'white', textAlign: 'center', lineHeight: 1 }}>{mm}:{String(ss).padStart(2, '0')}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button onClick={() => setCountdown(0)} style={{ flex: 1, borderRadius: '0.5rem', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(239,68,68,0.12)', color: 'rgb(252,165,165)', fontWeight: 700, fontSize: '0.75rem', padding: '0.4rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setCountdown((remaining ?? 0) + 30)} style={{ flex: 1, borderRadius: '0.5rem', border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.12)', color: 'rgb(196,181,253)', fontWeight: 700, fontSize: '0.75rem', padding: '0.4rem', cursor: 'pointer' }}>+30s</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.625rem' }}>
              <input type="number" min={0} max={59} value={cdMin} onChange={(e) => setCdMin(Math.max(0, Number(e.target.value) || 0))} style={cdInput} />
              <span style={{ color: 'rgb(148,148,168)', fontWeight: 800 }}>:</span>
              <input type="number" min={0} max={59} value={cdSec} onChange={(e) => setCdSec(Math.min(59, Math.max(0, Number(e.target.value) || 0)))} style={cdInput} />
            </div>
            <button onClick={() => setCountdown(cdMin * 60 + cdSec)} disabled={cdMin * 60 + cdSec <= 0 || count < 1}
              title={count < 1 ? 'Waiting for at least 1 player to join' : ''}
              style={{ width: '100%', borderRadius: '0.5rem', border: 'none', background: 'rgb(124,58,237)', color: 'white', fontWeight: 800, fontSize: '0.8125rem', padding: '0.5rem', cursor: count < 1 ? 'not-allowed' : 'pointer', opacity: (cdMin * 60 + cdSec <= 0 || count < 1) ? 0.5 : 1 }}>Set Countdown</button>
            {count < 1 && <p style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: 'rgb(148,148,168)', textAlign: 'center' }}>Waiting for at least 1 player to join</p>}
            {cdCancelled && <p style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: 'rgb(252,165,165)', textAlign: 'center', fontWeight: 700 }}>Countdown cancelled — no players joined</p>}
          </>
        )}
      </div>

      <div style={{ position: 'relative', maxWidth: '68rem', margin: '0 auto', padding: '3.5rem 1.5rem 8rem', textAlign: 'center' }}>
        {/* Header */}
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '1.75rem' }}>{quiz.title}</h1>

        {/* Massive join code */}
        <p style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgb(196,181,253)', marginBottom: '0.5rem' }}>
          JOIN AT <span style={{ color: 'white' }}>aceforge.app/arena</span> — ENTER CODE:
        </p>
        <p className="hp-code" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 'clamp(3rem, 12vw, 6rem)', fontWeight: 900, letterSpacing: '0.2em', color: 'white', lineHeight: 1, marginBottom: '2.5rem', textShadow: `0 0 40px ${color}` }}>
          {session.room_code}
        </p>

        {/* Player count */}
        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '1.5rem' }}>
          {count} player{count === 1 ? '' : 's'} joined{session.max_players ? <span style={{ color: 'rgb(148,148,168)', fontWeight: 700, fontSize: '1rem' }}> · {count} / {session.max_players}</span> : null}
          {full && <span style={{ marginLeft: '0.5rem', color: 'rgb(251,146,60)', fontSize: '0.9375rem', fontWeight: 800 }}>FULL</span>}
        </p>

        {/* Player grid */}
        {count === 0 ? (
          <p style={{ color: 'rgb(148,148,168)', fontSize: '1.0625rem' }}>Waiting for players to join…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${cardRem}rem, 1fr))`, gap: '0.75rem', justifyContent: 'center' }}>
            {players.map((p) => (
              <div key={p.id} className="hp-card" style={{ position: 'relative', borderRadius: '1rem', border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(19,19,31,0.8)', padding: '0.75rem 0.5rem', animation: 'hpPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both', opacity: removing.has(p.id) ? 0 : 1, transform: removing.has(p.id) ? 'scale(0.6)' : 'none', transition: 'opacity 0.3s ease, transform 0.3s ease' }}>
                <div style={{ fontSize: `${emojiRem}rem`, lineHeight: 1 }}>{p.avatar_emoji}</div>
                <div style={{ marginTop: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</div>
                <button className="hp-kick" onClick={() => kick(p)} title={`Kick ${p.display_name}`}
                  style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', width: '1.5rem', height: '1.5rem', borderRadius: '9999px', border: 'none', background: 'rgb(220,38,38)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s ease' }}>
                  <X style={{ width: '0.85rem', height: '0.85rem' }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start button, bottom center */}
      <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={startGame} disabled={count < 1 || starting}
          title={count < 1 ? 'Waiting for at least 1 player to join' : ''}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.75rem', padding: '0 3rem', borderRadius: '9999px', border: 'none', background: count < 1 ? 'rgba(255,255,255,0.08)' : 'linear-gradient(90deg, rgb(22,163,74), rgb(34,197,94))', color: count < 1 ? 'rgb(120,120,140)' : 'white', fontWeight: 900, fontSize: '1.25rem', cursor: count < 1 ? 'not-allowed' : 'pointer', boxShadow: count < 1 ? 'none' : '0 0 40px rgba(34,197,94,0.45)' }}>
          {starting ? <><Loader2 style={{ width: '1.35rem', height: '1.35rem' }} className="animate-spin" /> Starting…</> : <><Play style={{ width: '1.35rem', height: '1.35rem' }} /> Start Game →</>}
        </button>
        {count < 1 && <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(148,148,168)' }}>Waiting for at least 1 player to join</span>}
      </div>

      <style>{`
        @keyframes hpPop { 0% { opacity: 0; transform: scale(0.3) rotate(-8deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
        @keyframes hpGlow { 0%, 100% { text-shadow: 0 0 30px ${color}; } 50% { text-shadow: 0 0 55px ${color}, 0 0 20px ${color}; } }
        .hp-code { animation: hpGlow 2.2s ease-in-out infinite; }
        .hp-card:hover .hp-kick { opacity: 1; }
      `}</style>
    </div>
  )
}

const cdInput: React.CSSProperties = { width: '3rem', textAlign: 'center', padding: '0.4rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(124,58,237,0.35)', color: 'white', fontWeight: 800, outline: 'none' }
