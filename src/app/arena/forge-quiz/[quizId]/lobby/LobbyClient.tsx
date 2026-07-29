'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Users, Clock, X, Play, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Player = {
  id: string
  user_id: string
  display_name: string
  avatar_emoji: string
  total_score: number
  completed: boolean
}

export default function LobbyClient({
  quiz,
  questionCount,
  initialPlayers,
  currentUserId,
}: {
  quiz: any
  questionCount: number
  initialPlayers: Player[]
  currentUserId: string
}) {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)
  const [removing, setRemoving] = useState<Set<string>>(new Set())

  const quizId = quiz.id
  const isLive = quiz.play_mode === 'live'
  const isCreator = currentUserId === quiz.creator_id
  const color = quiz.banner_color || '#7c3aed'
  const me = players.find((p) => p.user_id === currentUserId)
  const hasPlayed = !!me?.completed

  // Self-paced expiry countdown.
  const [timeLeft, setTimeLeft] = useState('')
  const [urgency, setUrgency] = useState<'green' | 'orange' | 'red' | 'ended'>('green')
  useEffect(() => {
    if (isLive || !quiz.expires_at) return
    const update = () => {
      const diff = new Date(quiz.expires_at).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Ended'); setUrgency('ended'); return }
      const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`)
      setUrgency(diff < 10 * 60 * 1000 ? 'red' : diff < 60 * 60 * 1000 ? 'orange' : 'green')
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [isLive, quiz.expires_at])

  const myRank = hasPlayed
    ? players.filter((p) => p.completed).sort((a, b) => b.total_score - a.total_score).findIndex((p) => p.user_id === currentUserId) + 1
    : 0
  const expired = !isLive && quiz.expires_at ? new Date(quiz.expires_at).getTime() <= Date.now() : quiz.status === 'ended'

  // Seed from the server's initial list once on mount only. We deliberately do
  // NOT sync initialPlayers on later prop changes — doing so would overwrite
  // the live, incrementally-updated list.
  useEffect(() => {
    if (players.length === 0 && initialPlayers.length > 0) setPlayers(initialPlayers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Realtime: apply INSERT/UPDATE events incrementally so the list is never
  // wiped by a full re-fetch (which could momentarily return empty).
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`forge-quiz-players-${quizId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forge_quiz_players', filter: `quiz_id=eq.${quizId}` }, (payload) => {
        const row = payload.new as any
        if (row.is_kicked) return
        setPlayers((prev) => (prev.some((p) => p.id === row.id) ? prev : [...prev, row as Player]))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'forge_quiz_players', filter: `quiz_id=eq.${quizId}` }, (payload) => {
        const row = payload.new as any
        setPlayers((prev) => {
          // A kick removes the player from the visible list.
          if (row.is_kicked) return prev.filter((p) => p.id !== row.id)
          const exists = prev.some((p) => p.id === row.id)
          return exists ? prev.map((p) => (p.id === row.id ? { ...p, ...row } : p)) : [...prev, row as Player]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [quizId])

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/arena/forge-quiz/${quizId}/lobby` : ''
  async function copyLink() {
    try { await navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  async function startGame() {
    setStarting(true)
    try {
      await fetch('/api/arena/forge-quiz/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId }),
      })
      router.push(`/arena/forge-quiz/${quizId}/host`)
    } catch {
      setStarting(false)
    }
  }

  async function kick(p: Player) {
    setRemoving((s) => new Set(s).add(p.id))
    try {
      await fetch('/api/arena/forge-quiz/kick-player', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId, playerId: p.id }),
      })
    } catch {}
    setTimeout(() => {
      setPlayers((ps) => ps.filter((x) => x.id !== p.id))
      setRemoving((s) => { const n = new Set(s); n.delete(p.id); return n })
    }, 300)
  }

  // Live rooms show a status; self-paced shows an expiry countdown.
  const showCountdown = !isLive && !!quiz.expires_at
  const urgencyColor = urgency === 'red' ? 'rgb(248,113,113)' : urgency === 'orange' ? 'rgb(251,146,60)' : urgency === 'ended' ? 'rgb(148,148,168)' : 'rgb(74,222,128)'
  const pillColor = showCountdown ? urgencyColor : 'rgb(196,181,253)'
  const pillText = showCountdown
    ? (urgency === 'ended' ? 'Ended' : `⏱ Ends in ${timeLeft}`)
    : isLive ? (quiz.status === 'playing' ? '🎮 Live' : '⏱ Active') : (quiz.status === 'ended' ? 'Ended' : '🔗 Open')

  return (
    <div style={{ maxWidth: '44rem', margin: '0 auto', padding: '5.5rem 1.5rem 4rem' }}>
      {/* Status pill / countdown, top-right */}
      <div style={{ position: 'fixed', top: '4.5rem', right: '1.25rem', zIndex: 40, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', borderRadius: '9999px', background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(8px)', border: `1px solid ${pillColor}66`, color: pillColor, fontWeight: 800, fontSize: '0.8125rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
        <Clock style={{ width: '0.9rem', height: '0.9rem' }} /> {pillText}
      </div>

      {/* Banner accent + header */}
      <div style={{ borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(19,19,31,0.7)', marginBottom: '1.5rem' }}>
        <div style={{ height: '0.5rem', background: color }} />
        <div style={{ padding: '1.75rem 2rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '0.375rem' }}>{quiz.title}</h1>
          <p style={{ color: 'rgb(148,148,168)', fontSize: '0.875rem' }}>Created by {quiz.creator_name}</p>
          {quiz.welcome_message && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9375rem', marginTop: '0.75rem' }}>{quiz.welcome_message}</p>}
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Questions', value: `${questionCount} questions` },
          { label: 'Time', value: `${quiz.time_per_question}s per question` },
          { label: 'Mode', value: isLive ? 'Live Room 🎮' : 'Self-Paced 🔗' },
        ].map((d) => (
          <div key={d.label} style={{ borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '0.85rem 1rem' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgb(148,148,168)' }}>{d.label}</p>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'white', marginTop: '0.15rem' }}>{d.value}</p>
          </div>
        ))}
      </div>

      {/* ── Live Room ── */}
      {isLive && (
        <>
          {quiz.room_code && (
            <div style={{ textAlign: 'center', borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(19,19,31,0.7)', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 0 40px rgba(124,58,237,0.2)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgb(196,181,253)', marginBottom: '0.75rem' }}>Join Code</p>
              <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '3.5rem', fontWeight: 900, letterSpacing: '0.25em', color: 'white', lineHeight: 1, textShadow: '0 0 30px rgba(124,58,237,0.8)' }}>{quiz.room_code}</p>
              <p style={{ fontSize: '0.8125rem', color: 'rgb(148,148,168)', marginTop: '0.75rem' }}>Players join at the Arena with this code</p>
            </div>
          )}

          <div style={{ borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Users style={{ width: '1.1rem', height: '1.1rem', color: 'rgb(196,181,253)' }} />
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Players joined ({players.length})</h2>
            </div>
            {players.length === 0 ? (
              <p style={{ color: 'rgb(148,148,168)', fontSize: '0.9375rem' }}>Waiting for players to join…</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
                {players.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.75rem', opacity: removing.has(p.id) ? 0 : 1, transition: 'opacity 0.3s ease', animation: 'slidein 0.3s ease' }}>
                    <span style={{ fontSize: '1.25rem' }}>{p.avatar_emoji}</span>
                    <span style={{ flex: 1, minWidth: 0, color: 'white', fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</span>
                    {p.user_id === currentUserId && <span style={{ fontSize: '0.5625rem', fontWeight: 800, color: 'rgb(196,181,253)' }}>YOU</span>}
                    {isCreator && p.user_id !== quiz.creator_id && (
                      <button type="button" onClick={() => kick(p)} title={`Kick ${p.display_name}`}
                        style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0, borderRadius: '0.375rem', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(239,68,68,0.12)', color: 'rgb(248,113,113)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X style={{ width: '0.8rem', height: '0.8rem' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isCreator ? (
            <button type="button" onClick={startGame} disabled={starting}
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.5rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(22,163,74), rgb(34,197,94))', color: 'white', fontWeight: 800, fontSize: '1.0625rem', cursor: starting ? 'wait' : 'pointer', boxShadow: '0 0 30px rgba(34,197,94,0.4)' }}>
              {starting ? <><Loader2 style={{ width: '1.15rem', height: '1.15rem' }} className="animate-spin" /> Starting…</> : <><Play style={{ width: '1.15rem', height: '1.15rem' }} /> Start Game →</>}
            </button>
          ) : (
            <div style={{ textAlign: 'center', borderRadius: '0.875rem', border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.08)', padding: '1rem', color: 'rgb(196,181,253)', fontWeight: 700 }}>
              Waiting for host to start<span className="qdots"><span>.</span><span>.</span><span>.</span></span>
            </div>
          )}
        </>
      )}

      {/* ── Self-Paced ── */}
      {!isLive && (
        <>
          {!hasPlayed && !expired && (
            <button type="button" onClick={() => router.push(`/arena/forge-quiz/${quizId}/play`)}
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.5rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, fontSize: '1.0625rem', cursor: 'pointer', boxShadow: '0 0 30px rgba(124,58,237,0.4)', marginBottom: '1.5rem' }}>
              <Play style={{ width: '1.15rem', height: '1.15rem' }} /> Join &amp; Play →
            </button>
          )}

          {hasPlayed && (
            <div style={{ borderRadius: '1.25rem', border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.08)', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'rgb(251,191,36)', fontWeight: 800, fontSize: '1rem', marginBottom: '0.875rem' }}>
                You scored {me?.total_score} · Rank #{myRank} of {players.filter((p) => p.completed).length}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                {quiz.allow_replay && !expired && (
                  <button type="button" onClick={() => router.push(`/arena/forge-quiz/${quizId}/play`)}
                    style={{ flex: '1 1 10rem', height: '3rem', borderRadius: '0.875rem', border: '1px solid rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.12)', color: 'rgb(196,181,253)', fontWeight: 800, cursor: 'pointer' }}>
                    Practice Again 🔄
                  </button>
                )}
                <button type="button" onClick={() => router.push(`/arena/forge-quiz/${quizId}/results`)}
                  style={{ flex: '1 1 10rem', height: '3rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
                  View My Results →
                </button>
              </div>
            </div>
          )}

          <div style={{ borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Users style={{ width: '1.1rem', height: '1.1rem', color: 'rgb(196,181,253)' }} />
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>Players ({players.filter((p) => p.completed).length})</h2>
            </div>
            {players.filter((p) => p.completed).length === 0 ? (
              <p style={{ color: 'rgb(148,148,168)', fontSize: '0.9375rem' }}>No one has played yet — be the first!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {players.filter((p) => p.completed).sort((a, b) => b.total_score - a.total_score).map((p, i) => {
                  const isMe = p.user_id === currentUserId
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.875rem', padding: '0.7rem 1rem', border: isMe ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.06)', background: isMe ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)' }}>
                      <span style={{ width: '1.5rem', textAlign: 'center', fontWeight: 800, color: 'rgb(180,180,200)' }}>{i + 1}</span>
                      <span style={{ fontSize: '1.25rem' }}>{p.avatar_emoji}</span>
                      <span style={{ flex: 1, minWidth: 0, color: 'white', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}{isMe && <span style={{ marginLeft: '0.4rem', fontSize: '0.625rem', fontWeight: 800, color: 'rgb(196,181,253)' }}>YOU</span>}</span>
                      <span style={{ fontWeight: 900, color: 'rgb(251,191,36)' }}>{p.total_score}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {isCreator && (
            <div style={{ borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '1.25rem' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(196,181,253)', marginBottom: '0.75rem' }}>Share this quiz</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.8125rem', color: 'rgb(180,180,200)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareLink}</span>
                <button onClick={copyLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', borderRadius: '0.625rem', background: 'rgb(124,58,237)', color: 'white', border: 'none', padding: '0.5rem 0.875rem', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>
                  <Copy style={{ width: '0.9rem', height: '0.9rem' }} /> {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .qdots span { animation: qdotBlink 1.4s infinite both; }
        .qdots span:nth-child(2) { animation-delay: 0.2s; }
        .qdots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes qdotBlink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
      `}</style>
    </div>
  )
}
