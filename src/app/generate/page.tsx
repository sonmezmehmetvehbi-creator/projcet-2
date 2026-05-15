'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase'
import { BookOpen, FileText, ChevronDown, AlertCircle, Zap, Upload, X, FileUp } from 'lucide-react'
import type { Profile, Grade, OutputType, QuestionType } from '@/types'

const GRADES: { value: Grade; label: string }[] = [
  { value: 'K-5', label: 'K–5 (Elementary)' },
  { value: '6-8', label: '6–8 (Middle School)' },
  { value: '9-10', label: '9–10 (High School)' },
  { value: '11-12', label: '11–12 (High School)' },
  { value: 'college', label: 'College / University' },
]

export default function GeneratePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState<Grade>('9-10')
  const [topic, setTopic] = useState('')
  const [focus, setFocus] = useState('')
  const [outputType, setOutputType] = useState<OutputType>('questions')
  const [questionCount, setQuestionCount] = useState(10)
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['mc'])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState({ questions: 0, worksheets: 0 })

  // Upload state
  const [useUpload, setUseUpload] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedText, setUploadedText] = useState('')
  const [uploadParsing, setUploadParsing] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const today = new Date().toISOString().split('T')[0]
      const { data: usageData } = await supabase.from('daily_usage').select('questions, worksheets').eq('user_id', user.id).eq('date', today).single()
      if (usageData) setUsage(usageData)
    }
    load()
  }, [])

  const atLimit = !profile?.is_premium && (
    (outputType === 'questions' && usage.questions >= 2) ||
    (outputType === 'worksheet' && usage.worksheets >= 2)
  )

  function toggleQuestionType(type: QuestionType) {
    setQuestionTypes(prev =>
      prev.includes(type)
        ? prev.length > 1 ? prev.filter(t => t !== type) : prev
        : [...prev, type]
    )
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be under 10MB')
      return
    }

    setUploadedFile(file)
    setUploadError('')
    setUploadParsing(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/parse-upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUploadedText(data.text)

      // Auto-fill topic from filename if empty
      if (!topic) {
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        setTopic(name)
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
    setLoading(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, grade, topic, focus, outputType,
          questionCount, questionTypes,
          uploadedText: useUpload ? uploadedText : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      if (outputType === 'questions') router.push(`/questions/${data.sessionId}`)
      else router.push(`/worksheet/${data.sessionId}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) return <LoadingScreen outputType={outputType} isPremium={profile?.is_premium ?? false} />

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)' }}>
      <Navbar profile={profile} />
      <div style={{ paddingTop:'5rem' }}>
        <div className="container-base" style={{ padding:'2rem 1.5rem', maxWidth:'42rem' }}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2.5rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
              What are you studying?
            </h1>
            <p style={{ color:'rgb(107,107,88)', fontSize:'1.0625rem' }}>
              Tell us your topic — or upload your notes and we'll generate from those.
            </p>
          </div>

          {/* Daily usage */}
          {!profile?.is_premium && (
            <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
              {(['questions', 'worksheet'] as const).map(type => {
                const used = type === 'questions' ? usage.questions : usage.worksheets
                return (
                  <div key={type} style={{ flex:1, minWidth:'140px', padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'white', border:'1px solid rgba(34,85,14,0.1)' }}>
                    <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', marginBottom:'0.375rem', textTransform:'capitalize' }}>{type} today</p>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <div style={{ display:'flex', gap:'0.25rem' }}>
                        {[0,1].map(i => <div key={i} style={{ width:'1.5rem', height:'0.375rem', borderRadius:'9999px', background: i < used ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)' }} />)}
                      </div>
                      <span style={{ fontSize:'0.8125rem', fontWeight:600 }}>{used}/2</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="card" style={{ padding:'2rem' }}>
            {error && (
              <div className="alert-error" style={{ marginBottom:'1.5rem' }}>
                <AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />
                <div>
                  {error}
                  {atLimit && <a href="/pricing" style={{ display:'block', marginTop:'0.25rem', fontWeight:600, color:'rgb(34,85,14)' }}>Upgrade to Premium →</a>}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

              {/* Output type toggle */}
              <div>
                <label className="label">What do you want to generate?</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  {([
                    { value:'questions', icon: BookOpen, label:'Questions', desc:'MC & free response' },
                    { value:'worksheet', icon: FileText, label:'Worksheet', desc:'Visual study sheet' },
                  ] as const).map(opt => (
                    <button key={opt.value} type="button" onClick={() => setOutputType(opt.value)}
                      style={{ padding:'1rem', borderRadius:'0.75rem', border:`2px solid ${outputType === opt.value ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)'}`, background: outputType === opt.value ? 'rgba(34,85,14,0.04)' : 'white', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                      <opt.icon style={{ width:'1.25rem', height:'1.25rem', color: outputType === opt.value ? 'rgb(34,85,14)' : 'rgb(107,107,88)', marginBottom:'0.5rem' }} />
                      <p style={{ fontWeight:600, color:'rgb(26,26,20)', fontSize:'0.9375rem' }}>{opt.label}</p>
                      <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload toggle */}
              <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.03)', border:'1px solid rgba(34,85,14,0.1)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: useUpload ? '1rem' : 0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                    <FileUp style={{ width:'1.125rem', height:'1.125rem', color:'rgb(34,85,14)' }} />
                    <div>
                      <p style={{ fontWeight:600, fontSize:'0.9375rem', color:'rgb(26,26,20)' }}>Upload my notes</p>
                      <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>PDF, images, or PowerPoint</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setUseUpload(u => !u); removeUpload() }}
                    style={{ width:'2.75rem', height:'1.5rem', borderRadius:'9999px', border:'none', cursor:'pointer', transition:'all 0.2s', background: useUpload ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.2)', position:'relative', flexShrink:0 }}>
                    <div style={{ width:'1.125rem', height:'1.125rem', borderRadius:'50%', background:'white', position:'absolute', top:'0.1875rem', transition:'all 0.2s', left: useUpload ? '1.4375rem' : '0.1875rem', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>

                {useUpload && (
                  <div>
                    {!uploadedFile ? (
                      <div>
                        <div onClick={() => fileRef.current?.click()}
                          style={{ border:'2px dashed rgba(34,85,14,0.3)', borderRadius:'0.75rem', padding:'1.5rem', textAlign:'center', cursor:'pointer', transition:'all 0.2s', background:'white' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(34,85,14,0.6)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(34,85,14,0.3)')}>
                          <Upload style={{ width:'1.5rem', height:'1.5rem', color:'rgb(107,107,88)', margin:'0 auto 0.5rem' }} />
                          <p style={{ fontSize:'0.875rem', fontWeight:500, color:'rgb(26,26,20)', marginBottom:'0.25rem' }}>
                            Click to upload your notes
                          </p>
                          <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)' }}>PDF, images, PPTX, DOCX, TXT — max 20MB</p>
                        </div>
                        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.pptx,.ppt,.docx,.txt" style={{ display:'none' }} onChange={handleFileUpload} />
                        {uploadError && <p style={{ fontSize:'0.8125rem', color:'rgb(163,45,45)', marginTop:'0.5rem' }}>{uploadError}</p>}
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'white', border:'1px solid rgba(34,85,14,0.2)' }}>
                        {uploadParsing ? (
                          <>
                            <div style={{ width:'1.25rem', height:'1.25rem', border:'2px solid rgba(34,85,14,0.2)', borderTop:'2px solid rgb(34,85,14)', borderRadius:'50%', animation:'spin 1s linear infinite', flexShrink:0 }} />
                            <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>Reading your notes...</p>
                          </>
                        ) : (
                          <>
                            <FileText style={{ width:'1.25rem', height:'1.25rem', color:'rgb(34,85,14)', flexShrink:0 }} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:'0.875rem', fontWeight:600, color:'rgb(26,26,20)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{uploadedFile.name}</p>
                              <p style={{ fontSize:'0.75rem', color:'rgb(59,109,17)' }}>✓ Notes extracted successfully</p>
                            </div>
                            <button type="button" onClick={removeUpload}
                              style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgb(107,107,88)', padding:'0.25rem', borderRadius:'50%', display:'flex' }}>
                              <X style={{ width:'1rem', height:'1rem' }} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="label" htmlFor="subject">Subject <span style={{ color:'rgb(163,45,45)' }}>*</span></label>
                <input id="subject" value={subject} onChange={e => setSubject(e.target.value)}
                  className="input" placeholder="e.g. Biology, Algebra 2, US History" required />
              </div>

              {/* Grade */}
              <div>
                <label className="label" htmlFor="grade">Grade Level <span style={{ color:'rgb(163,45,45)' }}>*</span></label>
                <div style={{ position:'relative' }}>
                  <select id="grade" value={grade} onChange={e => setGrade(e.target.value as Grade)}
                    className="input" style={{ appearance:'none', paddingRight:'2.5rem', cursor:'pointer' }}>
                    {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                  <ChevronDown style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', width:'1rem', height:'1rem', color:'rgb(107,107,88)', pointerEvents:'none' }} />
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="label" htmlFor="topic">
                  Topic <span style={{ color:'rgb(163,45,45)' }}>*</span>
                  {useUpload && uploadedText && <span style={{ fontWeight:400, color:'rgb(107,107,88)', fontSize:'0.8125rem' }}> — will be generated from your notes</span>}
                </label>
                <input id="topic" value={topic} onChange={e => setTopic(e.target.value)}
                  className="input" placeholder={useUpload ? 'e.g. Lecture 4 — Cell Division' : 'e.g. Photosynthesis, The Civil War'} required />
              </div>

              {/* Focus (optional) */}
              <div>
                <label className="label" htmlFor="focus">
                  Specific focus <span style={{ fontSize:'0.8125rem', fontWeight:400, color:'rgb(107,107,88)' }}>(optional)</span>
                </label>
                <input id="focus" value={focus} onChange={e => setFocus(e.target.value)}
                  className="input" placeholder="e.g. focus only on pages 3-5" />
              </div>

              {/* Question options */}
              {outputType === 'questions' && (
                <>
                  <div>
                    <label className="label">Number of questions: <strong>{questionCount}</strong></label>
                    <input type="range" min={3} max={20} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}
                      style={{ width:'100%', accentColor:'rgb(34,85,14)', cursor:'pointer' }} />
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'rgb(107,107,88)', marginTop:'0.25rem' }}>
                      <span>3</span><span>20</span>
                    </div>
                  </div>

                  <div>
                    <label className="label">Question types</label>
                    <div style={{ display:'flex', gap:'0.75rem' }}>
                      {([
                        { value:'mc', label:'Multiple Choice' },
                        { value:'fr', label:'Free Response' },
                      ] as const).map(qt => (
                        <button key={qt.value} type="button" onClick={() => toggleQuestionType(qt.value)}
                          style={{ flex:1, padding:'0.625rem 1rem', borderRadius:'0.75rem', border:`2px solid ${questionTypes.includes(qt.value) ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.15)'}`, background: questionTypes.includes(qt.value) ? 'rgba(34,85,14,0.06)' : 'white', cursor:'pointer', fontSize:'0.875rem', fontWeight: questionTypes.includes(qt.value) ? 600 : 400, color: questionTypes.includes(qt.value) ? 'rgb(34,85,14)' : 'rgb(107,107,88)', transition:'all 0.2s' }}>
                          {qt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button type="submit" disabled={atLimit || uploadParsing} className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'1rem', fontSize:'1.0625rem' }}>
                {atLimit ? (
                  <><Zap style={{ width:'1rem', height:'1rem' }} />Daily limit reached — Upgrade to continue</>
                ) : uploadParsing ? (
                  'Reading your notes...'
                ) : (
                  <>Generate {outputType === 'questions' ? 'Questions' : 'Worksheet'} {useUpload && uploadedText ? 'from my notes' : ''} ✨</>
                )}
              </button>

            </form>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function LoadingScreen({ outputType, isPremium }: { outputType: OutputType; isPremium: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [countdown, setCountdown] = useState(isPremium ? 18 : 30)
  const duration = isPremium ? 18 : 30

  const messages = outputType === 'questions'
    ? ['Reading up on your topic...', 'Writing your first question...', 'Mixing in some tricky ones...', 'Double-checking the answers...', 'Almost ready for you!']
    : ['Opening the textbooks...', 'Sketching out your worksheet...', 'Building the step-by-step guide...', 'Adding visuals and examples...', 'Polishing the final touches...']

  useEffect(() => {
    const interval = setInterval(() => setMessageIndex(i => (i + 1) % messages.length), 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isPremium) return
    const interval = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(interval)
  }, [isPremium])

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #F4F7EC, #EFF5E3)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div style={{ textAlign:'center', maxWidth:'28rem', width:'100%' }}>
        <div className="notebook-breathe" style={{ width:'200px', height:'160px', margin:'0 auto 2rem', position:'relative' }}>
          <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%' }}>
            <rect x="20" y="20" width="160" height="120" rx="8" fill="rgb(34,85,14)" />
            {[35,50,65,80,95,110,125].map((y, i) => (
              <circle key={i} cx="28" cy={y} r="4" fill="rgb(232,160,32)" className="spiral-pulse" style={{ animationDelay:`${i * 0.2}s` }} />
            ))}
            <rect x="38" y="28" width="134" height="104" rx="4" fill="#FAFAF8" />
            {[
              { y1:48, y2:48, cls:'line-draw-1' },
              { y1:68, y2:68, cls:'line-draw-2' },
              { y1:88, y2:88, cls:'line-draw-3' },
              { y1:108, y2:108, cls:'line-draw-4' },
            ].map((line, i) => (
              <line key={i} x1="48" y1={line.y1} x2="162" y2={line.y2}
                stroke="#C8D8E8" strokeWidth="1.5"
                strokeDasharray="114" className={line.cls} />
            ))}
            <g className="pencil-write">
              <rect x="-18" y="-5" width="36" height="10" rx="2" fill="#F5C842" />
              <polygon points="18,-5 18,5 26,0" fill="#E8A020" />
              <rect x="-22" y="-5" width="6" height="10" rx="1" fill="#F4A0A0" />
              <rect x="-16" y="-5" width="4" height="10" fill="#B0B0B0" />
              <circle cx="22" cy="-3" r="1.5" fill="rgba(180,180,180,0.6)" className="eraser-dust-1" />
              <circle cx="25" cy="1" r="1" fill="rgba(180,180,180,0.5)" className="eraser-dust-2" />
              <circle cx="20" cy="3" r="1.2" fill="rgba(180,180,180,0.4)" className="eraser-dust-3" />
            </g>
          </svg>
        </div>

        <p style={{ fontSize:'1.125rem', fontWeight:600, color:'rgb(26,26,20)', marginBottom:'0.5rem', minHeight:'1.75rem' }}>
          {messages[messageIndex]}
        </p>
        <p style={{ fontSize:'0.9375rem', color:'rgb(107,107,88)', marginBottom:'2rem' }}>
          {isPremium ? 'Generating your content...' : `Ready in ${countdown} second${countdown !== 1 ? 's' : ''}...`}
        </p>

        <div style={{ width:'100%', height:'6px', background:'rgba(34,85,14,0.12)', borderRadius:'9999px', overflow:'hidden', marginBottom:'1.5rem' }}>
          <div style={{
            height:'100%', borderRadius:'9999px',
            background:'linear-gradient(90deg, rgb(34,85,14), rgb(74,122,40))',
            animation: `progressFill ${duration}s linear forwards`,
          }} />
        </div>

        {!isPremium && (
          <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)' }}>
            ⚡ <a href="/pricing" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>Premium members</a> load in half the time
          </p>
        )}
      </div>
    </div>
  )
}