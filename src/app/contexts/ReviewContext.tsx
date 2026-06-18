'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import ReviewModal from '@/app/components/ReviewModal'

interface PendingReview {
  sessionId: string
  tutorId: string
  tutorName: string
}

interface ReviewCtx {
  pendingReviewSessionId: string | null
  pendingReviewTutorName: string | null
  refreshPendingReview: () => void
}

const ReviewContext = createContext<ReviewCtx>({
  pendingReviewSessionId: null,
  pendingReviewTutorName: null,
  refreshPendingReview: () => {},
})

const REVIEWED_KEY = 'aceforge_reviewed_sessions'

function loadReviewed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(REVIEWED_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function markReviewed(sessionId: string) {
  if (typeof window === 'undefined') return
  try {
    const arr = loadReviewed()
    if (!arr.includes(sessionId)) {
      localStorage.setItem(REVIEWED_KEY, JSON.stringify([...arr, sessionId]))
    }
  } catch {}
}

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingReview | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set(loadReviewed()))
  const pathname = usePathname()

  const refreshPendingReview = useCallback(async () => {
    try {
      // no-store so the browser doesn't serve a stale "no pending review".
      const res = await fetch('/api/tutoring/pending-review', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      console.log('[ReviewContext] localStorage reviewed:', loadReviewed())
      console.log('[ReviewContext] pending-review API returned:', data)
      if (data?.pending) {
        setPending({
          sessionId: data.pending.session_id,
          tutorId: data.pending.tutor_id,
          tutorName: data.pending.tutor_name,
        })
      } else {
        setPending(null)
      }
    } catch (e) {
      console.error('[ReviewContext] refresh error:', e)
    }
  }, [])

  // Check on first mount and whenever the student navigates to a new page.
  useEffect(() => { refreshPendingReview() }, [refreshPendingReview, pathname])

  const showModal = pending && !dismissed.has(pending.sessionId)
  useEffect(() => {
    if (pending) {
      console.log('[ReviewContext] pending session:', pending.sessionId, 'dismissed?', dismissed.has(pending.sessionId), 'showModal:', !dismissed.has(pending.sessionId))
    }
  }, [pending, dismissed])

  return (
    <ReviewContext.Provider value={{
      pendingReviewSessionId: pending?.sessionId ?? null,
      pendingReviewTutorName: pending?.tutorName ?? null,
      refreshPendingReview,
    }}>
      {children}
      {showModal && (
        <ReviewModal
          sessionId={pending!.sessionId}
          tutorId={pending!.tutorId}
          tutorName={pending!.tutorName}
          onClose={() => {
            markReviewed(pending!.sessionId)
            setDismissed(prev => new Set(prev).add(pending!.sessionId))
            setPending(null)
          }}
          onSubmitted={() => {
            markReviewed(pending!.sessionId)
            setDismissed(prev => new Set(prev).add(pending!.sessionId))
            setPending(null)
            refreshPendingReview()
          }}
        />
      )}
    </ReviewContext.Provider>
  )
}

export function useReview() {
  return useContext(ReviewContext)
}
