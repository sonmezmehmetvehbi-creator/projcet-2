'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, Plus } from 'lucide-react'
import {
  QuestionEditor, LaunchModePicker, newQuestion, isValid, customHours,
  card, type Question, type QType,
} from '@/app/arena/forge-quiz/create/ForgeQuizCreateClient'

function fromDB(q: any): Question {
  const base = newQuestion(q.question_type ?? 'mc')
  return {
    ...base,
    question_text: q.question_text ?? '',
    question_type: (['mc', 'tf', 'slider', 'fr'].includes(q.question_type) ? q.question_type : 'mc') as QType,
    options: Array.isArray(q.options) ? q.options : base.options,
    correct_index: typeof q.correct_index === 'number' ? q.correct_index : 0,
    correct_answer: q.correct_answer ?? '',
    slider_min: q.slider_min ?? 0,
    slider_max: q.slider_max ?? 100,
    slider_correct: q.slider_correct ?? 50,
    points_multiplier: [0, 1, 2].includes(q.points_multiplier) ? q.points_multiplier : 1,
    time_limit: q.time_limit ?? null,
    image_url: q.image_url ?? null,
  }
}

export default function EditQuizClient({ quiz, initialQuestions }: { quiz: any; initialQuestions: any[] }) {
  const router = useRouter()
  const [phase, setPhase] = useState<'editing' | 'launch'>('editing')
  const [questions, setQuestions] = useState<Question[]>(initialQuestions.map(fromDB))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')

  // Launch state
  const [playMode, setPlayMode] = useState<'self_paced' | 'live'>('self_paced')
  const [duration, setDuration] = useState('24h')
  const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset')
  const [customValue, setCustomValue] = useState(3)
  const [customUnit, setCustomUnit] = useState<'hours' | 'days'>('hours')
  const [allowReplay, setAllowReplay] = useState(true)

  const addQuestion = () => setQuestions((qs) => (qs.length >= 50 ? qs : [...qs, newQuestion('mc')]))
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

  const imageRefs = useRef<Record<string, HTMLInputElement | null>>({})
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, id: string) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be under 5MB'); return }
    setUploadError('')
    updateQuestion(id, { image_url: '__uploading__' })
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/arena/forge-quiz/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) updateQuestion(id, { image_url: data.url })
      else { updateQuestion(id, { image_url: null }); setUploadError(data.error || 'Upload failed') }
    } catch { updateQuestion(id, { image_url: null }); setUploadError('Upload failed') }
  }

  const validQuestions = questions.filter(isValid)

  async function saveAndRelaunch() {
    setError(''); setBusy(true)
    try {
      const payloadQuestions = questions.map((q) => ({
        question_text: q.question_text, question_type: q.question_type,
        options: q.question_type === 'mc' || q.question_type === 'tf' ? q.options : null,
        correct_index: q.question_type === 'mc' || q.question_type === 'tf' ? q.correct_index : null,
        correct_answer: q.question_type === 'fr' ? q.correct_answer : null,
        slider_min: q.question_type === 'slider' ? q.slider_min : null,
        slider_max: q.question_type === 'slider' ? q.slider_max : null,
        slider_correct: q.question_type === 'slider' ? q.slider_correct : null,
        points_multiplier: q.points_multiplier, time_limit: q.time_limit,
        image_url: q.image_url && q.image_url !== '__uploading__' ? q.image_url : null,
      }))
      // 1) Persist the edited questions to the original quiz.
      const saveRes = await fetch('/api/arena/forge-quiz/save-questions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quiz.id, questions: payloadQuestions }),
      })
      const saveData = await saveRes.json()
      if (!saveData.success) throw new Error(saveData.error || 'Failed to save questions')

      // 2) Relaunch into a fresh quiz with the chosen mode.
      const customDurationHours = playMode === 'self_paced' && durationMode === 'custom' ? customHours(customValue, customUnit) : null
      const relRes = await fetch('/api/arena/forge-quiz/relaunch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalQuizId: quiz.id, playMode, duration, customDurationHours }),
      })
      const relData = await relRes.json()
      if (!relData.newQuizId) throw new Error(relData.error || 'Relaunch failed')
      router.push(`/arena/forge-quiz/${relData.newQuizId}/lobby`)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: '46rem', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}>
      <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.375rem' }}>✏️ Edit &amp; Relaunch</h1>
      <p style={{ color: 'rgb(148,148,168)', marginBottom: '2rem' }}>{quiz.title}</p>

      {phase === 'editing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, i) => (
            <QuestionEditor key={q._id} q={q} index={i} total={questions.length}
              onChange={(patch) => updateQuestion(q._id, patch)} onChangeType={(t) => changeType(q._id, t)}
              onRemoveQ={() => removeQuestion(q._id)} onMove={(d) => move(i, d)}
              registerImageRef={(el) => { imageRefs.current[q._id] = el }}
              onImageClick={() => imageRefs.current[q._id]?.click()}
              onImageChange={(e) => handleImageUpload(e, q._id)}
              defaultTime={quiz.time_per_question ?? 20} valid={isValid(q)} />
          ))}
          {questions.length < 50 && (
            <button type="button" onClick={addQuestion}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3rem', borderRadius: '0.875rem', border: '1px dashed rgba(124,58,237,0.5)', background: 'rgba(124,58,237,0.08)', color: 'rgb(196,181,253)', fontWeight: 800, cursor: 'pointer' }}>
              <Plus style={{ width: '1.1rem', height: '1.1rem' }} /> Add Question
            </button>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => router.push(`/arena/forge-quiz/${quiz.id}/lobby`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3rem', padding: '0 1.25rem', borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgb(180,180,200)', fontWeight: 700, cursor: 'pointer' }}>
              <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> Cancel
            </button>
            <button type="button" onClick={() => validQuestions.length >= 1 && setPhase('launch')} disabled={validQuestions.length < 1}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', height: '3rem', padding: '0 1.75rem', borderRadius: '0.875rem', border: 'none', background: validQuestions.length >= 1 ? 'linear-gradient(90deg, rgb(124,58,237), rgb(139,92,246))' : 'rgba(255,255,255,0.06)', color: validQuestions.length >= 1 ? 'white' : 'rgb(120,120,140)', fontWeight: 800, cursor: validQuestions.length >= 1 ? 'pointer' : 'not-allowed' }}>
              Save &amp; Relaunch <ArrowRight style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>
        </div>
      )}

      {phase === 'launch' && (
        <div style={card}>
          <LaunchModePicker
            playMode={playMode} setPlayMode={setPlayMode}
            duration={duration} setDuration={setDuration}
            durationMode={durationMode} setDurationMode={setDurationMode}
            customValue={customValue} setCustomValue={setCustomValue}
            customUnit={customUnit} setCustomUnit={setCustomUnit}
            allowReplay={allowReplay} setAllowReplay={setAllowReplay}
          />
          {error && <p style={{ margin: '1rem 0 0.75rem', color: 'rgb(248,113,113)', fontSize: '0.8125rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={saveAndRelaunch} disabled={busy}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.25rem', borderRadius: '0.875rem', border: 'none', background: 'linear-gradient(90deg, rgb(245,158,11), rgb(251,191,36))', color: 'rgb(41,28,4)', fontWeight: 800, fontSize: '1rem', cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? <><Loader2 style={{ width: '1.1rem', height: '1.1rem' }} className="animate-spin" /> Relaunching…</> : 'Save & Relaunch →'}
            </button>
            <button type="button" onClick={() => setPhase('editing')} disabled={busy}
              style={{ borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.14)', background: 'transparent', color: 'rgb(200,200,215)', fontWeight: 700, padding: '0 1.25rem', cursor: 'pointer' }}>Back</button>
          </div>
        </div>
      )}

      {uploadError && (
        <div onClick={() => setUploadError('')} style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'rgb(30,16,20)', color: 'rgb(252,165,165)', border: '1px solid rgba(248,113,113,0.4)', padding: '0.625rem 1.25rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          {uploadError} · dismiss
        </div>
      )}
    </div>
  )
}
