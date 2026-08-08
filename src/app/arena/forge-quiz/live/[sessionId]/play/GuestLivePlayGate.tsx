'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getForgeGuestId } from '@/lib/forgeGuest'
import PlayLiveClient from './PlayLiveClient'

type SessionState = { status: string; display_mode: string; current_question_index: number; question_state: string; question_started_at: string | null }

// Client gate for guest (no-account) players. A guest's player row is keyed by
// guest_id (in sessionStorage), which the server can't see, so we resolve it
// here and then hand off to the shared PlayLiveClient exactly like a signed-in
// player. If no (or a kicked) row is found, bounce back to the join screen.
export default function GuestLivePlayGate({
  sessionId, initialSession, quiz, questions,
}: {
  sessionId: string
  initialSession: SessionState
  quiz: any
  questions: any[]
}) {
  const [player, setPlayer] = useState<{ id: string; display_name: string; avatar_emoji: string } | null>(null)
  const [guestId, setGuestId] = useState<string>('')

  useEffect(() => {
    const gid = getForgeGuestId()
    setGuestId(gid)
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('forge_quiz_live_players')
        .select('id, display_name, avatar_emoji, is_kicked')
        .eq('session_id', sessionId)
        .eq('guest_id', gid)
        .maybeSingle()
      if (cancelled) return
      if (!data || data.is_kicked) {
        window.location.href = `/arena/forge-quiz/live/${sessionId}/join`
        return
      }
      setPlayer({ id: data.id, display_name: data.display_name, avatar_emoji: data.avatar_emoji })
    })()
    return () => { cancelled = true }
  }, [sessionId])

  if (!player) {
    return (
      <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'white' }}>
        <Loader2 style={{ width: '2.5rem', height: '2.5rem' }} className="animate-spin" />
        <p style={{ fontWeight: 800, fontSize: '1.15rem' }}>Joining game…</p>
      </div>
    )
  }

  return (
    <PlayLiveClient
      sessionId={sessionId}
      playerId={player.id}
      guestId={guestId}
      me={{ display_name: player.display_name, avatar_emoji: player.avatar_emoji }}
      initialSession={initialSession}
      quiz={quiz}
      questions={questions}
    />
  )
}
