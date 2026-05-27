'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const SUBJECTS = ['SAT Math', 'ACT Math', 'Algebra', 'Geometry', 'Calculus', 'Pre-Calculus', 'Statistics', 'SAT Reading & Writing', 'ACT English']
const LANGUAGES = ['English', 'Spanish', 'French', 'Mandarin', 'Arabic', 'Turkish', 'Portuguese', 'Hindi', 'Korean', 'Japanese']
const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'Europe/London', 'Europe/Paris', 'Asia/Istanbul', 'Asia/Dubai']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Props {
  profile: any
  existingApplication: any
}

export default function TutorApplyClient({ profile, existingApplication }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Step 1 — Personal info
  const [fullName, setFullName] = useState(profile?.display_name ?? '')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phone, setPhone] = useState('')
  const [language, setLanguage] = useState<string[]>(['English'])
  const [timezone, setTimezone] = useState('America/New_York')
  const [bio, setBio] = useState('')
  const [linkedIn, setLinkedIn] = useState('')

  // Step 2 — Qualifications
  const [subjects, setSubjects] = useState<string[]>([])
  const [education, setEducation] = useState('')
  const [institution, setInstitution] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [idFile, setIdFile] = useState<File | null>(null)

  // Step 3 — Availability
  const [availability, setAvailability] = useState<{ day: number; start: string; end: string }[]>([])

  // Step 4 — Payment & agreement
  const [venmo, setVenmo] = useState('')
  const [paypal, setPaypal] = useState('')
  const [zelle, setZelle] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToNoCriminal, setAgreedToNoCriminal] = useState(false)
  const [agreedToNoPoaching, setAgreedToNoPoaching] = useState(false)
  const [agreedToRecording, setAgreedToRecording] = useState(false)

  function toggleLanguage(lang: string) {
    setLanguage(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])
  }

  function toggleSubject(sub: string) {
    setSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub])
  }

  function addAvailability() {
    setAvailability(prev => [...prev, { day: 1, start: '09:00', end: '17:00' }])
  }

  function removeAvailability(i: number) {
    setAvailability(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateAvailability(i: number, field: string, value: any) {
    setAvailability(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }

  async function uploadFile(file: File, path: string): Promise<string> {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const fileName = `${path}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('tutor-docs').upload(fileName, file)
    if (error) throw error
    const { data } = supabase.storage.from('tutor-docs').getPublicUrl(fileName)
    return data.publicUrl
  }

  async function handleSubmit() {
    if (!agreedToTerms || !agreedToNoCriminal || !agreedToNoPoaching || !agreedToRecording) {
      setError('Please agree to all terms before submitting.')
      return
    }
    if (!idFile) { setError('Please upload your photo ID.'); return }
    if (!cvFile) { setError('Please upload your CV/Resume.'); return }
    if (!videoFile) { setError('Please upload your intro video.'); return }
    if (subjects.length === 0) { setError('Please select at least one subject.'); return }
    if (!venmo && !paypal && !zelle) { setError('Please provide at least one payment method.'); return }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Upload files
      let cvUrl = '', certUrl = '', videoUrl = '', idUrl = ''
      idUrl = await uploadFile(idFile, 'ids')
      cvUrl = await uploadFile(cvFile, 'cvs')
      videoUrl = await uploadFile(videoFile, 'videos')
      if (certFile) certUrl = await uploadFile(certFile, 'certs')

      // Create tutor profile
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutor_profiles')
        .insert({
          user_id: profile.id,
          display_name: fullName,
          bio,
          subjects,
          languages: language,
          hourly_rate: 30,
          custom_rate: false,
          status: 'pending',
          venmo: venmo || null,
          paypal: paypal || null,
          zelle: zelle || null,
          cv_url: cvUrl,
          certificate_url: certUrl || null,
          id_verified: false,
        })
        .select('id')
        .single()

      if (tutorError) throw tutorError

      // Save availability
      if (availability.length > 0) {
        await supabase.from('tutor_availability').insert(
          availability.map(a => ({
            tutor_id: tutorData.id,
            day_of_week: a.day,
            start_time: a.start,
            end_time: a.end,
            timezone,
          }))
        )
      }

      // Update profile role
      await supabase.from('profiles').update({ role: 'tutor_pending', tutor_status: 'pending' }).eq('id', profile.id)

      // Send notification email
      await fetch('/api/tutor-application-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: profile.email,
          subjects,
          education,
          institution,
          linkedIn,
          idUrl,
          cvUrl,
          videoUrl,
          certUrl,
        }),
      })

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  // Already applied
  if (existingApplication) {
    const statusColor = existingApplication.status === 'approved' ? 'rgb(34,85,14)' : existingApplication.status === 'rejected' ? 'rgb(163,45,45)' : 'rgb(180,120,10)'
    const statusEmoji = existingApplication.status === 'approved' ? '✅' : existingApplication.status === 'rejected' ? '❌' : '⏳'
    return (
      <div style={{ paddingTop:'6rem', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'6rem 1.5rem 3rem' }}>
        <div className="card" style={{ padding:'3rem', maxWidth:'32rem', width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>{statusEmoji}</div>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
            Application {existingApplication.status === 'pending' ? 'Under Review' : existingApplication.status === 'approved' ? 'Approved!' : 'Not Approved'}
          </h1>
          <p style={{ color:'rgb(107,107,88)', lineHeight:1.7, marginBottom:'1.5rem' }}>
            {existingApplication.status === 'pending'
              ? 'Your application is being reviewed. We\'ll email you within 2-3 business days.'
              : existingApplication.status === 'approved'
              ? 'Congratulations! Your tutor account is active. Go to your dashboard to start accepting sessions.'
              : 'Unfortunately your application was not approved. Please contact us for more information.'}
          </p>
          {existingApplication.status === 'approved' && (
            <a href="/tutor/dashboard" className="btn-primary" style={{ display:'inline-flex', justifyContent:'center' }}>
              Go to Tutor Dashboard →
            </a>
          )}
        </div>
      </div>
    )
  }

  if (success) return (
    <div style={{ paddingTop:'6rem', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'6rem 1.5rem 3rem' }}>
      <div className="card" style={{ padding:'3rem', maxWidth:'32rem', width:'100%', textAlign:'center' }}>
        <div style={{ width:'4rem', height:'4rem', borderRadius:'50%', background:'rgb(234,243,222)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem' }}>
          <CheckCircle style={{ width:'2rem', height:'2rem', color:'rgb(59,109,17)' }} />
        </div>
        <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.75rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>
          Application Submitted! 🎉
        </h1>
        <p style={{ color:'rgb(107,107,88)', lineHeight:1.7, marginBottom:'1.5rem' }}>
          Thanks for applying to be an AceForge tutor. We'll review your application and get back to you within 2-3 business days.
        </p>
        <a href="/dashboard" className="btn-primary" style={{ display:'inline-flex', justifyContent:'center' }}>
          Back to Dashboard
        </a>
      </div>
    </div>
  )

  const steps = ['Personal Info', 'Qualifications', 'Availability', 'Agreement']

  return (
    <div style={{ paddingTop:'5rem', minHeight:'100vh', paddingBottom:'4rem' }}>
      <div style={{ maxWidth:'44rem', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>
            Become an AceForge Tutor
          </h1>
          <p style={{ color:'rgb(107,107,88)', fontSize:'1.0625rem' }}>
            Help students ace their exams. Earn on your schedule.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', gap:'0', marginBottom:'2rem' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.375rem' }}>
              <div style={{
                width:'2rem', height:'2rem', borderRadius:'50%',
                background: i + 1 < step ? 'rgb(34,85,14)' : i + 1 === step ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.1)',
                color: i + 1 <= step ? 'white' : 'rgb(107,107,88)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.8125rem', fontWeight:700, transition:'all 0.3s',
              }}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize:'0.6875rem', color: i + 1 === step ? 'rgb(34,85,14)' : 'rgb(107,107,88)', fontWeight: i + 1 === step ? 700 : 400, textAlign:'center' }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding:'2rem' }}>
          {error && (
            <div className="alert-error" style={{ marginBottom:'1.5rem' }}>
              <AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />
              {error}
            </div>
          )}

          {/* STEP 1 — Personal Info */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)' }}>Personal Information</h2>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div>
                  <label className="label">Full Legal Name *</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} className="input" placeholder="As on your ID" />
                </div>
                <div>
                  <label className="label">Date of Birth *</label>
                  <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="input" />
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div>
                  <label className="label">Phone Number *</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="label">Timezone *</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input">
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Languages you can tutor in *</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                  {LANGUAGES.map(lang => (
                    <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                      style={{ padding:'0.375rem 0.875rem', borderRadius:'9999px', border:`1.5px solid ${language.includes(lang) ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.2)'}`, background: language.includes(lang) ? 'rgba(34,85,14,0.08)' : 'white', color: language.includes(lang) ? 'rgb(34,85,14)' : 'rgb(107,107,88)', fontSize:'0.875rem', fontWeight: language.includes(lang) ? 600 : 400, cursor:'pointer', transition:'all 0.2s' }}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">LinkedIn Profile URL</label>
                <input value={linkedIn} onChange={e => setLinkedIn(e.target.value)} className="input" placeholder="https://linkedin.com/in/yourname" />
              </div>

              <div>
                <label className="label">About You * <span style={{ fontWeight:400, color:'rgb(107,107,88)', fontSize:'0.8125rem' }}>(students will see this)</span></label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} className="input" rows={4} style={{ resize:'vertical' }}
                  placeholder="Tell students about your teaching style, experience, and what makes you a great tutor..." />
              </div>

              <div>
                <label className="label">Photo ID * <span style={{ fontWeight:400, color:'rgb(107,107,88)', fontSize:'0.8125rem' }}>(driver's license or passport — kept confidential)</span></label>
                {idFile ? (
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.2)' }}>
                    <span style={{ fontSize:'0.875rem', color:'rgb(34,85,14)', fontWeight:600, flex:1 }}>✓ {idFile.name}</span>
                    <button type="button" onClick={() => setIdFile(null)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgb(107,107,88)' }}>
                      <X style={{ width:'1rem', height:'1rem' }} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem', borderRadius:'0.75rem', border:'2px dashed rgba(34,85,14,0.2)', cursor:'pointer', background:'white' }}>
                    <Upload style={{ width:'1.25rem', height:'1.25rem', color:'rgb(107,107,88)' }} />
                    <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>Upload photo ID (JPG, PNG, PDF)</span>
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display:'none' }} onChange={e => setIdFile(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>

              <button onClick={() => {
                if (!fullName || !dateOfBirth || !phone || language.length === 0 || !bio || !idFile) { setError('Please fill in all required fields.'); return }
                setError(''); setStep(2)
              }} className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                Continue to Qualifications →
              </button>
            </div>
          )}

          {/* STEP 2 — Qualifications */}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)' }}>Qualifications</h2>

              <div>
                <label className="label">Subjects you can tutor *</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                  {SUBJECTS.map(sub => (
                    <button key={sub} type="button" onClick={() => toggleSubject(sub)}
                      style={{ padding:'0.375rem 0.875rem', borderRadius:'9999px', border:`1.5px solid ${subjects.includes(sub) ? 'rgb(34,85,14)' : 'rgba(34,85,14,0.2)'}`, background: subjects.includes(sub) ? 'rgba(34,85,14,0.08)' : 'white', color: subjects.includes(sub) ? 'rgb(34,85,14)' : 'rgb(107,107,88)', fontSize:'0.875rem', fontWeight: subjects.includes(sub) ? 600 : 400, cursor:'pointer', transition:'all 0.2s' }}>
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div>
                  <label className="label">Highest Education Level *</label>
                  <select value={education} onChange={e => setEducation(e.target.value)} className="input">
                    <option value="">Select...</option>
                    <option>High School Diploma</option>
                    <option>Associate's Degree</option>
                    <option>Bachelor's Degree</option>
                    <option>Master's Degree</option>
                    <option>PhD / Doctorate</option>
                    <option>Professional Degree</option>
                  </select>
                </div>
                <div>
                  <label className="label">Institution *</label>
                  <input value={institution} onChange={e => setInstitution(e.target.value)} className="input" placeholder="e.g. MIT, Harvard, State University" />
                </div>
              </div>

              <div>
                <label className="label">Years of tutoring experience *</label>
                <select value={yearsExp} onChange={e => setYearsExp(e.target.value)} className="input">
                  <option value="">Select...</option>
                  <option>Less than 1 year</option>
                  <option>1-2 years</option>
                  <option>3-5 years</option>
                  <option>5-10 years</option>
                  <option>10+ years</option>
                </select>
              </div>

              <div>
                <label className="label">Resume / CV * </label>
                {cvFile ? (
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.2)' }}>
                    <span style={{ fontSize:'0.875rem', color:'rgb(34,85,14)', fontWeight:600, flex:1 }}>✓ {cvFile.name}</span>
                    <button type="button" onClick={() => setCvFile(null)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgb(107,107,88)' }}>
                      <X style={{ width:'1rem', height:'1rem' }} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem', borderRadius:'0.75rem', border:'2px dashed rgba(34,85,14,0.2)', cursor:'pointer', background:'white' }}>
                    <Upload style={{ width:'1.25rem', height:'1.25rem', color:'rgb(107,107,88)' }} />
                    <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>Upload CV/Resume (PDF)</span>
                    <input type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }} onChange={e => setCvFile(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>

              <div>
                <label className="label">Certifications <span style={{ fontWeight:400, color:'rgb(107,107,88)', fontSize:'0.8125rem' }}>(optional — SAT prep cert, teaching license, etc.)</span></label>
                {certFile ? (
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.2)' }}>
                    <span style={{ fontSize:'0.875rem', color:'rgb(34,85,14)', fontWeight:600, flex:1 }}>✓ {certFile.name}</span>
                    <button type="button" onClick={() => setCertFile(null)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgb(107,107,88)' }}>
                      <X style={{ width:'1rem', height:'1rem' }} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem', borderRadius:'0.75rem', border:'2px dashed rgba(34,85,14,0.2)', cursor:'pointer', background:'white' }}>
                    <Upload style={{ width:'1.25rem', height:'1.25rem', color:'rgb(107,107,88)' }} />
                    <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>Upload certification (PDF, JPG)</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={e => setCertFile(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>

              <div>
                <label className="label">30-60 Second Intro Video *</label>
                <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)', marginBottom:'0.5rem' }}>
                  Record a short video introducing yourself and your teaching style. This is shown to students.
                </p>
                {videoFile ? (
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', borderRadius:'0.75rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.2)' }}>
                    <span style={{ fontSize:'0.875rem', color:'rgb(34,85,14)', fontWeight:600, flex:1 }}>✓ {videoFile.name}</span>
                    <button type="button" onClick={() => setVideoFile(null)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgb(107,107,88)' }}>
                      <X style={{ width:'1rem', height:'1rem' }} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem', borderRadius:'0.75rem', border:'2px dashed rgba(34,85,14,0.2)', cursor:'pointer', background:'white' }}>
                    <Upload style={{ width:'1.25rem', height:'1.25rem', color:'rgb(107,107,88)' }} />
                    <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>Upload intro video (MP4, MOV — max 100MB)</span>
                    <input type="file" accept=".mp4,.mov,.avi,.webm" style={{ display:'none' }} onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>

              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button onClick={() => { setError(''); setStep(1) }} className="btn-secondary" style={{ flex:1, justifyContent:'center' }}>← Back</button>
                <button onClick={() => {
                  if (subjects.length === 0 || !education || !institution || !yearsExp || !cvFile || !videoFile) { setError('Please fill in all required fields.'); return }
                  setError(''); setStep(3)
                }} className="btn-primary" style={{ flex:2, justifyContent:'center' }}>
                  Continue to Availability →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Availability */}
          {step === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)' }}>Your Availability</h2>
              <p style={{ fontSize:'0.9375rem', color:'rgb(107,107,88)' }}>
                Set your weekly availability. Students will book sessions during these times.
              </p>

              {availability.length === 0 && (
                <div style={{ padding:'2rem', textAlign:'center', borderRadius:'0.875rem', background:'rgba(34,85,14,0.03)', border:'1px dashed rgba(34,85,14,0.2)' }}>
                  <p style={{ color:'rgb(107,107,88)', marginBottom:'1rem' }}>No availability set yet</p>
                  <button onClick={addAvailability} className="btn-secondary" style={{ fontSize:'0.875rem' }}>
                    + Add Time Slot
                  </button>
                </div>
              )}

              {availability.map((a, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:'0.75rem', alignItems:'end', padding:'1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.03)', border:'1px solid rgba(34,85,14,0.08)' }}>
                  <div>
                    <label className="label">Day</label>
                    <select value={a.day} onChange={e => updateAvailability(i, 'day', parseInt(e.target.value))} className="input">
                      {DAYS.map((d, idx) => <option key={d} value={idx}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">From</label>
                    <input type="time" value={a.start} onChange={e => updateAvailability(i, 'start', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">To</label>
                    <input type="time" value={a.end} onChange={e => updateAvailability(i, 'end', e.target.value)} className="input" />
                  </div>
                  <button onClick={() => removeAvailability(i)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgb(163,45,45)', padding:'0.5rem', alignSelf:'flex-end' }}>
                    <X style={{ width:'1.25rem', height:'1.25rem' }} />
                  </button>
                </div>
              ))}

              {availability.length > 0 && (
                <button onClick={addAvailability} className="btn-secondary" style={{ alignSelf:'flex-start', fontSize:'0.875rem' }}>
                  + Add Another Slot
                </button>
              )}

              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button onClick={() => { setError(''); setStep(2) }} className="btn-secondary" style={{ flex:1, justifyContent:'center' }}>← Back</button>
                <button onClick={() => {
                  if (availability.length === 0) { setError('Please add at least one availability slot.'); return }
                  setError(''); setStep(4)
                }} className="btn-primary" style={{ flex:2, justifyContent:'center' }}>
                  Continue to Agreement →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — Payment & Agreement */}
          {step === 4 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.375rem', fontWeight:700, color:'rgb(26,26,20)' }}>Payment & Agreement</h2>

              <div style={{ padding:'1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.1)' }}>
                <p style={{ fontSize:'0.875rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>💰 How you get paid</p>
                <p style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)', lineHeight:1.6 }}>
                  You'll receive $30/hr via your preferred payment method within 24 hours after each completed session (if no dispute is filed). Provide at least one payment handle below.
                </p>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                <div>
                  <label className="label">Venmo handle</label>
                  <input value={venmo} onChange={e => setVenmo(e.target.value)} className="input" placeholder="@yourhandle" />
                </div>
                <div>
                  <label className="label">PayPal email</label>
                  <input value={paypal} onChange={e => setPaypal(e.target.value)} className="input" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="label">Zelle phone or email</label>
                  <input value={zelle} onChange={e => setZelle(e.target.value)} className="input" placeholder="Phone or email" />
                </div>
              </div>

              {/* Agreements */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                {[
                  { state: agreedToTerms, setter: setAgreedToTerms, text: 'I agree to AceForge\'s Tutor Terms of Service, including the refund policy, dispute process, and platform fee structure.' },
                  { state: agreedToNoCriminal, setter: setAgreedToNoCriminal, text: 'I declare that I have no criminal history and I am legally eligible to work with students including minors. I understand that providing false information will result in immediate termination and potential legal action.' },
                  { state: agreedToNoPoaching, setter: setAgreedToNoPoaching, text: 'I agree not to solicit AceForge students to book sessions outside of the AceForge platform for 12 months. Violation of this agreement may result in legal action and a permanent ban.' },
                  { state: agreedToRecording, setter: setAgreedToRecording, text: 'I consent to all tutoring sessions being recorded for quality assurance and dispute resolution purposes. Recordings are reviewed only in case of a dispute and deleted after 30 days.' },
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'0.875rem 1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.02)', border:'1px solid rgba(34,85,14,0.08)' }}>
                    <input type="checkbox" checked={item.state} onChange={e => item.setter(e.target.checked)}
                      style={{ width:'1.125rem', height:'1.125rem', accentColor:'rgb(34,85,14)', flexShrink:0, marginTop:'0.125rem', cursor:'pointer' }} />
                    <label style={{ fontSize:'0.8125rem', color:'rgb(107,107,88)', lineHeight:1.6, cursor:'pointer' }} onClick={() => item.setter(!item.state)}>
                      {item.text}
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button onClick={() => { setError(''); setStep(3) }} className="btn-secondary" style={{ flex:1, justifyContent:'center' }}>← Back</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex:2, justifyContent:'center' }}>
                  {loading ? 'Submitting...' : 'Submit Application 🎓'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}