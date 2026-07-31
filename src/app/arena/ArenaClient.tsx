'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArenaHero, type ArenaStat } from '@/components/arena/arena-hero'
import { ActionCards } from '@/components/arena/action-cards'
import { MyQuizzes } from '@/components/arena/my-quizzes'
import type { CreatedCard, JoinedCard } from '@/components/arena/quiz-card'

type CreatedQuiz = { id: string; title: string; banner_color: string; play_mode: string; expires_at: string | null; playerCount: number; active: boolean; is_starred?: boolean }
type JoinedQuiz = { id: string; title: string; banner_color: string; active: boolean; completed: boolean; score: number; rank: number; playerCount: number }
type HostedLive = { id: string; title: string; banner_color: string; date: string; playerCount: number; active: boolean }
type JoinedLive = { id: string; title: string; banner_color: string; date: string; score: number; rank: number; playerCount: number; active: boolean }

const CREATE_HREF = '/arena/forge-quiz/create'

function liveDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) } catch { return '' }
}
function timeLeftLabel(expiresAt: string | null): string {
  if (!expiresAt) return ''
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000)
  return d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export default function ArenaClient({
  profile, quizzesCreated = [], quizzesJoined = [], liveHosted = [], liveJoined = [],
}: {
  profile?: any
  quizzesCreated?: CreatedQuiz[]
  quizzesJoined?: JoinedQuiz[]
  liveHosted?: HostedLive[]
  liveJoined?: JoinedLive[]
}) {
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  // Real join flow (unchanged): live-session code space first, then self-paced.
  async function handleJoin(rawCode: string) {
    const code = rawCode.replace(/\s/g, '').toUpperCase()
    if (!code || joining) return
    setJoining(true); setJoinError('')
    try {
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

  // ── Map real Supabase data → card models (Created / Joined tabs) ──
  // Created quizzes are owned: Manage → the edit/relaunch flow; the play button
  // quick-relaunches after a format pick. Hosted live sessions are owned too but
  // aren't relaunchable rows, so they get Manage → host control only.
  const createdCards: CreatedCard[] = [
    ...quizzesCreated.map((q): CreatedCard => ({
      id: `q-${q.id}`,
      kind: 'quiz',
      quizId: q.id,
      title: q.title,
      active: q.active,
      mode: q.play_mode === 'live' ? 'Live' : 'Self-paced',
      players: q.playerCount,
      meta: q.active ? (q.expires_at ? timeLeftLabel(q.expires_at) : undefined) : undefined,
      starred: !!q.is_starred,
      manageHref: `/arena/forge-quiz/${q.id}/edit`,
    })),
    ...liveHosted.map((s): CreatedCard => ({
      id: `lh-${s.id}`,
      kind: 'session',
      quizId: '',
      title: s.title,
      active: s.active,
      mode: 'Live',
      players: s.playerCount,
      meta: liveDate(s.date),
      starred: false,
      manageHref: `/arena/forge-quiz/live/${s.id}/host`,
    })),
  ]

  const joinedCards: JoinedCard[] = [
    ...quizzesJoined.map((q): JoinedCard => ({
      id: `qj-${q.id}`,
      title: q.title,
      active: q.active,
      completed: q.completed,
      rank: q.rank,
      score: q.score,
      totalPlayers: q.playerCount,
      meta: q.completed ? undefined : 'Not finished',
      playHref: q.active ? `/arena/forge-quiz/${q.id}/lobby` : undefined,
    })),
    ...liveJoined.map((s): JoinedCard => ({
      id: `lj-${s.id}`,
      title: s.title,
      active: s.active,
      completed: !s.active,
      rank: s.rank,
      score: s.score,
      totalPlayers: s.playerCount,
      meta: s.active ? liveDate(s.date) : undefined,
      playHref: s.active ? `/arena/forge-quiz/live/${s.id}/play` : undefined,
    })),
  ]

  // ── Real hero stats ──
  const podiums =
    quizzesJoined.filter((q) => q.completed && q.rank >= 1 && q.rank <= 3).length +
    liveJoined.filter((s) => !s.active && s.rank >= 1 && s.rank <= 3).length
  const liveNow = liveHosted.filter((s) => s.active).length + liveJoined.filter((s) => s.active).length

  const stats: ArenaStat[] = [
    { label: 'Quizzes created', value: createdCards.length, accent: 'brand' },
    { label: 'Games joined', value: joinedCards.length, accent: 'sky' },
    { label: 'Top-3 finishes', value: podiums, accent: 'ember' },
  ]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-arena-bg text-arena-fg">
      <ArenaHero stats={stats} liveNow={liveNow} />
      <ActionCards createHref={CREATE_HREF} onJoin={handleJoin} joining={joining} joinError={joinError} />
      <MyQuizzes created={createdCards} joined={joinedCards} createHref={CREATE_HREF} />
    </div>
  )
}
