'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Swords, Zap, Brain, Skull, ArrowRight, Lock, Trophy, History, Clock, Users } from 'lucide-react'
import { SUBJECTS_BY_CATEGORY, getTopics } from '@/lib/subjects'

type Created = { id: string; title: string; subject: string; topic: string; created_at: string; expires_at: string; banner_color: string; playerCount: number; active: boolean }
type Joined = { id: string; title: string; subject: string; topic: string; banner_color: string; expires_at: string | null; active: boolean; avatar_emoji: string; display_name: string; score: number; correct: number; attempted: number; completed: boolean; rank: number; playerCount: number }

function medal(rank: number) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const ms = new Date(expiresAt).getTime() - now
  if (ms <= 0) return <>Ended</>
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return <>{h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`} left</>
}

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', emoji: '🌱' },
  { value: 'medium', label: 'Medium', emoji: '📚' },
  { value: 'hard', label: 'Hard', emoji: '🔥' },
  { value: 'expert', label: 'Expert', emoji: '⚡' },
]

const CATEGORIES = Object.keys(SUBJECTS_BY_CATEGORY).filter((c) => SUBJECTS_BY_CATEGORY[c].length > 0)

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(124,58,237,0.35)',
  color: 'white',
  fontSize: '0.9375rem',
  outline: 'none',
  colorScheme: 'dark',
  cursor: 'pointer',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgb(196,181,253)',
  marginBottom: '0.5rem',
}

export default function ArenaClient({ profile, created = [], joined = [] }: { profile?: any; created?: Created[]; joined?: Joined[] }) {
  const router = useRouter()
  const activeCreated = created.find((c) => c.active)
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [best, setBest] = useState<{ score: number; created_at: string } | null>(null)
  const [bestLoading, setBestLoading] = useState(false)

  const subjects = category ? SUBJECTS_BY_CATEGORY[category] ?? [] : []
  const topics = useMemo(() => (subject ? getTopics(subject) : []), [subject])

  const canStart = !!subject && !!topic

  // Fetch the user's personal best for the selected subject + difficulty.
  useEffect(() => {
    if (!subject) { setBest(null); return }
    let cancelled = false
    setBestLoading(true)
    ;(async () => {
      try {
        const params = new URLSearchParams({ subject, difficulty, gameType: 'speed_round' })
        const res = await fetch(`/api/arena/save-score?${params.toString()}`)
        const data = await res.json()
        if (!cancelled) setBest(data.best ?? null)
      } catch {
        if (!cancelled) setBest(null)
      } finally {
        if (!cancelled) setBestLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [subject, difficulty])

  function startGame() {
    if (!canStart) return
    const params = new URLSearchParams({ subject, topic, difficulty })
    router.push(`/arena/speed-round?${params.toString()}`)
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '40rem', height: '24rem', borderRadius: '9999px', background: 'rgba(124,58,237,0.12)', filter: 'blur(120px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', maxWidth: '56rem', margin: '0 auto', padding: '6.5rem 1.5rem 4rem' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '3.5rem', fontWeight: 800, color: 'white', lineHeight: 1.05, marginBottom: '0.75rem' }}>
            ⚔️ Arena
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'rgb(148,148,168)', maxWidth: '34rem', margin: '0 auto' }}>
            Test your knowledge. Beat the clock.
          </p>
        </div>

        {/* ⚡ Forge Challenge — create a shareable party tournament */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '1.5rem', border: '1px solid rgba(245,158,11,0.4)', background: 'linear-gradient(135deg, rgba(120,53,15,0.35), rgba(19,19,31,0.9))', padding: '2rem', marginBottom: '3rem', boxShadow: '0 0 50px rgba(245,158,11,0.15)' }}>
          <div style={{ position: 'absolute', top: '-4rem', right: '-4rem', width: '16rem', height: '16rem', borderRadius: '9999px', background: 'rgba(245,158,11,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
            <div style={{ maxWidth: '32rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
                ⚡ Forge Challenge
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'rgb(214,190,150)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                Create a custom challenge, share the link, compete with anyone.
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'rgb(180,150,110)' }}>
                Free users: 1 challenge creation · Unlimited participation
              </p>
            </div>
            <button type="button" onClick={() => router.push('/arena/forge/create')}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', padding: '0 1.75rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(245,158,11), rgb(251,191,36))', color: 'rgb(41,28,4)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 0 30px rgba(245,158,11,0.45)', whiteSpace: 'nowrap' }}>
              Create Challenge <ArrowRight style={{ width: '1.15rem', height: '1.15rem' }} />
            </button>
          </div>
        </div>

        {/* Game selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {/* Speed Round — available */}
          <div style={{ position: 'relative', borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.4)', background: 'linear-gradient(180deg, rgba(19,19,31,0.9), rgba(13,13,24,0.9))', padding: '1.75rem', boxShadow: '0 0 40px rgba(124,58,237,0.18)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', borderRadius: '0.875rem', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', marginBottom: '1rem' }}>
              <Zap style={{ width: '1.5rem', height: '1.5rem', color: 'rgb(196,181,253)' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.375rem' }}>Speed Round ⚡</h3>
            <p style={{ fontSize: '0.875rem', color: 'rgb(148,148,168)', lineHeight: 1.5 }}>
              Answer as many questions as possible in 60 seconds.
            </p>
            <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(196,181,253)' }}>
              <Swords style={{ width: '0.9rem', height: '0.9rem' }} /> Available now
            </div>
          </div>

          {/* Coming soon cards */}
          {[
            { title: 'Memory Match', icon: Brain },
            { title: 'Survival Mode', icon: Skull },
          ].map((g) => (
            <div key={g.title} style={{ position: 'relative', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', padding: '1.75rem', opacity: 0.55 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3rem', height: '3rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
                <g.icon style={{ width: '1.5rem', height: '1.5rem', color: 'rgb(120,120,140)' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'rgb(200,200,215)', marginBottom: '0.375rem' }}>{g.title}</h3>
              <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(120,120,140)' }}>
                <Lock style={{ width: '0.9rem', height: '0.9rem' }} /> Coming Soon
              </div>
            </div>
          ))}
        </div>

        {/* Config panel */}
        <div style={{ borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.75rem' }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: 'white', marginBottom: '1.25rem' }}>
            Configure your Speed Round
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={selectStyle} value={category} onChange={(e) => { setCategory(e.target.value); setSubject(''); setTopic('') }}>
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Subject</label>
              <select style={{ ...selectStyle, opacity: subjects.length ? 1 : 0.5 }} value={subject} disabled={!subjects.length} onChange={(e) => { setSubject(e.target.value); setTopic('') }}>
                <option value="">Select subject…</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Topic</label>
              <select style={{ ...selectStyle, opacity: topics.length ? 1 : 0.5 }} value={topic} disabled={!topics.length} onChange={(e) => setTopic(e.target.value)}>
                <option value="">Select topic…</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <label style={labelStyle}>Difficulty</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.75rem' }}>
            {DIFFICULTIES.map((d) => {
              const active = difficulty === d.value
              return (
                <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                  style={{ padding: '0.75rem 0.5rem', borderRadius: '0.75rem', border: `1px solid ${active ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.1)'}`, background: active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)', color: 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{d.emoji}</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: active ? 'rgb(196,181,253)' : 'rgb(180,180,195)' }}>{d.label}</div>
                </button>
              )
            })}
          </div>

          <button type="button" onClick={startGame} disabled={!canStart}
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', borderRadius: '0.875rem', border: 'none', background: canStart ? 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))' : 'rgba(255,255,255,0.06)', color: canStart ? 'white' : 'rgb(120,120,140)', fontWeight: 800, fontSize: '1rem', cursor: canStart ? 'pointer' : 'not-allowed', boxShadow: canStart ? '0 0 30px rgba(124,58,237,0.4)' : 'none', transition: 'all 0.2s' }}>
            Start Speed Round <ArrowRight style={{ width: '1.15rem', height: '1.15rem' }} />
          </button>
          {!canStart && (
            <p style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.8125rem', color: 'rgb(120,120,140)' }}>
              Pick a subject and topic to begin.
            </p>
          )}
        </div>

        {/* Your Best Score */}
        <div style={{ marginTop: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(245,158,11,0.28)', background: 'rgba(245,158,11,0.05)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <Trophy style={{ width: '1.25rem', height: '1.25rem', color: 'rgb(245,158,11)' }} />
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(245,158,11)' }}>
              Your Best Score
            </h3>
          </div>
          {!subject ? (
            <p style={{ fontSize: '0.9375rem', color: 'rgb(148,148,168)' }}>Pick a subject to see your best.</p>
          ) : bestLoading ? (
            <p style={{ fontSize: '0.9375rem', color: 'rgb(148,148,168)' }}>Loading…</p>
          ) : best ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'rgb(251,191,36)', lineHeight: 1 }}>{best.score}</span>
              <span style={{ fontSize: '0.875rem', color: 'rgb(148,148,168)' }}>
                on {new Date(best.created_at).toLocaleDateString()} · {subject} ({difficulty})
              </span>
            </div>
          ) : (
            <p style={{ fontSize: '0.9375rem', color: 'rgb(148,148,168)' }}>No scores yet — be the first!</p>
          )}
        </div>

        {/* ── My Challenges ── */}
        <div style={{ marginTop: '3rem' }}>
          {/* Prominent active-created highlight */}
          {activeCreated && (
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '1.25rem', border: '1px solid rgba(245,158,11,0.6)', background: 'linear-gradient(135deg, rgba(120,53,15,0.4), rgba(19,19,31,0.9))', padding: '1.75rem', marginBottom: '2rem', boxShadow: '0 0 45px rgba(245,158,11,0.2)' }}>
              <div style={{ position: 'absolute', top: '-4rem', right: '-4rem', width: '14rem', height: '14rem', borderRadius: '9999px', background: 'rgba(245,158,11,0.14)', filter: 'blur(70px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(251,191,36)', background: 'rgba(245,158,11,0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px', marginBottom: '0.625rem' }}>🔥 Active Challenge</span>
                  <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.375rem' }}>{activeCreated.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'rgb(214,190,150)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}><Users style={{ width: '0.9rem', height: '0.9rem' }} /> {activeCreated.playerCount} players</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}><Clock style={{ width: '0.9rem', height: '0.9rem' }} /> <Countdown expiresAt={activeCreated.expires_at} /></span>
                  </div>
                </div>
                <Link href={`/arena/forge/${activeCreated.id}/lobby`}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', padding: '0 1.75rem', borderRadius: '0.875rem', background: 'linear-gradient(90deg, rgb(245,158,11), rgb(251,191,36))', color: 'rgb(41,28,4)', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 0 26px rgba(245,158,11,0.45)' }}>
                  View Challenge <ArrowRight style={{ width: '1.15rem', height: '1.15rem' }} />
                </Link>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <History style={{ width: '1.35rem', height: '1.35rem', color: 'rgb(196,181,253)' }} />
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>My Challenges</h2>
          </div>

          {/* Created */}
          <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(148,148,168)', marginBottom: '0.875rem' }}>Created by you</h3>
          {created.length === 0 ? (
            <div style={{ borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', marginBottom: '2rem' }}>
              <p style={{ color: 'rgb(148,148,168)', fontSize: '0.9375rem' }}>
                You haven&apos;t created a Forge Challenge yet.{' '}
                <button onClick={() => router.push('/arena/forge/create')} style={{ background: 'none', border: 'none', color: 'rgb(251,191,36)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.9375rem' }}>Create one and challenge your friends! →</button>
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {created.map((c) => (
                <div key={c.id} style={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `4px solid ${c.banner_color}`, background: 'rgba(19,19,31,0.7)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '9999px', ...(c.active ? { color: 'rgb(74,222,128)', background: 'rgba(34,197,94,0.14)' } : { color: 'rgb(148,148,168)', background: 'rgba(255,255,255,0.06)' }) }}>{c.active ? 'Active' : 'Ended'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'rgb(120,120,140)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.0625rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem', lineHeight: 1.25 }}>{c.title}</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'rgb(148,148,168)', marginBottom: '0.75rem' }}>{c.subject}{c.topic ? ` · ${c.topic}` : ''}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'rgb(180,180,200)' }}><Users style={{ width: '0.85rem', height: '0.85rem' }} /> {c.playerCount} players</span>
                    <Link href={`/arena/forge/${c.id}/lobby`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(196,181,253)', textDecoration: 'none' }}>
                      {c.active ? 'View' : 'View Results'} <ArrowRight style={{ width: '0.85rem', height: '0.85rem' }} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Joined */}
          <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(148,148,168)', marginBottom: '0.875rem' }}>Joined challenges</h3>
          {joined.length === 0 ? (
            <div style={{ borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', padding: '1.5rem' }}>
              <p style={{ color: 'rgb(148,148,168)', fontSize: '0.9375rem' }}>You haven&apos;t joined any Forge Challenges yet. Ask a friend to share their challenge link!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {joined.map((j) => (
                <div key={j.id} style={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `4px solid ${j.banner_color}`, background: 'rgba(19,19,31,0.7)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '9999px', ...(j.active ? { color: 'rgb(74,222,128)', background: 'rgba(34,197,94,0.14)' } : { color: 'rgb(148,148,168)', background: 'rgba(255,255,255,0.06)' }) }}>{j.active ? 'Active' : 'Ended'}</span>
                    {j.completed && <span style={{ fontSize: '0.9375rem', fontWeight: 900, color: 'rgb(251,191,36)' }}>{medal(j.rank)}</span>}
                  </div>
                  <h4 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.0625rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem', lineHeight: 1.25 }}>{j.title}</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'rgb(148,148,168)', marginBottom: '0.625rem' }}>{j.subject}{j.topic ? ` · ${j.topic}` : ''}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.15rem' }}>{j.avatar_emoji}</span>
                    <span style={{ fontSize: '0.8125rem', color: 'rgb(200,200,215)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.display_name}</span>
                    {j.completed && <span style={{ marginLeft: 'auto', fontSize: '0.9375rem', fontWeight: 900, color: 'rgb(251,191,36)' }}>{j.score}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgb(120,120,140)' }}>{j.completed ? `Rank ${medal(j.rank)} of ${j.playerCount}` : 'Playing…'}</span>
                    <Link href={`/arena/forge/${j.id}/lobby`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'rgb(196,181,253)', textDecoration: 'none' }}>
                      {j.active ? 'View Leaderboard' : 'View Results'} <ArrowRight style={{ width: '0.85rem', height: '0.85rem' }} />
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
