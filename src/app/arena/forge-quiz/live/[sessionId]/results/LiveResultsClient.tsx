'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCw, Pencil } from 'lucide-react'
import LivePodium, { PodiumPlayer } from '@/components/arena/LivePodium'
import PlayerResult from '@/components/arena/PlayerResult'

type Me = { rank: number; totalPlayers: number; score: number; correct: number; attempted: number; bestStreak: number; displayName: string; avatar: string }

export default function LiveResultsClient({
  isHost, sessionId, quizId, quizTitle, bannerColor, players, viewerId, me,
}: {
  isHost: boolean
  sessionId: string
  quizId: string
  quizTitle: string
  bannerColor: string
  players: PodiumPlayer[]
  viewerId: string
  me: Me | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function runAgain() {
    setBusy(true)
    try {
      const res = await fetch('/api/arena/forge-quiz/live/relaunch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
      const data = await res.json()
      if (res.ok && data.newSessionId) { router.push(`/arena/forge-quiz/live/${data.newSessionId}/host`); return }
    } catch {}
    setBusy(false)
  }

  // A player who participated sees their personalized card.
  if (!isHost && me) {
    return (
      <PlayerResult
        rank={me.rank} totalPlayers={me.totalPlayers} score={me.score}
        correct={me.correct} attempted={me.attempted} bestStreak={me.bestStreak}
        quizTitle={quizTitle} bannerColor={bannerColor} playerName={me.displayName} avatar={me.avatar}
      />
    )
  }

  // The host (or a viewer with no personal row) sees the podium standings.
  return (
    <LivePodium
      players={players}
      quizTitle={quizTitle}
      bannerColor={bannerColor}
      animated={false}
      highlightUserId={viewerId}
      controls={isHost ? (
        <>
          <button onClick={runAgain} disabled={busy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3rem', padding: '0 1.5rem', borderRadius: '9999px', border: 'none', background: 'linear-gradient(90deg, rgb(22,163,74), rgb(34,197,94))', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
            <RotateCw style={{ width: '1.1rem', height: '1.1rem' }} /> Run Again
          </button>
          <button onClick={() => router.push(`/arena/forge-quiz/${quizId}/edit`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3rem', padding: '0 1.5rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
            <Pencil style={{ width: '1.1rem', height: '1.1rem' }} /> Edit Quiz
          </button>
        </>
      ) : undefined}
    />
  )
}
