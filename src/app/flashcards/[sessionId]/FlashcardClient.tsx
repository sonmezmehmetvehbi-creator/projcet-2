'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Layers } from 'lucide-react'
import { StudyDeck } from '@/components/flashcards/StudyDeck'
import type { Flashcard } from '@/types/flashcard'

export default function FlashcardClient({
  session,
  flashcards,
}: {
  session: any
  flashcards: Flashcard[]
}) {
  const router = useRouter()

  async function handleComplete(gotIt: number, total: number) {
    try {
      // Mirror the questions flow: only count the first study session per day
      // toward the streak. XP is deduplicated server-side per subject+topic.
      const today = new Date().toISOString().split('T')[0]
      const lastStudy = localStorage.getItem('lastStudyDate')
      const isFirstSessionToday = lastStudy !== today
      if (isFirstSessionToday) localStorage.setItem('lastStudyDate', today)

      await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outputType: 'flashcards',
          isFirstSessionToday,
          sessionId: session.id,
          subject: session.subject,
          topic: session.topic,
          correctAnswers: gotIt,
          totalAnswers: total,
        }),
      })
      router.refresh()
    } catch {}
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
        <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '6rem 1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'rgb(107,107,88)', marginBottom: '1rem' }}>No flashcards found for this session.</p>
          <Link href="/generate" className="btn-primary">Generate flashcards</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '5.5rem 1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'rgb(34,85,14)', textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft style={{ width: '0.9rem', height: '0.9rem' }} /> Dashboard
          </Link>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'rgb(107,107,88)' }}>
            <Layers style={{ width: '0.9rem', height: '0.9rem' }} /> {session.subject} · {session.topic}
          </span>
        </div>

        <StudyDeck
          flashcards={flashcards}
          subject={session.subject}
          topic={session.topic}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
