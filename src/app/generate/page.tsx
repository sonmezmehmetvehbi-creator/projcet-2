'use client'
import AdSlot from '@/components/ui/AdSlot'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase'
import {
  BookOpen, FileText, ChevronDown, AlertCircle, Zap, Upload, X, FileUp,
  Calculator, FlaskConical, PenTool, Landmark, Target, Code, Languages,
  Palette, Briefcase, HeartPulse, Brain, Sparkles, ArrowLeft, ArrowRight, Check, Layers,
} from 'lucide-react'
import LimitReachedModal from '@/components/ui/LimitReachedModal'
import ReadyScreen from '@/components/ui/ReadyScreen'
import type { Profile, Grade, OutputType, QuestionType, Difficulty } from '@/types'
import { SUBJECTS_BY_CATEGORY, getTopics } from '@/lib/subjects'

const GREEN = 'rgb(34,85,14)'
const MUTED = 'rgb(107,107,88)'
const INK = 'rgb(26,26,20)'

const GRADES: { value: Grade; label: string }[] = [
  { value: 'K-5', label: 'K–5' },
  { value: '6-8', label: '6–8' },
  { value: '9-10', label: '9–10' },
  { value: '11-12', label: '11–12' },
  { value: 'college', label: 'College' },
]

// ── Category → icon ──
const CATEGORIES = [
  { id: 'Mathematics', icon: Calculator },
  { id: 'Science', icon: FlaskConical },
  { id: 'English & Writing', icon: PenTool },
  { id: 'History & Social Studies', icon: Landmark },
  { id: 'Test Prep', icon: Target },
  { id: 'Computer Science', icon: Code },
  { id: 'Languages', icon: Languages },
  { id: 'Arts & Music', icon: Palette },
  { id: 'Business & Economics', icon: Briefcase },
  { id: 'Health & PE', icon: HeartPulse },
  { id: 'Philosophy & Psychology', icon: Brain },
  { id: 'Other', icon: Sparkles },
]


const STEP_LABELS = ['Category', 'Subject', 'Topic', 'Options', 'Generate']
const CUSTOM = '__custom__'

export default function GeneratePage() {
  return (
    <Suspense fallback={null}>
      <GeneratePageInner />
    </Suspense>
  )
}

function GeneratePageInner() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState<Grade>('9-10')
  const [topic, setTopic] = useState('')
  const [focus, setFocus] = useState('')
  const [outputType, setOutputType] = useState<OutputType>('questions')
  const [questionCount, setQuestionCount] = useState(10)
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['mc'])
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState({ questions: 0, worksheets: 0 })
  const [limitModal, setLimitModal] = useState<{ open: boolean; bonus: number }>({ open: false, bonus: 0 })
  const [genBan, setGenBan] = useState<{ reason?: string } | null>(null)
  const [bans, setBans] = useState({ generation: false, tutoring: false, support: false })

  // Loading progress + "ready" transition.
  const [finished, setFinished] = useState(false)
  const [showReady, setShowReady] = useState(false)
  const [readyOutputType, setReadyOutputType] = useState<string>('')

  // Multi-step wizard state.
  const [step, setStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('subject') && params.get('topic')) return 4
    }
    return 1
  })
  const [maxStep, setMaxStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('subject') && params.get('topic')) return 4
    }
    return 1
  })
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [category, setCategory] = useState('')
  const [topicChoice, setTopicChoice] = useState('') // selected topic pill/dropdown value ('' or CUSTOM or a topic)

  const [useUpload, setUseUpload] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedText, setUploadedText] = useState('')
  const [uploadParsing, setUploadParsing] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Pre-fill subject/topic/output type from query params (e.g. arriving from a
  // flashcard deck's "Generate Questions on This Topic" link).
  useEffect(() => {
    const s = searchParams.get('subject')
    const t = searchParams.get('topic')
    const ot = searchParams.get('outputType')
    if (s) setSubject(s)
    if (t) setTopic(t)
    if (ot === 'questions' || ot === 'worksheet' || ot === 'flashcards') setOutputType(ot as OutputType)
    if (s && t) { setStep(4); setMaxStep(m => Math.max(m, 4)) }
  }, [searchParams])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      fetch('/api/user/bans').then(r => r.json()).then(setBans).catch(() => {})
      const today = new Date().toISOString().split('T')[0]
      const { data: usageData } = await supabase.from('daily_usage').select('questions, worksheets').eq('user_id', user.id).eq('date', today).single()
      if (usageData) setUsage(usageData)
    }
    load()
  }, [])

  const bonusGenerations = (profile as any)?.bonus_generations ?? 0
  const atLimit = !profile?.is_premium && bonusGenerations <= 0 && (
    (outputType === 'questions' && usage.questions >= 2) ||
    (outputType === 'worksheet' && usage.worksheets >= 2) ||
    (outputType === 'flashcards' && usage.worksheets >= 2)
  )

  // ── Step navigation ──
  function goTo(next: number) {
    setDir(next >= step ? 'fwd' : 'back')
    setStep(next)
    setMaxStep(m => Math.max(m, next))
  }

  function selectCategory(cat: string) {
    setCategory(cat)
    setSubject('')
    setTopic('')
    setTopicChoice('')
    if (cat === 'Other') setSubject('')
    goTo(2)
  }
  function selectSubject(subj: string) {
    setSubject(subj)
    setTopic('')
    setTopicChoice('')
    goTo(3)
  }

  function setQType(mode: 'mc' | 'fr' | 'mixed') {
    setQuestionTypes(mode === 'mixed' ? ['mc', 'fr'] : [mode])
  }
  const qtMode: 'mc' | 'fr' | 'mixed' =
    questionTypes.includes('mc') && questionTypes.includes('fr') ? 'mixed' : (questionTypes[0] as 'mc' | 'fr') ?? 'mc'

  async function extractPPTXClientSide(file: File): Promise<string> {
    const JSZip = (await import('jszip')).default
    const buffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)
    const texts: string[] = []

    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] ?? '0')
        const numB = parseInt(b.match(/\d+/)?.[0] ?? '0')
        return numA - numB
      })

    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async('text')
      const matches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? []
      const slideText = matches
        .map((m: string) => m.replace(/<[^>]+>/g, '').trim())
        .filter((t: string) => t.length > 0)
        .join(' ')
      if (slideText.trim().length > 5) {
        const slideNum = slideFile.match(/\d+/)?.[0]
        texts.push(`[Slide ${slideNum}] ${slideText.trim()}`)
      }
    }

    if (texts.length === 0) {
      throw new Error('Could not extract text from this PowerPoint. Make sure it contains text (not just images).')
    }

    return texts.join('\n\n')
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File must be under 20MB')
      return
    }

    setUploadedFile(file)
    setUploadError('')
    setUploadParsing(true)

    try {
      const fileName = file.name.toLowerCase()
      let extractedText = ''

      if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
        extractedText = await extractPPTXClientSide(file)
      } else if (fileName.endsWith('.txt')) {
        extractedText = await file.text()
      } else {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/parse-upload', { method: 'POST', body: formData })
        const text = await res.text()
        let data: any
        try { data = JSON.parse(text) } catch { throw new Error('Server error reading file. Please try again.') }
        if (!res.ok) throw new Error(data.error || 'Failed to parse file')
        extractedText = data.text
      }

      if (!extractedText || extractedText.trim().length < 30) {
        throw new Error('Could not extract enough text from this file.')
      }

      setUploadedText(extractedText.slice(0, 12000))

      if (!topic) {
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        setTopic(name)
        setTopicChoice(CUSTOM)
      }
    } catch (err: any) {
      setUploadError(err.message)
      setUploadedFile(null)
    }
    setUploadParsing(false)
  }

  function removeUpload() {
    setUploadedFile(null)
    setUploadedText('')
    setUploadError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !topic.trim()) { setError('Please fill in all required fields.'); return }
    if (useUpload && !uploadedText) { setError('Please upload a file or disable the upload option.'); return }
    if (atLimit) { setError('You have reached your daily limit. Upgrade to Premium for unlimited generations.'); return }
    setError('')
    setFinished(false)
    setLoading(true)

    const minWait = profile?.is_premium ? 15000 : 30000
    const isFlashcards = outputType === 'flashcards'

    try {
      const [data] = await Promise.all([
        fetch(isFlashcards ? '/api/generate-flashcards' : '/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isFlashcards
              ? { subject, grade, topic, uploadedText: useUpload ? uploadedText : undefined }
              : {
                  subject, grade, topic, focus, outputType,
                  questionCount, questionTypes, difficulty,
                  uploadedText: useUpload ? uploadedText : undefined,
                }
          ),
        }).then(res => res.json()),
        new Promise(resolve => setTimeout(resolve, minWait)),
      ])

      if (data.limitReached) {
        setLimitModal({ open: true, bonus: data.bonusRemaining ?? 0 })
        setLoading(false)
        return
      }
      if (data.error === 'generation_banned') {
        setGenBan({ reason: data.reason })
        setLoading(false)
        return
      }
      if (data.error) throw new Error(data.error)
      // Snap the bar to 100%, hold 300ms so the user sees it complete, then
      // show the "ready" transition before navigating.
      setReadyOutputType(outputType)
      setFinished(true)
      setTimeout(() => {
        setShowReady(true)
        setLoading(false)
        setTimeout(() => {
          router.refresh()
          if (outputType === 'questions') router.push(`/questions/${data.sessionId}`)
          else if (outputType === 'flashcards') router.push(`/flashcards/${data.sessionId}`)
          else router.push(`/worksheet/${data.sessionId}`)
        }, 2500)
      }, 300)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (showReady) return <ReadyScreen subject={subject} topic={topic} outputType={readyOutputType} />

  if (loading) return <LoadingScreen outputType={outputType} isPremium={profile?.is_premium ?? false} subject={subject} topic={topic} finished={finished} />

  if (genBan) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} bans={bans} />
      <div style={{ paddingTop: '5rem' }}>
        <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '3rem 1.5rem' }}>
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(163,45,45,0.25)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'rgb(163,45,45)', marginBottom: '0.75rem' }}>
              AI generation suspended
            </h1>
            <p style={{ color: MUTED, lineHeight: 1.7 }}>
              Your access to AI generation has been suspended.{genBan.reason ? ` Reason: ${genBan.reason}.` : ''} Contact support to appeal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const topics = subject ? getTopics(subject) : []
  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  const summary = outputType === 'questions'
    ? `Generate ${questionCount} ${difficulty} ${subject || 'study'} question${questionCount !== 1 ? 's' : ''}`
    : outputType === 'flashcards'
    ? `Generate ${subject || 'study'} flashcards for ${topic || 'this topic'}`
    : `Generate a ${difficulty} ${subject || 'study'} worksheet`

  const stepClass = dir === 'back' ? 'slide-from-left' : 'slide-from-right'

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)', overflow: 'hidden' }}>
      <div className="gen-anim-bg" aria-hidden />
      <Navbar profile={profile} bans={bans} />
      <div style={{ paddingTop: '5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

          {/* Progress indicator */}
          <div className="gen-steps" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {STEP_LABELS.map((label, i) => {
              const n = i + 1
              const done = n < step
              const active = n === step
              const reachable = n <= maxStep
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                  <button type="button" onClick={() => reachable && goTo(n)} disabled={!reachable}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.6rem', borderRadius: '9999px', border: 'none', background: active ? GREEN : 'transparent', cursor: reachable ? 'pointer' : 'default' }}>
                    <span style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', background: active ? 'white' : done ? GREEN : 'rgba(34,85,14,0.12)', color: active ? GREEN : done ? 'white' : MUTED }}>
                      {done ? <Check style={{ width: '0.75rem', height: '0.75rem' }} /> : n}
                    </span>
                    <span className="step-label" style={{ fontSize: '0.8125rem', fontWeight: active ? 700 : 500, color: active ? 'white' : done ? GREEN : MUTED }}>{label}</span>
                  </button>
                  {n < STEP_LABELS.length && <div style={{ width: '0.75rem', height: '2px', background: 'rgba(34,85,14,0.15)' }} />}
                </div>
              )
            })}
          </div>

          {/* Free usage strip */}
          {!profile?.is_premium && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {(['questions', 'worksheet'] as const).map(type => {
                const used = type === 'questions' ? usage.questions : usage.worksheets
                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.875rem', borderRadius: '9999px', background: 'white', border: '1px solid rgba(34,85,14,0.12)' }}>
                    <span style={{ fontSize: '0.75rem', color: MUTED, textTransform: 'capitalize' }}>{type}</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {[0, 1].map(i => <div key={i} style={{ width: '1.25rem', height: '0.375rem', borderRadius: '9999px', background: i < used ? GREEN : 'rgba(34,85,14,0.15)' }} />)}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{used}/2</span>
                  </div>
                )
              })}
            </div>
          )}

          {error && (
            <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              <div>
                {error}
                {atLimit && <a href="/pricing" style={{ display: 'block', marginTop: '0.25rem', fontWeight: 600, color: GREEN }}>Upgrade to Premium →</a>}
              </div>
            </div>
          )}

          {/* ── STEP CONTAINER ── */}
          <div key={step} className={`gen-step ${stepClass}`}>

            {/* STEP 1 — Category */}
            {step === 1 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                  <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, marginBottom: '0.375rem' }}>What would you like to study?</h1>
                  <p style={{ color: MUTED }}>Choose a subject area to get started</p>
                </div>
                <div className="cat-grid">
                  {CATEGORIES.map((c, i) => {
                    const selected = category === c.id
                    const Icon = c.icon
                    return (
                      <button key={c.id} type="button" onClick={() => selectCategory(c.id)}
                        className="cat-card" style={{ animationDelay: `${i * 0.05}s`, borderColor: selected ? GREEN : 'rgba(34,85,14,0.12)', background: selected ? GREEN : 'white', color: selected ? 'white' : INK }}>
                        {selected && <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}><Check style={{ width: '1rem', height: '1rem', color: 'white' }} /></span>}
                        <Icon style={{ width: '2rem', height: '2rem', color: selected ? 'white' : GREEN, marginBottom: '0.625rem' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.25, textAlign: 'center' }}>{c.id}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 2 — Subject */}
            {step === 2 && (
              <div className="card" style={{ padding: '1.75rem' }}>
                <button type="button" onClick={() => goTo(1)} style={backLink}><ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} /> Category</button>
                <h2 style={stepTitle}>Now pick your subject</h2>
                <p style={{ color: MUTED, fontSize: '0.9375rem', marginBottom: '1.25rem' }}>{category}</p>
                {category === 'Other' ? (
                  <div>
                    <label className="label">Enter your subject</label>
                    <input value={subject} onChange={e => setSubject(e.target.value)} className="input" placeholder="e.g. Marine Biology, Music Production" />
                    <button type="button" disabled={!subject.trim()} onClick={() => goTo(3)} className="btn-primary" style={{ marginTop: '1.25rem', width: '100%', justifyContent: 'center', opacity: subject.trim() ? 1 : 0.5 }}>
                      Continue <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                    {(SUBJECTS_BY_CATEGORY[category] ?? []).map((subj, i) => (
                      <button key={subj} type="button" onClick={() => selectSubject(subj)}
                        className="subj-pill" style={{ animationDelay: `${i * 0.03}s`, borderColor: subject === subj ? GREEN : 'rgba(34,85,14,0.18)', background: subject === subj ? 'rgba(34,85,14,0.08)' : 'white', color: subject === subj ? GREEN : INK, fontWeight: subject === subj ? 700 : 500 }}>
                        {subj}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 — Topic */}
            {step === 3 && (
              <div className="card" style={{ padding: '1.75rem' }}>
                <button type="button" onClick={() => goTo(2)} style={backLink}><ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} /> Subject</button>
                <h2 style={stepTitle}>What topic within {subject}?</h2>

                {topics.length < 10 && topicChoice !== CUSTOM ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginBottom: '1rem' }}>
                    {topics.map((tp, i) => (
                      <button key={tp} type="button" onClick={() => { setTopicChoice(tp); setTopic(tp) }}
                        className="subj-pill" style={{ animationDelay: `${i * 0.03}s`, borderColor: topic === tp ? GREEN : 'rgba(34,85,14,0.18)', background: topic === tp ? 'rgba(34,85,14,0.08)' : 'white', color: topic === tp ? GREEN : INK, fontWeight: topic === tp ? 700 : 500 }}>
                        {tp}
                      </button>
                    ))}
                    <button type="button" onClick={() => { setTopicChoice(CUSTOM); setTopic('') }}
                      className="subj-pill" style={{ borderColor: 'rgba(34,85,14,0.18)', background: 'white', color: MUTED, fontStyle: 'italic' }}>
                      ✏️ Custom topic
                    </button>
                  </div>
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="topic-dropdown" style={{ position: 'relative' }}>
                      <select value={topicChoice} onChange={e => { const v = e.target.value; setTopicChoice(v); setTopic(v === CUSTOM ? '' : v) }}
                        className="input" style={{ appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}>
                        <option value="">Select a topic…</option>
                        {topics.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                        <option value={CUSTOM}>✏️ Other / Custom topic</option>
                      </select>
                      <ChevronDown style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: MUTED, pointerEvents: 'none' }} />
                    </div>
                  </div>
                )}

                {topicChoice === CUSTOM && (
                  <input value={topic} onChange={e => setTopic(e.target.value)} className="input" placeholder="Type your own topic…" style={{ marginBottom: '1rem' }} autoFocus />
                )}

                {/* Upload toggle */}
                <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.1)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: useUpload ? '1rem' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <FileUp style={{ width: '1.125rem', height: '1.125rem', color: GREEN }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: INK }}>Upload my notes <span style={{ fontWeight: 400, color: MUTED, fontSize: '0.8125rem' }}>(optional)</span></p>
                        <p style={{ fontSize: '0.8125rem', color: MUTED }}>PDF, images, PPTX, DOCX, TXT</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setUseUpload(u => !u); removeUpload() }}
                      style={{ width: '2.75rem', height: '1.5rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: useUpload ? GREEN : 'rgba(34,85,14,0.2)', position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '1.125rem', height: '1.125rem', borderRadius: '50%', background: 'white', position: 'absolute', top: '0.1875rem', transition: 'all 0.2s', left: useUpload ? '1.4375rem' : '0.1875rem', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>
                  {useUpload && (
                    <div>
                      {!uploadedFile ? (
                        <div>
                          <div
                            onClick={() => fileRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                            onDragEnter={e => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
                            onDrop={e => {
                              e.preventDefault(); setIsDragging(false)
                              const file = e.dataTransfer.files?.[0]
                              if (file) { const dt = new DataTransfer(); dt.items.add(file); handleFileUpload({ target: { files: dt.files } } as any) }
                            }}
                            style={{ border: `2px dashed ${isDragging ? GREEN : 'rgba(34,85,14,0.3)'}`, borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: isDragging ? 'rgba(34,85,14,0.04)' : 'white' }}>
                            <Upload style={{ width: '1.5rem', height: '1.5rem', color: isDragging ? GREEN : MUTED, margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: INK, marginBottom: '0.25rem' }}>{isDragging ? 'Drop it here!' : 'Drag & drop or click to upload'}</p>
                            <p style={{ fontSize: '0.75rem', color: MUTED }}>PDF, images, PPTX, DOCX, TXT — max 20MB</p>
                          </div>
                          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.pptx,.ppt,.docx,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
                          {uploadError && <p style={{ fontSize: '0.8125rem', color: 'rgb(163,45,45)', marginTop: '0.5rem' }}>{uploadError}</p>}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'white', border: '1px solid rgba(34,85,14,0.2)' }}>
                          {uploadParsing ? (
                            <>
                              <div style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(34,85,14,0.2)', borderTop: `2px solid ${GREEN}`, borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                              <p style={{ fontSize: '0.875rem', color: MUTED }}>Reading your notes...</p>
                            </>
                          ) : (
                            <>
                              <FileText style={{ width: '1.25rem', height: '1.25rem', color: GREEN, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedFile.name}</p>
                                <p style={{ fontSize: '0.75rem', color: 'rgb(59,109,17)' }}>✓ Notes extracted successfully</p>
                              </div>
                              <button type="button" onClick={removeUpload} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, padding: '0.25rem', display: 'flex' }}>
                                <X style={{ width: '1rem', height: '1rem' }} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button type="button" disabled={!topic.trim()} onClick={() => goTo(4)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: topic.trim() ? 1 : 0.5 }}>
                  Continue <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            )}

            {/* STEP 4 — Options */}
            {step === 4 && (
              <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <button type="button" onClick={() => goTo(3)} style={backLink}><ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} /> Topic</button>
                <h2 style={{ ...stepTitle, marginBottom: 0 }}>Customize your {outputType === 'questions' ? 'questions' : outputType === 'flashcards' ? 'flashcards' : 'worksheet'}</h2>

                {/* Output type */}
                <div>
                  <label className="label">Output type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {([
                      { value: 'questions', icon: BookOpen, label: 'Questions', desc: 'MC & free response' },
                      { value: 'worksheet', icon: FileText, label: 'Worksheet', desc: 'Visual study sheet' },
                      { value: 'flashcards', icon: Layers, label: 'Flashcards', desc: 'Flip cards for quick memorization' },
                    ] as const).map(opt => (
                      <button key={opt.value} type="button" onClick={() => setOutputType(opt.value)}
                        style={{ padding: '1rem', borderRadius: '0.75rem', border: `2px solid ${outputType === opt.value ? GREEN : 'rgba(34,85,14,0.15)'}`, background: outputType === opt.value ? 'rgba(34,85,14,0.04)' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                        <opt.icon style={{ width: '1.25rem', height: '1.25rem', color: outputType === opt.value ? GREEN : MUTED, marginBottom: '0.5rem' }} />
                        <p style={{ fontWeight: 600, color: INK, fontSize: '0.9375rem' }}>{opt.label}</p>
                        <p style={{ fontSize: '0.8125rem', color: MUTED }}>{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grade pills */}
                <div>
                  <label className="label">Grade level</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {GRADES.map(g => (
                      <button key={g.value} type="button" onClick={() => setGrade(g.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '9999px', border: `2px solid ${grade === g.value ? GREEN : 'rgba(34,85,14,0.15)'}`, background: grade === g.value ? GREEN : 'white', color: grade === g.value ? 'white' : INK, fontWeight: grade === g.value ? 700 : 500, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="label">Difficulty</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {([
                      { value: 'easy', label: 'Easy', emoji: '🌱', color: 'rgb(34,85,14)' },
                      { value: 'medium', label: 'Medium', emoji: '📚', color: 'rgb(202,138,4)' },
                      { value: 'hard', label: 'Hard', emoji: '🔥', color: 'rgb(217,119,6)' },
                      { value: 'expert', label: 'Expert', emoji: '⚡', color: 'rgb(220,38,38)' },
                    ] as const).map(d => (
                      <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                        style={{ padding: '0.75rem 0.5rem', borderRadius: '0.75rem', border: `2px solid ${difficulty === d.value ? d.color : 'rgba(34,85,14,0.15)'}`, background: difficulty === d.value ? `${d.color}12` : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{d.emoji}</div>
                        <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: difficulty === d.value ? d.color : INK }}>{d.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question-only options */}
                {outputType === 'questions' && (
                  <>
                    <div>
                      <label className="label">Number of questions</label>
                      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: GREEN, lineHeight: 1 }}>{questionCount}</span>
                      </div>
                      <input type="range" min={5} max={profile?.is_premium ? 30 : 12} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}
                        style={{ width: '100%', accentColor: GREEN, cursor: 'pointer' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: MUTED, marginTop: '0.25rem' }}>
                        <span>5</span>
                        <span>{profile?.is_premium ? '30 (Premium)' : <a href="/pricing" style={{ color: GREEN, fontWeight: 600, textDecoration: 'none' }}>12 — Upgrade for 30 ⚡</a>}</span>
                      </div>
                    </div>
                    <div>
                      <label className="label">Question types</label>
                      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                        {([
                          { value: 'mc', label: 'Multiple Choice' },
                          { value: 'fr', label: 'Free Response' },
                          { value: 'mixed', label: 'Mixed' },
                        ] as const).map(qt => (
                          <button key={qt.value} type="button" onClick={() => setQType(qt.value)}
                            style={{ flex: '1 1 30%', minWidth: '100px', padding: '0.625rem 1rem', borderRadius: '0.75rem', border: `2px solid ${qtMode === qt.value ? GREEN : 'rgba(34,85,14,0.15)'}`, background: qtMode === qt.value ? 'rgba(34,85,14,0.06)' : 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: qtMode === qt.value ? 700 : 500, color: qtMode === qt.value ? GREEN : MUTED, transition: 'all 0.2s' }}>
                            {qt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Additional focus */}
                <div>
                  <label className="label">Additional focus <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: MUTED }}>(optional)</span></label>
                  <input value={focus} onChange={e => setFocus(e.target.value)} className="input" placeholder="e.g. focus only on word problems" />
                </div>

                <button type="button" onClick={() => goTo(5)} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Review & Generate <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            )}

            {/* STEP 5 — Generate */}
            {step === 5 && (
              <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <button type="button" onClick={() => goTo(4)} style={{ ...backLink, margin: '0 auto 1.25rem' }}><ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} /> Options</button>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
                <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: INK, marginBottom: '0.5rem' }}>Ready to generate!</h2>
                <p style={{ color: MUTED, marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  {topic} · {grade === 'college' ? 'College' : grade} · {difficultyLabel}
                  {outputType === 'questions' ? ` · ${qtMode === 'mixed' ? 'Mixed' : qtMode === 'fr' ? 'Free Response' : 'Multiple Choice'}` : ''}
                  {useUpload && uploadedText ? ' · from your notes' : ''}
                </p>

                <button type="submit" disabled={atLimit || uploadParsing} className={`gen-cta ${!atLimit && !uploadParsing ? 'gen-cta-ready' : ''}`}
                  style={{ width: '100%', justifyContent: 'center', padding: '1.1rem', fontSize: '1.0625rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.875rem', border: 'none', cursor: atLimit || uploadParsing ? 'not-allowed' : 'pointer', color: 'white', fontWeight: 700, background: atLimit ? MUTED : `linear-gradient(135deg, ${GREEN}, rgb(59,130,46))` }}>
                  {atLimit ? (
                    <><Zap style={{ width: '1rem', height: '1rem' }} /> Daily limit reached — Upgrade to continue</>
                  ) : uploadParsing ? (
                    'Reading your notes...'
                  ) : (
                    <>{summary}{useUpload && uploadedText ? ' from my notes' : ''} <ArrowRight style={{ width: '1.125rem', height: '1.125rem' }} /></>
                  )}
                </button>
                {atLimit && <a href="/pricing" style={{ display: 'inline-block', marginTop: '1rem', fontWeight: 600, color: GREEN, textDecoration: 'none' }}>Upgrade to Premium →</a>}
              </form>
            )}
          </div>
        </div>
      </div>

      <LimitReachedModal
        open={limitModal.open}
        onClose={() => setLimitModal({ open: false, bonus: 0 })}
        limitLabel="2 free generations"
        bonusRemaining={limitModal.bonus}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideR { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideL { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
        .slide-from-right { animation: slideR 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .slide-from-left { animation: slideL 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes catIn { from { opacity: 0; transform: translateY(14px); } }
        @keyframes pillUp { from { opacity: 0; transform: translateY(10px); } }
        @keyframes driftBG { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(-3%, 2%) scale(1.08); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes ctaPulse { 0%,100% { box-shadow: 0 8px 28px rgba(34,85,14,0.25); } 50% { box-shadow: 0 8px 40px rgba(34,85,14,0.5); } }
        .gen-anim-bg {
          position: fixed; inset: -10%; z-index: 0; pointer-events: none;
          background:
            radial-gradient(40% 40% at 20% 25%, rgba(34,85,14,0.10), transparent 70%),
            radial-gradient(45% 45% at 80% 30%, rgba(59,130,46,0.10), transparent 70%),
            radial-gradient(50% 50% at 55% 85%, rgba(232,160,32,0.08), transparent 70%);
          animation: driftBG 18s ease-in-out infinite;
        }
        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .cat-card {
          position: relative; min-height: 120px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; padding: 1rem 0.75rem;
          border-radius: 1rem; border: 2px solid rgba(34,85,14,0.12); cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          animation: catIn 0.4s ease both;
        }
        .cat-card:hover { transform: scale(1.05); border-color: ${GREEN}; box-shadow: 0 10px 28px rgba(34,85,14,0.14); }
        .subj-pill {
          padding: 0.55rem 1rem; border-radius: 9999px; border: 2px solid rgba(34,85,14,0.18);
          font-size: 0.875rem; cursor: pointer; transition: all 0.15s ease; animation: pillUp 0.35s ease both;
        }
        .subj-pill:hover { border-color: ${GREEN}; transform: translateY(-1px); }
        .gen-cta-ready { animation: ctaPulse 2.2s ease-in-out infinite; }
        .gen-cta-ready:hover { transform: translateY(-2px); }
        .gen-cta { transition: transform 0.2s ease; }
        @media (max-width: 640px) {
          .cat-grid { grid-template-columns: repeat(2, 1fr); }
          .gen-steps .step-label { display: none; }
        }
      `}</style>
    </div>
  )
}

const backLink: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, fontSize: '0.8125rem', fontWeight: 600, padding: 0, marginBottom: '1rem' }
const stepTitle: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: INK, marginBottom: '0.75rem' }

function LoadingScreen({ isPremium, subject, topic, finished }: { outputType: OutputType; isPremium: boolean; subject: string; topic: string; finished: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const totalSeconds = isPremium ? 18 : 30
  const [countdown, setCountdown] = useState(totalSeconds)

  // Progress bar: synced to the countdown while waiting; jumps to 100% when done.
  // Free users fill all the way to 100% (in step with the 30s timer); premium
  // fills toward 85% while the API responds, then snaps to 100%.
  const progress = finished
    ? 100
    : isPremium
      ? Math.min(85, ((totalSeconds - countdown) / totalSeconds) * 85)
      : Math.min(100, ((totalSeconds - countdown) / totalSeconds) * 100)

  // Stable floating particles.
  const particles = useRef(
    Array.from({ length: 14 }, () => ({
      left: Math.random() * 100,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 8,
      dur: 7 + Math.random() * 8,
      opacity: 0.15 + Math.random() * 0.35,
    }))
  ).current

  const messages = [
    'Analyzing the curriculum...',
    'Crafting challenging questions...',
    'Adding educational context...',
    'Calibrating difficulty level...',
    'Reviewing for accuracy...',
    'Polishing the explanations...',
    'Almost ready...',
  ]

  useEffect(() => {
    const interval = setInterval(() => setMessageIndex(i => (i + 1) % messages.length), 2000)
    return () => clearInterval(interval)
  }, [])

  // Tick every second so both the free countdown display and the progress bar
  // stay in sync (premium doesn't show the number but still advances the bar).
  useEffect(() => {
    const interval = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgb(240,247,234), rgb(228,242,218), rgb(240,247,234))', backgroundSize: '220% 220%', animation: 'genGradientShift 12s ease infinite' }}>

      {/* Floating particles */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {particles.map((p, i) => (
          <span key={i} style={{ position: 'absolute', bottom: '-24px', left: `${p.left}%`, width: `${p.size}px`, height: `${p.size}px`, borderRadius: '50%', background: 'rgb(34,85,14)', opacity: p.opacity * 0.6, animation: `genFloat ${p.dur}s linear ${p.delay}s infinite` }} />
        ))}
      </div>

      <div style={{ textAlign: 'center', maxWidth: '34rem', width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Glowing icon */}
        <div className="gen-icon-glow" style={{ width: '128px', height: '128px', margin: '0 auto 2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(34,85,14,0.14), rgba(34,85,14,0.02))' }}>
          <BookOpen style={{ width: '80px', height: '80px', color: 'rgb(34,85,14)' }} strokeWidth={1.5} />
        </div>

        {/* Subject / topic */}
        {(topic || subject) && (
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.375rem', lineHeight: 1.25 }}>
            {topic || subject}
          </p>
        )}
        {subject && topic && (
          <p style={{ fontSize: '0.9375rem', color: 'rgb(107,107,88)', marginBottom: '1.75rem' }}>{subject}</p>
        )}

        {/* Rotating message */}
        <p key={messageIndex} style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'rgb(34,85,14)', marginBottom: '1.5rem', minHeight: '1.6rem', animation: 'genMsgFade 0.5s ease' }}>
          {messages[messageIndex]}
        </p>

        {/* Progress bar fills to ~80% */}
        <div style={{ width: '100%', maxWidth: '26rem', margin: '0 auto 1.75rem', height: '8px', background: 'rgba(34,85,14,0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '9999px', background: 'linear-gradient(90deg, rgb(34,85,14), rgb(74,122,40))', boxShadow: '0 0 14px rgba(34,85,14,0.35)', width: `${progress}%`, transition: 'width 0.3s ease' }} />
        </div>

        {/* Countdown (free) or bouncing dots (premium) */}
        {isPremium ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.0625rem', color: 'rgb(26,26,20)', fontWeight: 600 }}>Crafting your questions</span>
            <span style={{ display: 'inline-flex', gap: '0.3rem' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'rgb(34,85,14)', animation: `genBounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </span>
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '3.75rem', fontWeight: 800, color: 'rgb(34,85,14)', lineHeight: 1 }}>{countdown}</div>
            <p style={{ fontSize: '0.9375rem', color: 'rgb(107,107,88)', marginTop: '0.5rem' }}>
              Generating your {subject ? `${subject} ` : ''}{topic || 'study'} content...
            </p>
          </div>
        )}

        {/* Branding */}
        <div className="gen-brand" style={{ marginTop: '2.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '1.5rem', height: '1.5rem', borderRadius: '0.4rem', background: 'rgb(34,85,14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: '0.9rem', height: '0.9rem', color: 'white' }} strokeWidth={2.5} />
          </span>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1rem', color: 'rgb(26,26,20)', letterSpacing: '0.02em' }}>AceForge AI</span>
        </div>
      </div>

      <style>{`
        @keyframes genGradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes genFloat { 0% { transform: translateY(0) scale(1); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 0.6; } 100% { transform: translateY(-110vh) scale(1.15); opacity: 0; } }
        @keyframes genMsgFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes genBounce { 0%,100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-7px); opacity: 1; } }
        @keyframes genIconGlow { 0%,100% { box-shadow: 0 0 30px rgba(34,85,14,0.5); transform: scale(1); } 50% { box-shadow: 0 0 62px rgba(122,182,72,0.7); transform: scale(1.06); } }
        @keyframes genBrandPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        .gen-icon-glow { animation: genIconGlow 2.4s ease-in-out infinite; }
        .gen-brand { animation: genBrandPulse 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

