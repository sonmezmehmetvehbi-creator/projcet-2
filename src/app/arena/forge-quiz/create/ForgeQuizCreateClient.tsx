'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Loader2, Plus, Sparkles,
  Trash2, Image as ImageIcon, PencilLine, Bot, FileText, Link2, Gamepad2,
} from 'lucide-react'
import { SUBJECTS_BY_CATEGORY, getTopics } from '@/lib/subjects'

// ── Constants ──
const CATEGORIES = Object.keys(SUBJECTS_BY_CATEGORY).filter((c) => SUBJECTS_BY_CATEGORY[c].length > 0)
const BANNER_COLORS = [
  { name: 'Purple', value: '#7c3aed' }, { name: 'Green', value: '#22855e' }, { name: 'Blue', value: '#2563eb' },
  { name: 'Red', value: '#dc2626' }, { name: 'Orange', value: '#ea580c' }, { name: 'Pink', value: '#db2777' },
]
const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', emoji: '🌱' }, { value: 'medium', label: 'Medium', emoji: '📚' },
  { value: 'hard', label: 'Hard', emoji: '🔥' }, { value: 'expert', label: 'Expert', emoji: '⚡' },
]
export const QTYPES = [
  { value: 'mc', label: 'Multiple Choice' }, { value: 'tf', label: 'True/False' },
  { value: 'slider', label: 'Slider' }, { value: 'fr', label: 'Free Response' },
] as const
export const POINTS = [{ v: 0, label: 'No Points (0×)' }, { v: 1, label: 'Normal (1×)' }, { v: 2, label: 'Double (2×)' }]
const DURATIONS = [
  { value: '1h', label: '1 hour' }, { value: '6h', label: '6 hours' }, { value: '12h', label: '12 hours' },
  { value: '24h', label: '24 hours' }, { value: '3d', label: '3 days' }, { value: '7d', label: '7 days' },
]

export type QType = 'mc' | 'tf' | 'slider' | 'fr'
export type Question = {
  _id: string
  question_text: string
  question_type: QType
  options: string[]
  correct_index: number
  correct_answer: string
  slider_min: number
  slider_max: number
  slider_correct: number
  points_multiplier: number
  time_limit: number | null
  speed_bonus_enabled: boolean
  image_url: string | null
}

let idc = 0
export function newQuestion(type: QType = 'mc'): Question {
  return {
    _id: `q${++idc}_${Date.now()}`,
    question_text: '',
    question_type: type,
    options: type === 'tf' ? ['True', 'False'] : ['', '', '', ''],
    correct_index: 0,
    correct_answer: '',
    slider_min: 0,
    slider_max: 100,
    slider_correct: 50,
    points_multiplier: 1,
    time_limit: null,
    speed_bonus_enabled: true,
    image_url: null,
  }
}
function fromAI(q: any): Question {
  const base = newQuestion(q.question_type ?? 'mc')
  return {
    ...base,
    question_text: q.question_text ?? '',
    question_type: q.question_type ?? 'mc',
    options: Array.isArray(q.options) ? q.options : base.options,
    correct_index: typeof q.correct_index === 'number' ? q.correct_index : 0,
    correct_answer: q.correct_answer ?? '',
    slider_min: q.slider_min ?? 0,
    slider_max: q.slider_max ?? 100,
    slider_correct: q.slider_correct ?? 50,
    points_multiplier: [0, 1, 2].includes(q.points_multiplier) ? q.points_multiplier : 1,
    time_limit: q.time_limit ?? null,
    speed_bonus_enabled: q.speed_bonus_enabled ?? true,
  }
}

// ── Shared styles ──
export const label: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(196,181,253)', marginBottom: '0.5rem' }
export const input: React.CSSProperties = { width: '100%', padding: '0.7rem 0.9rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.35)', color: 'white', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }
export const sel: React.CSSProperties = { ...input, colorScheme: 'dark', cursor: 'pointer' }
export const card: React.CSSProperties = { borderRadius: '1.25rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(19,19,31,0.7)', padding: '1.5rem' }

// Shared public/private visibility toggle (create Step 1 + edit/manage screen).
export function PublicToggle({ isPublic, onChange, disabled = false }: { isPublic: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderRadius: '0.875rem', border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(255,255,255,0.03)', padding: '0.9rem 1.1rem' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'white', fontWeight: 800, fontSize: '0.9375rem' }}>
          <span aria-hidden>{isPublic ? '🌐' : '🔒'}</span> Make this quiz public
        </div>
        <div style={{ color: 'rgb(148,148,168)', fontSize: '0.78rem', marginTop: '0.25rem', lineHeight: 1.4 }}>
          Public quizzes appear in Browse for anyone to play, host, or save. Others cannot edit your questions.
        </div>
      </div>
      <button type="button" role="switch" aria-checked={isPublic} aria-label="Make this quiz public" disabled={disabled} onClick={() => onChange(!isPublic)}
        style={{ position: 'relative', flexShrink: 0, width: '3rem', height: '1.6rem', borderRadius: '9999px', border: 'none', cursor: disabled ? 'default' : 'pointer', background: isPublic ? '#22c55e' : 'rgba(255,255,255,0.18)', transition: 'background 0.2s', opacity: disabled ? 0.6 : 1 }}>
        <span style={{ position: 'absolute', top: '0.2rem', left: isPublic ? '1.6rem' : '0.2rem', width: '1.2rem', height: '1.2rem', borderRadius: '9999px', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
      </button>
    </div>
  )
}
export const pill = (active: boolean): React.CSSProperties => ({ padding: '0.5rem 0.9rem', borderRadius: '9999px', border: `1px solid ${active ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.12)'}`, background: active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)', color: active ? 'rgb(196,181,253)' : 'rgb(180,180,195)', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' })

export function isValid(q: Question): boolean {
  if (!q.question_text.trim()) return false
  if (q.question_type === 'mc') return q.options.filter((o) => o.trim()).length >= 2 && !!q.options[q.correct_index]?.trim()
  if (q.question_type === 'tf') return true
  if (q.question_type === 'slider') return q.slider_max > q.slider_min && q.slider_correct >= q.slider_min && q.slider_correct <= q.slider_max
  if (q.question_type === 'fr') return !!q.correct_answer.trim()
  return false
}

export default function ForgeQuizCreateClient({ defaultName }: { defaultName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1
  const [title, setTitle] = useState('')
  const [welcome, setWelcome] = useState('')
  const [banner, setBanner] = useState('#7c3aed')
  const [playMode, setPlayMode] = useState<'self_paced' | 'live'>('self_paced')
  const [timePerQ, setTimePerQ] = useState(20)
  const [maxPlayers, setMaxPlayers] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  // Launch step
  const [duration, setDuration] = useState('24h')
  const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset')
  const [customValue, setCustomValue] = useState(3)
  const [customUnit, setCustomUnit] = useState<'hours' | 'days'>('hours')
  const [allowReplay, setAllowReplay] = useState(true)
  const [customInstructions, setCustomInstructions] = useState('')

  // Step 2
  const [source, setSource] = useState<'manual' | 'ai_topic' | 'ai_pdf' | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [aiCount, setAiCount] = useState(10)
  const [aiTypes, setAiTypes] = useState<QType[]>(['mc'])
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [pdfName, setPdfName] = useState('')
  const [pdfText, setPdfText] = useState('')
  const [pdfParsing, setPdfParsing] = useState(false)
  const pdfRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Live Room setup (shown after creating a live-mode quiz, before opening the room)
  const [showLiveSetup, setShowLiveSetup] = useState(false)
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null)
  const [liveMaxPlayers, setLiveMaxPlayers] = useState('')
  const [liveDisplayMode, setLiveDisplayMode] = useState<'screen_share' | 'everyone_sees'>('screen_share')
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const subjects = category ? SUBJECTS_BY_CATEGORY[category] ?? [] : []
  const topics = useMemo(() => (subject ? getTopics(subject) : []), [subject])

  // ── Question ops ──
  const addQuestion = (t: QType = 'mc') => setQuestions((qs) => (qs.length >= 50 ? qs : [...qs, newQuestion(t)]))
  const updateQuestion = (id: string, patch: Partial<Question>) => setQuestions((qs) => qs.map((q) => (q._id === id ? { ...q, ...patch } : q)))
  const removeQuestion = (id: string) => setQuestions((qs) => qs.filter((q) => q._id !== id))
  const move = (i: number, dir: -1 | 1) => setQuestions((qs) => {
    const j = i + dir
    if (j < 0 || j >= qs.length) return qs
    const n = [...qs]; [n[i], n[j]] = [n[j], n[i]]; return n
  })

  function changeType(id: string, t: QType) {
    const fresh = newQuestion(t)
    updateQuestion(id, { question_type: t, options: fresh.options, correct_index: 0, correct_answer: '', slider_min: 0, slider_max: 100, slider_correct: 50 })
  }

  // Hidden file input per question, keyed by question id, so the button can
  // reliably trigger the native picker.
  const imageRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, id: string) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be under 5MB'); return }
    setUploadError('')
    updateQuestion(id, { image_url: '__uploading__' })
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/arena/forge-quiz/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) updateQuestion(id, { image_url: data.url })
      else { updateQuestion(id, { image_url: null }); setUploadError(data.error || 'Upload failed') }
    } catch {
      updateQuestion(id, { image_url: null }); setUploadError('Upload failed')
    }
  }

  async function extractPdf(file: File) {
    setPdfParsing(true); setGenError('')
    try {
      const pdfjs: any = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
      const buf = await file.arrayBuffer()
      const doc = await pdfjs.getDocument({ data: buf }).promise
      let text = ''
      for (let p = 1; p <= Math.min(doc.numPages, 30); p++) {
        const page = await doc.getPage(p)
        const content = await page.getTextContent()
        text += content.items.map((it: any) => it.str).join(' ') + '\n'
      }
      setPdfText(text)
      setPdfName(file.name)
    } catch (e: any) {
      setGenError('Could not read that PDF. Try another file.')
      setPdfName('')
      setPdfText('')
    } finally {
      setPdfParsing(false)
    }
  }

  async function generate(fromPdf: boolean) {
    setGenError(''); setGenerating(true)
    try {
      if (!fromPdf && (!subject || !topic)) throw new Error('Pick a subject and topic first.')
      if (fromPdf && !pdfText) throw new Error('Upload a PDF first.')
      const res = await fetch('/api/arena/forge-quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, difficulty, count: aiCount, questionTypes: aiTypes, uploadedText: fromPdf ? pdfText : '', customInstructions }),
      })
      const data = await res.json()
      if (data.error || !data.questions?.length) throw new Error(data.error || 'No questions generated')
      setQuestions(data.questions.map(fromAI))
    } catch (e: any) {
      setGenError(e.message || 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  async function submit() {
    setSubmitError(''); setSubmitting(true)
    try {
      const customDurationHours = durationMode === 'custom'
        ? Math.max(1, Math.round(customValue * (customUnit === 'days' ? 24 : 1)))
        : null
      const payload = {
        title, welcomeMessage: welcome, bannerColor: banner, playMode,
        timePerQuestion: timePerQ, maxPlayers: maxPlayers ? Number(maxPlayers) : null,
        duration, customDurationHours, allowReplay, isPublic, subject, topic,
        questions: questions.map((q) => ({
          question_text: q.question_text, question_type: q.question_type,
          options: q.question_type === 'mc' || q.question_type === 'tf' ? q.options : null,
          correct_index: q.question_type === 'mc' || q.question_type === 'tf' ? q.correct_index : null,
          correct_answer: q.question_type === 'fr' ? q.correct_answer : null,
          slider_min: q.question_type === 'slider' ? q.slider_min : null,
          slider_max: q.question_type === 'slider' ? q.slider_max : null,
          slider_correct: q.question_type === 'slider' ? q.slider_correct : null,
          points_multiplier: q.points_multiplier, time_limit: q.time_limit,
          speed_bonus_enabled: q.speed_bonus_enabled,
          image_url: q.image_url && q.image_url !== '__uploading__' ? q.image_url : null,
        })),
      }
      const res = await fetch('/api/arena/forge-quiz/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.quizId) throw new Error(data.error || 'Failed to create quiz')
      // Self-paced quizzes go to the shareable lobby. Live Room quizzes move to a
      // dedicated confirmation screen that opens the real live waiting room —
      // they never touch the self-paced lobby / its room code.
      if (playMode === 'live') {
        setCreatedQuizId(data.quizId)
        setLiveMaxPlayers(maxPlayers)
        setShowLiveSetup(true)
        setSubmitting(false)
        return
      }
      router.push(`/arena/forge-quiz/${data.quizId}/lobby`)
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to create quiz')
      setSubmitting(false)
    }
  }

  async function createLiveRoom() {
    if (!createdQuizId) return
    setCreatingRoom(true); setSubmitError('')
    try {
      const res = await fetch('/api/arena/forge-quiz/live/start-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: createdQuizId, displayMode: liveDisplayMode, maxPlayers: liveMaxPlayers ? Number(liveMaxPlayers) : null }),
      })
      const data = await res.json()
      if (!data.sessionId) throw new Error(data.error || 'Failed to create live room')
      router.push(`/arena/forge-quiz/live/${data.sessionId}/host`)
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to create live room')
      setCreatingRoom(false)
    }
  }

  const validQuestions = questions.filter(isValid)
  const canProceed = step === 1 ? title.trim().length > 0 : step === 2 ? validQuestions.length >= 1 : true
  const STEP_LABELS = ['Setup', 'Questions', 'Review', 'Launch']
  const estMinutes = Math.max(1, Math.round((questions.length * timePerQ) / 60))

  // ── Live Room confirmation screen ──
  if (showLiveSetup) {
    return (
      <div style={{ maxWidth: '38rem', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 800, color: 'rgb(196,181,253)', marginBottom: '0.75rem' }}>
          <Gamepad2 style={{ width: '1.1rem', height: '1.1rem' }} /> LIVE ROOM SETUP
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '1.5rem' }}>Ready to go live?</h1>

        {/* Summary card */}
        <div style={{ borderRadius: '1rem', border: `1px solid ${banner}`, background: `linear-gradient(135deg, ${banner}, rgba(19,19,31,0.9))`, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ width: '1.5rem', height: '1.5rem', borderRadius: '0.375rem', background: banner, border: '2px solid rgba(255,255,255,0.6)' }} />
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{title || 'Untitled quiz'}</h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>{questions.length} question{questions.length === 1 ? '' : 's'} · {timePerQ}s per question</p>
        </div>

        {/* Max players */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={label}>Max players (optional)</label>
          <input style={input} type="number" min={1} value={liveMaxPlayers} onChange={(e) => setLiveMaxPlayers(e.target.value)} placeholder="Unlimited" />
        </div>

        {/* Display mode toggle */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={label}>Display mode</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {([
              { v: 'screen_share' as const, title: 'Screen Share 📺', desc: 'Questions show on the host screen; players tap colored symbols.' },
              { v: 'everyone_sees' as const, title: 'Everyone Sees 📱', desc: 'Each player also sees the question text on their own device.' },
            ]).map((m) => {
              const active = liveDisplayMode === m.v
              return (
                <button key={m.v} type="button" onClick={() => setLiveDisplayMode(m.v)}
                  style={{ textAlign: 'left', borderRadius: '1rem', border: `1px solid ${active ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.1)'}`, background: active ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', padding: '1rem', cursor: 'pointer' }}>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{m.title}</p>
                  <p style={{ color: 'rgb(148,148,168)', fontSize: '0.78rem', lineHeight: 1.35 }}>{m.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {submitError && <p style={{ margin: '0 0 0.75rem', color: 'rgb(248,113,113)', fontSize: '0.8125rem' }}>{submitError}</p>}
        <button type="button" onClick={createLiveRoom} disabled={creatingRoom}
          style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.5rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, fontSize: '1.05rem', cursor: creatingRoom ? 'wait' : 'pointer' }}>
          {creatingRoom ? <><Loader2 style={{ width: '1.15rem', height: '1.15rem' }} className="animate-spin" /> Opening room…</> : <>Create Live Room <ArrowRight style={{ width: '1.1rem', height: '1.1rem' }} /></>}
        </button>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8125rem', color: 'rgb(148,148,168)' }}>
          Your quiz has been saved. You can relaunch it anytime from the Arena.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '46rem', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.25rem', fontWeight: 800, color: 'white', marginBottom: '0.375rem' }}>⚡ Forge a Quiz</h1>
      <p style={{ color: 'rgb(148,148,168)', marginBottom: '2rem' }}>Kahoot-style quiz — build it, then play live or share a link.</p>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {STEP_LABELS.map((lbl, i) => {
          const n = i + 1, active = n === step, done = n < step
          return (
            <div key={lbl} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: '0.35rem', borderRadius: '9999px', background: active || done ? 'rgb(124,58,237)' : 'rgba(255,255,255,0.1)', marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: active ? 'rgb(196,181,253)' : done ? 'rgb(140,140,160)' : 'rgb(90,90,110)' }}>{n}. {lbl}</span>
            </div>
          )
        })}
      </div>

      {/* Step 1 — Setup */}
      {step === 1 && (
        <div style={card}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={label}>Quiz title</label>
            <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name your quiz" maxLength={70} />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={label}>Welcome message (optional)</label>
            <textarea style={{ ...input, minHeight: '4.5rem', resize: 'vertical', fontFamily: 'inherit' }} value={welcome} onChange={(e) => setWelcome(e.target.value)} maxLength={280} />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={label}>Banner color</label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {BANNER_COLORS.map((c) => (
                <button key={c.value} type="button" onClick={() => setBanner(c.value)} title={c.name}
                  style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: c.value, border: banner === c.value ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: banner === c.value ? `0 0 16px ${c.value}` : 'none' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={label}>Time per question: {timePerQ}s</label>
              <input type="range" min={5} max={60} value={timePerQ} onChange={(e) => setTimePerQ(Number(e.target.value))} style={{ width: '100%', accentColor: 'rgb(124,58,237)' }} />
            </div>
            <div>
              <label style={label}>Max players (optional)</label>
              <input style={input} type="number" min={1} value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} placeholder="Unlimited" />
            </div>
          </div>
          <div style={{ marginTop: '1.25rem' }}>
            <PublicToggle isPublic={isPublic} onChange={setIsPublic} />
          </div>
        </div>
      )}

      {/* Step 2 — Questions */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Source selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            {([
              { v: 'manual', icon: PencilLine, title: 'Manual Entry ✍️', desc: 'Type questions yourself.' },
              { v: 'ai_topic', icon: Bot, title: 'AI from Topic 🤖', desc: 'Pick subject/topic, AI generates.' },
              { v: 'ai_pdf', icon: FileText, title: 'AI from PDF 📄', desc: 'Upload a PDF, AI generates.' },
            ] as const).map((s) => {
              const active = source === s.v
              return (
                <button key={s.v} type="button" onClick={() => setSource(s.v)}
                  style={{ textAlign: 'left', borderRadius: '1rem', border: `1px solid ${active ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.1)'}`, background: active ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', padding: '1rem', cursor: 'pointer' }}>
                  <s.icon style={{ width: '1.3rem', height: '1.3rem', color: active ? 'rgb(196,181,253)' : 'rgb(160,160,180)', marginBottom: '0.4rem' }} />
                  <p style={{ color: 'white', fontWeight: 800, fontSize: '0.9375rem' }}>{s.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgb(148,148,168)' }}>{s.desc}</p>
                </button>
              )
            })}
          </div>

          {/* AI options */}
          {(source === 'ai_topic' || source === 'ai_pdf') && (
            <div style={card}>
              {source === 'ai_topic' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div><label style={label}>Category</label>
                    <select style={sel} value={category} onChange={(e) => { setCategory(e.target.value); setSubject(''); setTopic('') }}>
                      <option value="">Select…</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select></div>
                  <div><label style={label}>Subject</label>
                    <select style={{ ...sel, opacity: subjects.length ? 1 : 0.5 }} disabled={!subjects.length} value={subject} onChange={(e) => { setSubject(e.target.value); setTopic('') }}>
                      <option value="">Select…</option>{subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select></div>
                  <div><label style={label}>Topic</label>
                    <select style={{ ...sel, opacity: topics.length ? 1 : 0.5 }} disabled={!topics.length} value={topic} onChange={(e) => setTopic(e.target.value)}>
                      <option value="">Select…</option>{topics.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select></div>
                </div>
              )}
              {source === 'ai_pdf' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={label}>PDF file (max 20MB)</label>
                  <input ref={pdfRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 20 * 1024 * 1024) { setGenError('PDF too large (max 20MB)'); return } extractPdf(f) } }} />
                  <button type="button" onClick={() => pdfRef.current?.click()} disabled={pdfParsing}
                    style={{ ...input, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: pdfName ? 'white' : 'rgb(148,148,168)' }}>
                    <FileText style={{ width: '1rem', height: '1rem' }} /> {pdfParsing ? 'Reading PDF…' : pdfName || 'Choose a PDF…'}
                  </button>
                </div>
              )}
              <label style={label}>Difficulty</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {DIFFICULTIES.map((d) => <button key={d.value} type="button" onClick={() => setDifficulty(d.value)} style={pill(difficulty === d.value)}>{d.emoji} {d.label}</button>)}
              </div>
              <label style={label}>Question types</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {QTYPES.map((t) => {
                  const active = aiTypes.includes(t.value)
                  return <button key={t.value} type="button" onClick={() => setAiTypes((a) => active ? (a.length > 1 ? a.filter((x) => x !== t.value) : a) : [...a, t.value])} style={pill(active)}>{t.label}</button>
                })}
              </div>
              <label style={label}>Additional instructions (optional)</label>
              <textarea style={{ ...input, minHeight: '3.5rem', resize: 'vertical', fontFamily: 'inherit', marginBottom: '1rem' }} value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Focus on causes of WW2, make questions harder, include more calculation-based problems" maxLength={400} />
              <label style={label}>Number of questions: {aiCount}</label>
              <input type="range" min={5} max={20} value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))} style={{ width: '100%', accentColor: 'rgb(124,58,237)', marginBottom: '1rem' }} />
              <button type="button" onClick={() => generate(source === 'ai_pdf')} disabled={generating}
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))', color: 'white', fontWeight: 800, cursor: generating ? 'wait' : 'pointer' }}>
                {generating ? <><Loader2 style={{ width: '1.1rem', height: '1.1rem' }} className="animate-spin" /> Generating…</> : <><Sparkles style={{ width: '1.1rem', height: '1.1rem' }} /> {source === 'ai_pdf' ? 'Generate from PDF →' : 'Generate Questions →'}</>}
              </button>
              {genError && <p style={{ marginTop: '0.75rem', color: 'rgb(248,113,113)', fontSize: '0.8125rem' }}>{genError}</p>}
            </div>
          )}

          {/* Question editors (shared by all sources) */}
          {(source === 'manual' || questions.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {questions.map((q, i) => (
                <QuestionEditor key={q._id} q={q} index={i} total={questions.length}
                  onChange={(patch) => updateQuestion(q._id, patch)} onChangeType={(t) => changeType(q._id, t)}
                  onRemoveQ={() => removeQuestion(q._id)} onMove={(d) => move(i, d)}
                  registerImageRef={(el) => { imageRefs.current[q._id] = el }}
                  onImageClick={() => imageRefs.current[q._id]?.click()}
                  onImageChange={(e) => handleImageUpload(e, q._id)}
                  defaultTime={timePerQ} valid={isValid(q)} />
              ))}
              {questions.length < 50 && (
                <button type="button" onClick={() => addQuestion('mc')}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', borderRadius: '0.875rem', border: '1px dashed rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.08)', color: 'rgb(196,181,253)', fontWeight: 800, cursor: 'pointer' }}>
                  <Plus style={{ width: '1.1rem', height: '1.1rem' }} /> Add Question
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div style={card}>
          <p style={{ color: 'white', fontWeight: 800, marginBottom: '0.25rem' }}>{questions.length} question{questions.length === 1 ? '' : 's'} · ~{estMinutes} min</p>
          <p style={{ fontSize: '0.8125rem', color: 'rgb(148,148,168)', marginBottom: '1.25rem' }}>{validQuestions.length} valid · edit any question back in step 2.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '28rem', overflowY: 'auto' }}>
            {questions.map((q, i) => (
              <div key={q._id} style={{ borderRadius: '0.875rem', border: `1px solid ${isValid(q) ? 'rgba(255,255,255,0.08)' : 'rgba(248,113,113,0.4)'}`, background: 'rgba(255,255,255,0.03)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'rgb(196,181,253)', textTransform: 'uppercase' }}>Q{i + 1} · {QTYPES.find((t) => t.value === q.question_type)?.label}</span>
                  <button type="button" onClick={() => setStep(2)} style={{ fontSize: '0.75rem', color: 'rgb(196,181,253)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Edit</button>
                </div>
                <p style={{ color: 'white', fontWeight: 600, fontSize: '0.9375rem' }}>{q.question_text || <span style={{ color: 'rgb(248,113,113)' }}>Empty question</span>}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => canProceed && setStep(4)} disabled={!canProceed}
            style={{ width: '100%', marginTop: '1.25rem', height: '3rem', borderRadius: '0.875rem', border: 'none', background: canProceed ? 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))' : 'rgba(255,255,255,0.06)', color: canProceed ? 'white' : 'rgb(120,120,140)', fontWeight: 800, cursor: canProceed ? 'pointer' : 'not-allowed' }}>
            Looks good! →
          </button>
        </div>
      )}

      {/* Step 4 — Launch */}
      {step === 4 && (
        <div style={card}>
          <div style={{ borderRadius: '1rem', border: `1px solid ${banner}`, background: `linear-gradient(135deg, ${banner}, rgba(19,19,31,0.9))`, padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>{title || 'Untitled quiz'}</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>{questions.length} questions · {timePerQ}s each</p>
          </div>

          <LaunchModePicker
            playMode={playMode} setPlayMode={setPlayMode}
            duration={duration} setDuration={setDuration}
            durationMode={durationMode} setDurationMode={setDurationMode}
            customValue={customValue} setCustomValue={setCustomValue}
            customUnit={customUnit} setCustomUnit={setCustomUnit}
            allowReplay={allowReplay} setAllowReplay={setAllowReplay}
          />

          {submitError && <p style={{ margin: '1rem 0 0.75rem', color: 'rgb(248,113,113)', fontSize: '0.8125rem' }}>{submitError}</p>}
          <button type="button" onClick={submit} disabled={submitting || validQuestions.length < 1}
            style={{ width: '100%', marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(245,158,11), rgb(251,191,36))', color: 'rgb(41,28,4)', fontWeight: 800, fontSize: '1rem', cursor: submitting ? 'wait' : 'pointer', opacity: validQuestions.length < 1 ? 0.5 : 1 }}>
            {submitting ? <><Loader2 style={{ width: '1.1rem', height: '1.1rem' }} className="animate-spin" /> Launching…</> : 'Launch Quiz →'}
          </button>
        </div>
      )}

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
        <button type="button" onClick={() => (step === 1 ? router.push('/arena') : setStep((s) => s - 1))}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3rem', padding: '0 1.25rem', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgb(180,180,200)', fontWeight: 700, cursor: 'pointer' }}>
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> {step === 1 ? 'Cancel' : 'Back'}
        </button>
        {step < 3 && (
          <button type="button" onClick={() => canProceed && setStep((s) => s + 1)} disabled={!canProceed}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3rem', padding: '0 1.75rem', borderRadius: '0.875rem', border: 'none', background: canProceed ? 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))' : 'rgba(255,255,255,0.06)', color: canProceed ? 'white' : 'rgb(120,120,140)', fontWeight: 800, cursor: canProceed ? 'pointer' : 'not-allowed' }}>
            Next <ArrowRight style={{ width: '1rem', height: '1rem' }} />
          </button>
        )}
      </div>

      {uploadError && (
        <div onClick={() => setUploadError('')} style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'rgb(30,16,20)', color: 'rgb(252,165,165)', border: '1px solid rgba(248,113,113,0.4)', padding: '0.625rem 1.25rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          {uploadError} · dismiss
        </div>
      )}
    </div>
  )
}

// ── Single-question editor ──
export function QuestionEditor({ q, index, total, onChange, onChangeType, onRemoveQ, onMove, registerImageRef, onImageClick, onImageChange, defaultTime, valid }: {
  q: Question; index: number; total: number; onChange: (p: Partial<Question>) => void; onChangeType: (t: QType) => void
  onRemoveQ: () => void; onMove: (d: -1 | 1) => void
  registerImageRef: (el: HTMLInputElement | null) => void
  onImageClick: () => void
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  defaultTime: number; valid: boolean
}) {
  return (
    <div style={{ ...card, borderColor: valid ? 'rgba(124,58,237,0.25)' : 'rgba(248,113,113,0.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgb(196,181,253)', background: 'rgba(124,58,237,0.15)', padding: '0.25rem 0.6rem', borderRadius: '9999px' }}>Question {index + 1}</span>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} title="Move up" style={{ width: '1.9rem', height: '1.9rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgb(180,180,200)', cursor: index === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0.4 : 1 }}><ArrowUp style={{ width: '0.9rem', height: '0.9rem' }} /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} title="Move down" style={{ width: '1.9rem', height: '1.9rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgb(180,180,200)', cursor: index === total - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === total - 1 ? 0.4 : 1 }}><ArrowDown style={{ width: '0.9rem', height: '0.9rem' }} /></button>
          <button type="button" onClick={onRemoveQ} title="Delete" style={{ width: '1.9rem', height: '1.9rem', borderRadius: '0.5rem', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(239,68,68,0.12)', color: 'rgb(248,113,113)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 style={{ width: '0.9rem', height: '0.9rem' }} /></button>
        </div>
      </div>

      <textarea style={{ ...input, minHeight: '3.5rem', resize: 'vertical', fontFamily: 'inherit', marginBottom: '0.75rem' }} value={q.question_text} onChange={(e) => onChange({ question_text: e.target.value })} placeholder="Question text" />

      {/* Image */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <input ref={registerImageRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={onImageChange} />
        <button type="button" onClick={onImageClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.14)', background: 'transparent', color: 'rgb(180,180,200)', padding: '0.4rem 0.75rem', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer' }}>
          <ImageIcon style={{ width: '0.9rem', height: '0.9rem' }} /> 📷 {q.image_url && q.image_url !== '__uploading__' ? 'Replace Image' : 'Add Image'}
        </button>
        {q.image_url === '__uploading__' && <span style={{ fontSize: '0.75rem', color: 'rgb(148,148,168)' }}>Uploading…</span>}
        {q.image_url && q.image_url !== '__uploading__' && <button type="button" onClick={() => onChange({ image_url: null })} style={{ fontSize: '0.75rem', color: 'rgb(248,113,113)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>}
      </div>
      {q.image_url && q.image_url !== '__uploading__' && <img src={q.image_url} alt="" style={{ maxHeight: '9rem', borderRadius: '0.75rem', marginBottom: '0.75rem' }} />}

      {/* Type selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.875rem' }}>
        {QTYPES.map((t) => <button key={t.value} type="button" onClick={() => onChangeType(t.value)} style={pill(q.question_type === t.value)}>{t.label}</button>)}
      </div>

      {/* Type-specific fields */}
      {q.question_type === 'mc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.875rem' }}>
          {q.options.map((opt, oi) => (
            <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button type="button" onClick={() => onChange({ correct_index: oi })} title="Mark correct"
                style={{ width: '1.4rem', height: '1.4rem', borderRadius: '9999px', flexShrink: 0, border: `2px solid ${q.correct_index === oi ? 'rgb(74,222,128)' : 'rgba(255,255,255,0.3)'}`, background: q.correct_index === oi ? 'rgb(74,222,128)' : 'transparent', cursor: 'pointer' }} />
              <input style={input} value={opt} onChange={(e) => { const o = [...q.options]; o[oi] = e.target.value; onChange({ options: o }) }} placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
            </div>
          ))}
        </div>
      )}
      {q.question_type === 'tf' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
          {['True', 'False'].map((v, vi) => (
            <button key={v} type="button" onClick={() => onChange({ correct_index: vi })}
              style={{ flex: 1, height: '3rem', borderRadius: '0.75rem', border: `1px solid ${q.correct_index === vi ? 'rgba(74,222,128,0.8)' : 'rgba(255,255,255,0.12)'}`, background: q.correct_index === vi ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.03)', color: q.correct_index === vi ? 'rgb(134,239,172)' : 'rgb(200,200,215)', fontWeight: 800, cursor: 'pointer' }}>
              {v} {q.correct_index === vi ? '✓' : ''}
            </button>
          ))}
        </div>
      )}
      {q.question_type === 'slider' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.875rem' }}>
          <div><label style={label}>Min</label><input style={input} type="number" value={q.slider_min} onChange={(e) => onChange({ slider_min: Number(e.target.value) })} /></div>
          <div><label style={label}>Max</label><input style={input} type="number" value={q.slider_max} onChange={(e) => onChange({ slider_max: Number(e.target.value) })} /></div>
          <div><label style={label}>Correct</label><input style={input} type="number" value={q.slider_correct} onChange={(e) => onChange({ slider_correct: Number(e.target.value) })} /></div>
        </div>
      )}
      {q.question_type === 'fr' && (
        <div style={{ marginBottom: '0.875rem' }}>
          <label style={label}>Correct answer</label>
          <input style={input} value={q.correct_answer} onChange={(e) => onChange({ correct_answer: e.target.value })} placeholder="Accepted answer" />
        </div>
      )}

      {/* Points + time override */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
        {POINTS.map((p) => <button key={p.v} type="button" onClick={() => onChange({ points_multiplier: p.v })} style={{ ...pill(q.points_multiplier === p.v), fontSize: '0.75rem' }}>{p.label}</button>)}
        <input style={{ ...input, width: '9rem', marginLeft: 'auto' }} type="number" min={5} max={120} value={q.time_limit ?? ''} onChange={(e) => onChange({ time_limit: e.target.value ? Number(e.target.value) : null })} placeholder={`Time: ${defaultTime}s`} />
      </div>

      {/* Speed bonus toggle */}
      {(() => {
        const on = q.speed_bonus_enabled !== false
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>Speed Bonus</div>
              <div style={{ color: 'rgb(148,148,168)', fontSize: '0.72rem' }}>Faster answers earn more points</div>
            </div>
            <button type="button" role="switch" aria-checked={on} aria-label="Speed bonus" onClick={() => onChange({ speed_bonus_enabled: !on })}
              style={{ position: 'relative', flexShrink: 0, width: '3rem', height: '1.6rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', background: on ? '#22c55e' : 'rgba(255,255,255,0.18)', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: '0.2rem', left: on ? '1.6rem' : '0.2rem', width: '1.2rem', height: '1.2rem', borderRadius: '9999px', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
            </button>
          </div>
        )
      })()}
    </div>
  )
}

// Compute the total hours for a custom duration.
export function customHours(value: number, unit: 'hours' | 'days'): number {
  return Math.max(1, Math.round(value * (unit === 'days' ? 24 : 1)))
}

// ── Reusable launch-mode picker (used by create + edit/relaunch) ──
export function LaunchModePicker({
  playMode, setPlayMode, duration, setDuration, durationMode, setDurationMode,
  customValue, setCustomValue, customUnit, setCustomUnit, allowReplay, setAllowReplay,
}: {
  playMode: 'self_paced' | 'live'; setPlayMode: (m: 'self_paced' | 'live') => void
  duration: string; setDuration: (d: string) => void
  durationMode: 'preset' | 'custom'; setDurationMode: (m: 'preset' | 'custom') => void
  customValue: number; setCustomValue: (n: number) => void
  customUnit: 'hours' | 'days'; setCustomUnit: (u: 'hours' | 'days') => void
  allowReplay: boolean; setAllowReplay: (b: boolean) => void
}) {
  return (
    <div>
      <label style={label}>Launch mode</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {([
          { v: 'self_paced', icon: Link2, title: 'Self-Paced 🔗', desc: 'Players join via link, play at their own pace, see the leaderboard after.' },
          { v: 'live', icon: Gamepad2, title: 'Live Room 🎮', desc: 'Players join with a code; the host controls the game like Kahoot.' },
        ] as const).map((m) => {
          const active = playMode === m.v
          return (
            <button key={m.v} type="button" onClick={() => setPlayMode(m.v)}
              style={{ textAlign: 'left', borderRadius: '1rem', border: `1px solid ${active ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.1)'}`, background: active ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', padding: '1.1rem', cursor: 'pointer' }}>
              <m.icon style={{ width: '1.4rem', height: '1.4rem', color: active ? 'rgb(196,181,253)' : 'rgb(160,160,180)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'white', fontWeight: 800, marginBottom: '0.25rem' }}>{m.title}</p>
              <p style={{ fontSize: '0.8125rem', color: 'rgb(148,148,168)', lineHeight: 1.4 }}>{m.desc}</p>
            </button>
          )
        })}
      </div>

      {playMode === 'self_paced' && (
        <>
          <label style={label}>Stays open for</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {DURATIONS.map((d) => (
              <button key={d.value} type="button" onClick={() => { setDurationMode('preset'); setDuration(d.value) }} style={pill(durationMode === 'preset' && duration === d.value)}>{d.label}</button>
            ))}
            <button type="button" onClick={() => setDurationMode('custom')} style={pill(durationMode === 'custom')}>Custom…</button>
          </div>
          {durationMode === 'custom' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', maxWidth: '20rem' }}>
              <input style={input} type="number" min={1} value={customValue} onChange={(e) => setCustomValue(Math.max(1, Number(e.target.value) || 1))} />
              <select style={{ ...sel, maxWidth: '9rem' }} value={customUnit} onChange={(e) => setCustomUnit(e.target.value as 'hours' | 'days')}>
                <option value="hours">hours</option>
                <option value="days">days</option>
              </select>
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', marginTop: '0.5rem' }}>
            <input type="checkbox" checked={allowReplay} onChange={(e) => setAllowReplay(e.target.checked)} style={{ width: '1.1rem', height: '1.1rem', accentColor: 'rgb(124,58,237)' }} />
            <span style={{ color: 'white', fontSize: '0.9375rem', fontWeight: 600 }}>Allow players to replay after completion</span>
          </label>
        </>
      )}
    </div>
  )
}
