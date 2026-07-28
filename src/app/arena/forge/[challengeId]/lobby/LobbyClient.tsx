'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2, Users, Clock, Lock, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Participant = {
  id: string
  user_id: string
  display_name: string
  avatar_emoji: string
  score: number
  correct: number
  attempted: number
  best_streak: number
  completion_time_seconds: number | null
  completed: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']

function useCountdown(expiresAt?: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!expiresAt) return { expired: false, label: '' }
  const ms = new Date(expiresAt).getTime() - now
  if (ms <= 0) return { expired: true, label: 'Ended' }
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  const label = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`
  return { expired: false, label }
}

export default function LobbyClient({ challengeId, isLoggedIn = true }: { challengeId: string; isLoggedIn?: boolean }) {
  const router = useRouter()
  const [challenge, setChallenge] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<Participant[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [pwPrompt, setPwPrompt] = useState(false)
  const [pw, setPw] = useState('')

  // Creator moderation (kick) state.
  const [kickTarget, setKickTarget] = useState<string | null>(null)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [kickedModal, setKickedModal] = useState(false)
  const [kickedBanner, setKickedBanner] = useState(false)
  const currentUserIdRef = useRef('')

  useEffect(() => { currentUserIdRef.current = currentUserId }, [currentUserId])

  // "You've been removed" banner when arriving from a blocked play attempt.
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('kicked') === 'true') {
      setKickedBanner(true)
    }
  }, [])

  // Always-visible expiry countdown (top-right pill).
  const [timeLeft, setTimeLeft] = useState('')
  const [urgency, setUrgency] = useState<'green' | 'orange' | 'red' | 'ended'>('green')
  useEffect(() => {
    if (!challenge?.expires_at) return
    const update = () => {
      const now = new Date()
      const expiry = new Date(challenge.expires_at)
      const diff = expiry.getTime() - now.getTime()
      if (diff <= 0) { setTimeLeft('Ended'); setUrgency('ended'); return }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      else setTimeLeft(`${minutes}m ${seconds}s`)
      setUrgency(diff < 10 * 60 * 1000 ? 'red' : diff < 60 * 60 * 1000 ? 'orange' : 'green')
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [challenge?.expires_at])

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/arena/forge/${challengeId}`)
      const data = await res.json()
      if (data.challenge) {
        setChallenge(data.challenge)
        setLeaderboard(data.leaderboard ?? [])
        setCurrentUserId(data.currentUserId ?? '')
      }
    } catch {}
    setLoading(false)
  }, [challengeId])

  useEffect(() => { load() }, [load])

  // Realtime + polling fallback so the lobby stays live even if the realtime
  // publication isn't enabled for forge_participants.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`forge_${challengeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forge_participants', filter: `challenge_id=eq.${challengeId}` }, (payload: any) => {
        const row = payload.new
        if (row && row.is_kicked && row.user_id === currentUserIdRef.current) {
          setKickedModal(true)
        }
        load()
      })
      .subscribe()
    const poll = setInterval(load, 5000)
    return () => { supabase.removeChannel(channel); clearInterval(poll) }
  }, [challengeId, load])

  const { expired, label } = useCountdown(challenge?.expires_at)

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/arena/forge/${challengeId}/lobby` : ''
  const shareText = challenge ? `${challenge.creator_name} invites you to "${challenge.title}" — a ${challenge.subject} Forge Challenge on AceForge! Can you top the leaderboard? ⚡` : ''

  async function copyLink() {
    try { await navigator.clipboard.writeText(`${shareText}\n${shareLink}`); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  async function doKick(p: Participant) {
    setKickTarget(null)
    // Optimistic fade-out.
    setRemovingIds((s) => new Set(s).add(p.id))
    setToast(`Kicked ${p.display_name}`)
    setTimeout(() => setToast(null), 2200)
    try {
      await fetch('/api/arena/forge/kick-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, participantId: p.id }),
      })
    } catch {}
    setTimeout(() => {
      setLeaderboard((lb) => lb.filter((x) => x.id !== p.id))
      setRemovingIds((s) => { const n = new Set(s); n.delete(p.id); return n })
    }, 320)
  }

  const me = leaderboard.find((p) => p.user_id === currentUserId)
  const hasPlayed = !!me?.completed
  const isCreator = challenge && currentUserId === challenge.creator_id
  const playerCount = leaderboard.length
  const isFull = challenge?.max_players ? playerCount >= challenge.max_players && !me : false
  const myRank = hasPlayed ? leaderboard.filter((p) => p.completed).sort((a, b) => b.score - a.score).findIndex((p) => p.user_id === currentUserId) + 1 : 0

  function goPlay() {
    if (challenge?.is_password_protected && !isCreator && !me) {
      if (!pwPrompt) { setPwPrompt(true); return }
      router.push(`/arena/forge/${challengeId}/play?pw=${encodeURIComponent(pw)}`)
      return
    }
    router.push(`/arena/forge/${challengeId}/play`)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <Loader2 style={{ width: '2rem', height: '2rem' }} className="animate-spin" />
      </div>
    )
  }
  if (!challenge) return null

  const color = challenge.banner_color || '#7c3aed'
  const completedBoard = [...leaderboard].filter((p) => p.completed).sort((a, b) => b.score - a.score)

  const urgencyColor =
    urgency === 'red' ? 'rgb(248,113,113)' :
    urgency === 'orange' ? 'rgb(251,146,60)' :
    urgency === 'ended' ? 'rgb(148,148,168)' :
    'rgb(74,222,128)'

  return (
    <div style={{ maxWidth: '44rem', margin: '0 auto', padding: '5.5rem 1.5rem 4rem' }}>
      {/* Always-visible expiry countdown, floating top-right below the navbar */}
      <div style={{ position: 'fixed', top: '4.5rem', right: '1.25rem', zIndex: 40, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', borderRadius: '9999px', background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(8px)', border: `1px solid ${urgencyColor}66`, color: urgencyColor, fontWeight: 800, fontSize: '0.8125rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
        <Clock style={{ width: '0.9rem', height: '0.9rem' }} />
        {urgency === 'ended' ? 'Challenge Ended' : `⏱ Ends in ${timeLeft}`}
      </div>

      {/* Removed-by-creator banner */}
      {kickedBanner && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '1rem', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(239,68,68,0.1)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.35rem' }}>🚫</span>
          <p style={{ color: 'rgb(252,165,165)', fontWeight: 700, fontSize: '0.9375rem' }}>You have been removed from this challenge by the creator.</p>
        </div>
      )}

      {/* Banner */}
      <div style={{ borderRadius: '1.5rem', padding: '2rem', marginBottom: '1.5rem', background: `linear-gradient(135deg, ${color}, rgba(19,19,31,0.9))`, border: `1px solid ${color}`, boxShadow: `0 0 50px ${color}40` }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(0,0,0,0.25)', color: 'white', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          ⚡ Forge Challenge
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '0.5rem' }}>{challenge.title}</h1>
        {challenge.welcome_message && (
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9375rem' }}>{challenge.welcome_message}</p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', marginTop: '0.75rem' }}>Hosted by {challenge.creator_name}</p>
      </div>

      {/* Ended banner */}
      {expired && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '1rem', border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(239,68,68,0.08)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🏁</span>
          <div>
            <p style={{ color: 'rgb(252,165,165)', fontWeight: 800, fontSize: '0.9375rem' }}>Challenge Ended</p>
            <p style={{ color: 'rgb(180,150,150)', fontSize: '0.8125rem' }}>Ended {challenge.expires_at ? new Date(challenge.expires_at).toLocaleString() : ''}</p>
          </div>
        </div>
      )}

      {/* Your Result */}
      {me?.completed && (
        <div style={{ borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.08)', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(124,58,237,0.15)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(196,181,253)', marginBottom: '0.875rem' }}>Your Result</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Rank', value: `${myRank <= 3 && myRank > 0 ? ['🥇', '🥈', '🥉'][myRank - 1] : `#${myRank}`} of ${completedBoard.length}` },
              { label: 'Score', value: `${me?.score}` },
              { label: 'Correct', value: `${me?.correct}/${me?.attempted}` },
              { label: 'XP earned', value: `+${(me?.correct ?? 0) * 5 + (me?.best_streak ?? 0) * 10}` },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.35rem', fontWeight: 900, color: 'rgb(251,191,36)', lineHeight: 1.1 }}>{s.value}</p>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgb(148,148,168)', marginTop: '0.2rem' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Subject', value: challenge.subject },
          { label: 'Topic', value: challenge.topic },
          { label: 'Difficulty', value: challenge.difficulty },
          { label: 'Questions', value: challenge.question_count },
          { label: 'Time', value: `${challenge.total_time_seconds}s` },
          { label: 'Rules', value: `+${challenge.correct_bonus_seconds}s / -${challenge.wrong_penalty_seconds}s` },
        ].map((d) => (
          <div key={d.label} style={{ borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem' }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgb(148,148,168)' }}>{d.label}</p>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'white', marginTop: '0.15rem' }}>{d.value}</p>
          </div>
        ))}
      </div>

      {/* Status + action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgb(180,180,200)', fontSize: '0.875rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}><Users style={{ width: '1rem', height: '1rem' }} /> {playerCount}{challenge.max_players ? `/${challenge.max_players}` : ''} players</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: expired ? 'rgb(248,113,113)' : 'rgb(180,180,200)' }}><Clock style={{ width: '1rem', height: '1rem' }} /> {expired ? 'Ended' : `${label} left`}</span>
        </div>

        <div style={{ minWidth: '12rem' }}>
          {!isLoggedIn ? (
            <a href={`/login?next=/arena/forge/${challengeId}/lobby`}
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', borderRadius: '0.875rem', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, textDecoration: 'none', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}>
              Join Challenge →
            </a>
          ) : expired ? (
            <div style={{ textAlign: 'center', color: 'rgb(248,113,113)', fontWeight: 800 }}>Challenge Ended</div>
          ) : hasPlayed ? (
            <div style={{ textAlign: 'center', borderRadius: '0.875rem', border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.08)', padding: '0.75rem 1rem' }}>
              <span style={{ color: 'rgb(251,191,36)', fontWeight: 800 }}>Your score: {me?.score} · Rank #{myRank}</span>
            </div>
          ) : isFull ? (
            <div style={{ textAlign: 'center', color: 'rgb(148,148,168)', fontWeight: 800 }}>Challenge Full</div>
          ) : (
            <div>
              {pwPrompt && (
                <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Enter password" autoFocus
                  style={{ width: '100%', padding: '0.6rem 0.875rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.35)', color: 'white', marginBottom: '0.5rem', boxSizing: 'border-box' }} />
              )}
              <button onClick={goPlay}
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}>
                {challenge.is_password_protected && !isCreator && !me && <Lock style={{ width: '1rem', height: '1rem' }} />}
                {isCreator ? 'Play Your Own Challenge →' : 'Join & Play →'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>
          {expired ? '🏆 Final Leaderboard' : 'Leaderboard'}
        </h2>
        {leaderboard.length === 0 ? (
          <p style={{ color: 'rgb(148,148,168)', fontSize: '0.9375rem' }}>No players yet. Be the first!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {leaderboard
              .slice()
              .sort((a, b) => Number(b.completed) - Number(a.completed) || b.score - a.score)
              .map((p, i) => {
                const rankAmongDone = completedBoard.findIndex((c) => c.user_id === p.user_id)
                const isMe = p.user_id === currentUserId
                const isHost = challenge.creator_id === p.user_id
                const canKick = isCreator && !isMe && p.user_id !== challenge.creator_id
                const removing = removingIds.has(p.id)
                return (
                  <div key={p.id} className="forge-row" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '0.875rem', padding: '0.75rem 1rem', border: isMe ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.06)', background: isMe ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)', boxShadow: isMe ? '0 0 20px rgba(124,58,237,0.3)' : 'none', ...(removing ? { opacity: 0, transform: 'translateX(24px)', transition: 'opacity 0.3s ease, transform 0.3s ease', pointerEvents: 'none' } : { animation: 'slidein 0.3s ease' }) }}>
                    <span style={{ width: '1.75rem', textAlign: 'center', fontWeight: 800, color: 'rgb(180,180,200)' }}>
                      {p.completed && rankAmongDone >= 0 && rankAmongDone < 3 ? MEDALS[rankAmongDone] : p.completed ? rankAmongDone + 1 : '•'}
                    </span>
                    <span style={{ fontSize: '1.35rem' }}>{p.avatar_emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.display_name}</span>
                        {isHost && <span style={{ fontSize: '0.625rem', fontWeight: 800, color: 'rgb(245,158,11)', background: 'rgba(245,158,11,0.12)', padding: '0.1rem 0.4rem', borderRadius: '9999px' }}>HOST</span>}
                        {isMe && <span style={{ fontSize: '0.625rem', fontWeight: 800, color: 'rgb(196,181,253)' }}>YOU</span>}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'rgb(148,148,168)' }}>
                        {p.completed ? `${p.correct}/${p.attempted} correct${p.completion_time_seconds != null ? ` · ${p.completion_time_seconds}s` : ''}` : 'Playing…'}
                      </span>
                    </div>
                    <span style={{ fontWeight: 900, color: p.completed ? 'rgb(251,191,36)' : 'rgb(120,120,140)', fontSize: '1.05rem' }}>{p.completed ? p.score : '—'}</span>

                    {/* Creator kick control */}
                    {canKick && (
                      <div style={{ position: 'relative' }}>
                        <button className="forge-kick" onClick={() => setKickTarget(kickTarget === p.id ? null : p.id)} title={`Kick ${p.display_name}`}
                          style={{ opacity: kickTarget === p.id ? 1 : undefined, width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(239,68,68,0.12)', color: 'rgb(248,113,113)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X style={{ width: '0.9rem', height: '0.9rem' }} />
                        </button>
                        {kickTarget === p.id && (
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 30, width: '14rem', background: 'rgb(20,20,34)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.75rem', padding: '0.75rem', boxShadow: '0 12px 34px rgba(0,0,0,0.55)', textAlign: 'left' }}>
                            <p style={{ fontSize: '0.8125rem', color: 'white', marginBottom: '0.625rem', lineHeight: 1.35 }}>Kick <strong>{p.display_name}</strong>? They won&apos;t be able to play.</p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => doKick(p)} style={{ flex: 1, borderRadius: '0.5rem', border: 'none', background: 'rgb(220,38,38)', color: 'white', fontWeight: 700, fontSize: '0.8125rem', padding: '0.45rem', cursor: 'pointer' }}>Kick</button>
                              <button onClick={() => setKickTarget(null)} style={{ flex: 1, borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.14)', background: 'transparent', color: 'rgb(200,200,215)', fontWeight: 700, fontSize: '0.8125rem', padding: '0.45rem', cursor: 'pointer' }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Share — only the creator can invite others */}
      {isCreator && (
        <div style={{ borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(196,181,253)', marginBottom: '0.75rem' }}>Share this challenge</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: '0.8125rem', color: 'rgb(180,180,200)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareLink}</span>
            <button onClick={copyLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', borderRadius: '0.625rem', background: 'rgb(124,58,237)', color: 'white', border: 'none', padding: '0.5rem 0.875rem', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>
              <Copy style={{ width: '0.9rem', height: '0.9rem' }} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Kick toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 45, background: 'rgb(20,20,34)', color: 'white', padding: '0.625rem 1.25rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', animation: 'slideup 0.25s ease' }}>
          {toast}
        </div>
      )}

      {/* You've-been-kicked modal (via realtime) */}
      {kickedModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ width: '100%', maxWidth: '22rem', textAlign: 'center', borderRadius: '1.25rem', border: '1px solid rgba(248,113,113,0.4)', background: 'linear-gradient(135deg, rgb(13,13,25), rgb(24,16,20))', padding: '2rem', boxShadow: '0 0 50px rgba(239,68,68,0.25)' }}>
            <div style={{ fontSize: '2.75rem', marginBottom: '0.5rem' }}>🚫</div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.35rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>You have been removed from this challenge</h2>
            <p style={{ fontSize: '0.875rem', color: 'rgb(180,180,200)', marginBottom: '1.5rem' }}>The creator removed you from this Forge Challenge.</p>
            <button onClick={() => router.push('/arena')} style={{ width: '100%', height: '3rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}

      <style>{`.forge-kick { opacity: 0; transition: opacity 0.15s ease; } .forge-row:hover .forge-kick { opacity: 1; }`}</style>
    </div>
  )
}
