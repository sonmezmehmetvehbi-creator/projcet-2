'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'
import { ArenaHero, type ArenaStat } from '@/components/arena/arena-hero'
import { ActionCards } from '@/components/arena/action-cards'
import { MyQuizzes } from '@/components/arena/my-quizzes'
import type { CreatedCard, JoinedCard } from '@/components/arena/quiz-card'

type CreatedQuiz = { id: string; title: string; banner_color: string; play_mode: string; expires_at: string | null; playerCount: number; active: boolean; is_starred?: boolean; owned?: boolean }
type JoinedQuiz = { id: string; title: string; banner_color: string; active: boolean; completed: boolean; score: number; rank: number; playerCount: number; timesPlayed?: number; lastPlayed?: string | null; playHref?: string }
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
  profile, quizzesCreated = [], quizzesJoined = [], quizzesStarred = [], liveHosted = [], liveJoined = [],
}: {
  profile?: any
  quizzesCreated?: CreatedQuiz[]
  quizzesJoined?: JoinedQuiz[]
  quizzesStarred?: CreatedQuiz[]
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
  // A created/starred quiz → a CreatedCard. `owned` decides whether Manage points
  // at the editor (owner) or the read-only Browse preview (a starred quiz you
  // don't own) and whether Delete is offered.
  const quizToCard = (q: CreatedQuiz): CreatedCard => {
    const owned = q.owned !== false
    return {
      id: `q-${q.id}`,
      kind: 'quiz',
      quizId: q.id,
      title: q.title,
      active: q.active,
      mode: q.play_mode === 'live' ? 'Live' : 'Self-paced',
      players: q.playerCount,
      meta: q.active ? (q.expires_at ? timeLeftLabel(q.expires_at) : undefined) : undefined,
      starred: !!q.is_starred,
      owned,
      manageHref: owned ? `/arena/forge-quiz/${q.id}/edit` : `/arena/browse/${q.id}`,
    }
  }

  const createdCards: CreatedCard[] = [
    ...quizzesCreated.map(quizToCard),
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
      owned: true,
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
      playHref: q.playHref,
      timesLabel: q.timesPlayed && q.timesPlayed > 1
        ? `Played ${q.timesPlayed} times${q.lastPlayed ? ` · last ${liveDate(q.lastPlayed)}` : ''}`
        : undefined,
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

  // Starred quizzes (any creator) as cards for the Starred tab.
  const starredCards: CreatedCard[] = quizzesStarred.map(quizToCard)

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

      {/* Browse public quizzes entry point */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-6 sm:px-8">
        <Link
          href="/arena/browse"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-arena-border bg-surface/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-sky/45 hover:bg-surface/85 hover:shadow-xl hover:shadow-sky/10 sm:p-6"
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky/40 bg-sky/12 text-sky shadow-lg shadow-sky/15">
              <Search className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold tracking-tight text-arena-fg">🔍 Browse Quizzes</h3>
              <p className="truncate text-sm text-arena-muted">Discover and play quizzes created by the community</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-arena-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-sky" aria-hidden />
        </Link>
      </div>

      <MyQuizzes created={createdCards} joined={joinedCards} starred={starredCards} createHref={CREATE_HREF} />
    </div>
  )
}
