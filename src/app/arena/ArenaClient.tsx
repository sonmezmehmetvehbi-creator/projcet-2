'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, History, Users } from 'lucide-react'

type CreatedQuiz = { id: string; title: string; banner_color: string; play_mode: string; expires_at: string | null; playerCount: number; active: boolean }
type JoinedQuiz = { id: string; title: string; banner_color: string; active: boolean; completed: boolean; score: number; rank: number; playerCount: number }

function medal(rank: number) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
}
function timeLeftLabel(expiresAt: string | null): string {
  if (!expiresAt) return ''
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000)
  return d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export default function ArenaClient({ profile, quizzesCreated = [], quizzesJoined = [] }: { profile?: any; quizzesCreated?: CreatedQuiz[]; quizzesJoined?: JoinedQuiz[] }) {
  const router = useRouter()
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  async function submitJoinCode() {
    const code = joinCode.trim().toUpperCase()
    if (!code || joining) return
    setJoining(true); setJoinError('')
    try {
      // Live Room sessions share the code space with self-paced quizzes —
      // check for a live session first, then fall back to a self-paced quiz.
      const liveRes = await fetch(`/api/arena/forge-quiz/live/find-session?code=${encodeURIComponent(code)}`)
      const liveData = await liveRes.json()
      if (liveRes.ok && liveData.sessionId) {
        router.push(`/arena/forge-quiz/live/${liveData.sessionId}/join`)
        return
      }
      const res = await fetch(`/api/arena/forge-quiz/find-by-code?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (!res.ok || !data.quizId) throw new Error(data.error || 'Invalid or expired code')
      router.push(`/arena/forge-quiz/${data.quizId}/lobby`)
    } catch (e: any) {
      setJoinError(e.message || 'Invalid or expired code')
      setJoining(false)
    }
  }

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
              <div style={{ marginTop: '1.25rem', maxWidth: '24rem' }}>
                <form onSubmit={(e) => { e.preventDefault(); submitJoinCode() }} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input value={joinCode} onChange={(e) => { setJoinCode(e.target.value.toUpperCase().slice(0, 6)); setJoinError('') }} placeholder="CODE" maxLength={6} autoFocus disabled={joining}
                    style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.35)', border: `1px solid ${joinError ? 'rgba(248,113,113,0.6)' : 'rgba(245,158,11,0.5)'}`, color: 'white', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.4em', textAlign: 'center', textTransform: 'uppercase', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', outline: 'none', boxSizing: 'border-box' }} />
                  <button type="submit" disabled={joining || joinCode.trim().length < 4}
                    style={{ borderRadius: '0.75rem', border: 'none', background: joining ? 'rgba(245,158,11,0.5)' : 'rgb(245,158,11)', color: 'rgb(41,28,4)', fontWeight: 800, padding: '0 1.25rem', cursor: joining ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
                    {joining ? 'Finding…' : 'Join →'}
                  </button>
                </form>
                {joinError && <p style={{ marginTop: '0.5rem', color: 'rgb(248,113,113)', fontSize: '0.8125rem', fontWeight: 600 }}>{joinError}</p>}
                <button type="button" onClick={() => router.push('/arena/forge-quiz/live/join')}
                  style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'rgb(196,181,253)', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                  🎮 Joining a live game? Enter the code here →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── My Quizzes ── */}
        <div style={{ marginTop: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <History style={{ width: '1.35rem', height: '1.35rem', color: 'rgb(196,181,253)' }} />
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>My Quizzes</h2>
          </div>

          {/* Created */}
          <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(148,148,168)', marginBottom: '0.875rem' }}>Created by you</h3>
          {quizzesCreated.length === 0 ? (
            <div style={{ borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', marginBottom: '2rem' }}>
              <p style={{ color: 'rgb(148,148,168)', fontSize: '0.9375rem' }}>You haven&apos;t created a quiz yet. Build one to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {quizzesCreated.map((q) => (
                <div key={q.id} style={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `4px solid ${q.banner_color}`, background: 'rgba(19,19,31,0.7)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '9999px', ...(q.active ? { color: 'rgb(74,222,128)', background: 'rgba(34,197,94,0.14)' } : { color: 'rgb(148,148,168)', background: 'rgba(255,255,255,0.06)' }) }}>{q.active ? 'Active' : 'Ended'}</span>
                    {q.active && q.expires_at && <span style={{ fontSize: '0.6875rem', color: 'rgb(120,120,140)' }}>{timeLeftLabel(q.expires_at)}</span>}
                  </div>
                  <h4 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.0625rem', fontWeight: 700, color: 'white', marginBottom: '0.625rem', lineHeight: 1.25 }}>{q.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'rgb(180,180,200)' }}><Users style={{ width: '0.85rem', height: '0.85rem' }} /> {q.playerCount} players</span>
                    <Link href={`/arena/forge-quiz/${q.id}/lobby`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(196,181,253)', textDecoration: 'none' }}>
                      {q.active ? 'Manage' : 'View Results'} <ArrowRight style={{ width: '0.85rem', height: '0.85rem' }} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Joined */}
          <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(148,148,168)', marginBottom: '0.875rem' }}>Joined quizzes</h3>
          {quizzesJoined.length === 0 ? (
            <div style={{ borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', padding: '1.5rem' }}>
              <p style={{ color: 'rgb(148,148,168)', fontSize: '0.9375rem' }}>You haven&apos;t joined any quizzes yet. Ask a friend for a link or a room code!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {quizzesJoined.map((q) => (
                <div key={q.id} style={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `4px solid ${q.banner_color}`, background: 'rgba(19,19,31,0.7)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '9999px', ...(q.active ? { color: 'rgb(74,222,128)', background: 'rgba(34,197,94,0.14)' } : { color: 'rgb(148,148,168)', background: 'rgba(255,255,255,0.06)' }) }}>{q.active ? 'Active' : 'Ended'}</span>
                    {q.completed && <span style={{ fontSize: '0.9375rem', fontWeight: 900, color: 'rgb(251,191,36)' }}>{medal(q.rank)}</span>}
                  </div>
                  <h4 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.0625rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem', lineHeight: 1.25 }}>{q.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgb(120,120,140)' }}>{q.completed ? `${q.score} pts · rank ${medal(q.rank)} of ${q.playerCount}` : 'Not finished'}</span>
                    <Link href={`/arena/forge-quiz/${q.id}/${q.active ? 'lobby' : 'results'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(196,181,253)', textDecoration: 'none' }}>
                      {q.active ? 'View Leaderboard' : 'View Results'} <ArrowRight style={{ width: '0.85rem', height: '0.85rem' }} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
