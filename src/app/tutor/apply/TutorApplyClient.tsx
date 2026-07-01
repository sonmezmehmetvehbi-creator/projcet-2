'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Upload, X, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useTutorTheme } from '@/app/tutor/dashboard/TutorThemeContext'

const COMMON_SUBJECTS = [
  'SAT Math', 'SAT Reading & Writing', 'ACT Math', 'ACT English',
  'Algebra', 'Geometry', 'Pre-Calculus', 'Calculus', 'Statistics',
  'Biology', 'Chemistry', 'Physics', 'AP Chemistry', 'AP Biology', 'AP Physics',
  'English Literature', 'Essay Writing', 'History', 'Economics',
  'Computer Science', 'Python', 'Java', 'Spanish', 'French',
]

const ALL_SUBJECTS = [
  ...COMMON_SUBJECTS,
  'Trigonometry', 'Linear Algebra', 'Differential Equations', 'Discrete Math',
  'Organic Chemistry', 'Biochemistry', 'Anatomy', 'Environmental Science',
  'AP Calculus AB', 'AP Calculus BC', 'AP Statistics', 'AP Computer Science',
  'AP History', 'AP Economics', 'AP English', 'AP Spanish', 'AP French',
  'IB Math', 'IB Physics', 'IB Chemistry', 'IB Biology', 'IB Economics',
  'GMAT', 'GRE', 'LSAT', 'MCAT', 'TOEFL', 'IELTS',
  'Music Theory', 'Art History', 'Philosophy', 'Psychology', 'Sociology',
  'Accounting', 'Finance', 'Marketing', 'Business',
  'C++', 'JavaScript', 'React', 'Data Science', 'Machine Learning',
  'Arabic', 'Mandarin', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean',
  'Russian', 'Turkish', 'Hindi', 'Hebrew',
]

const ALL_LANGUAGES = [
  'English', 'Spanish', 'French', 'Mandarin', 'Arabic', 'Turkish',
  'Portuguese', 'Hindi', 'Korean', 'Japanese', 'German', 'Italian',
  'Russian', 'Hebrew', 'Persian/Farsi', 'Urdu', 'Bengali', 'Swahili',
  'Dutch', 'Greek', 'Polish', 'Swedish', 'Norwegian', 'Danish',
  'Finnish', 'Czech', 'Romanian', 'Hungarian', 'Thai', 'Vietnamese',
  'Indonesian', 'Malay', 'Tagalog', 'Punjabi', 'Gujarati', 'Tamil',
  'Telugu', 'Kannada', 'Marathi', 'Amharic', 'Yoruba', 'Zulu',
  'Serbian', 'Croatian', 'Slovak', 'Bulgarian', 'Ukrainian',
  'Catalan', 'Basque', 'Welsh', 'Irish', 'Afrikaans',
]

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'America/Honolulu',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'Europe/Rome', 'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Warsaw',
  'Europe/Istanbul', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok',
  'Asia/Singapore', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
  'Africa/Cairo', 'Africa/Lagos', 'Africa/Nairobi',
  'America/Sao_Paulo', 'America/Buenos_Aires', 'America/Mexico_City',
  'America/Toronto', 'America/Vancouver',
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Props {
  profile: any
  existingApplication: any
  appeal?: any
  isTutor?: boolean
}

export default function TutorApplyClient({ profile, existingApplication, appeal, isTutor = false }: Props) {
  // Tutors (approved / pending) get the dark-purple tutor theme; the navbar
  // toggle drives useTutorTheme. Non-tutor applicants keep the original green.
  const { theme } = useTutorTheme()
  const isDark = isTutor && theme === 'dark'
  const accent = isTutor ? (isDark ? 'rgb(99,102,241)' : 'rgb(234,88,12)') : 'rgb(34,85,14)'
  const text1 = isDark ? 'white' : 'rgb(26,26,20)'
  const text2 = isDark ? 'rgba(255,255,255,0.55)' : 'rgb(107,107,88)'
  const surfaceBg = isDark ? 'rgb(30,30,46)' : 'white'
  const rootClass = isDark ? 'tutor-dark' : ''

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [fullName, setFullName] = useState(profile?.display_name ?? '')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phone, setPhone] = useState('')
  const [languages, setLanguages] = useState<string[]>(['English'])
  const [langSearch, setLangSearch] = useState('')
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [timezone, setTimezone] = useState('America/New_York')
  const [bio, setBio] = useState('')
  const [linkedIn, setLinkedIn] = useState('')
  const [idFile, setIdFile] = useState<File | null>(null)

  const [subjects, setSubjects] = useState<string[]>([])
  const [subjectSearch, setSubjectSearch] = useState('')
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)
  const [education, setEducation] = useState('')
  const [institution, setInstitution] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)

  const [availability, setAvailability] = useState<{ day: number; start: string; end: string }[]>([])

  const [venmo, setVenmo] = useState('')
  const [paypal, setPaypal] = useState('')
  const [zelle, setZelle] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToNoCriminal, setAgreedToNoCriminal] = useState(false)
  const [agreedToNoPoaching, setAgreedToNoPoaching] = useState(false)
  const [agreedToRecording, setAgreedToRecording] = useState(false)
  const [agreedToTax, setAgreedToTax] = useState(false)

  function toggleLanguage(lang: string) {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])
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
    if (!agreedToTerms || !agreedToNoCriminal || !agreedToNoPoaching || !agreedToRecording || !agreedToTax) {
      setError('Please agree to all terms before submitting.'); return
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

      let cvUrl = '', certUrl = '', videoUrl = '', idUrl = ''
      idUrl = await uploadFile(idFile, 'ids')
      cvUrl = await uploadFile(cvFile, 'cvs')
      videoUrl = await uploadFile(videoFile, 'videos')
      if (certFile) certUrl = await uploadFile(certFile, 'certs')

      const { data: tutorData, error: tutorError } = await supabase
        .from('tutor_profiles')
        .insert({
          user_id: profile.id,
          display_name: fullName,
          bio,
          subjects,
          languages,
          hourly_rate: 30,
          custom_rate: false,
          status: 'pending',
          venmo: venmo || null,
          paypal: paypal || null,
          zelle: zelle || null,
          cv_url: cvUrl,
          certificate_url: certUrl || null,
          id_verified: false,
          linkedin_url: linkedIn,
        })
        .select('id')
        .single()

      if (tutorError) throw tutorError

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

      await supabase.from('profiles').update({ role: 'tutor_pending', tutor_status: 'pending' }).eq('id', profile.id)

      await fetch('/api/tutor-application-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName, email: profile.email,
          subjects, education, institution, linkedIn,
          idUrl, cvUrl, videoUrl, certUrl,
        }),
      })

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (existingApplication) {
    const statusEmoji = existingApplication.status === 'approved' ? '✅' : existingApplication.status === 'rejected' ? '❌' : '⏳'
    return (
      <div className={rootClass} style={{ paddingTop: '6rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 3rem' }}>
        <div className="card" style={{ padding: '3rem', maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{statusEmoji}</div>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: text1, marginBottom: '0.75rem' }}>
            Application {existingApplication.status === 'pending' ? 'Under Review' : existingApplication.status === 'approved' ? 'Approved!' : 'Not Approved'}
          </h1>
          <p style={{ color: text2, lineHeight: 1.7, marginBottom: '1.5rem' }}>
            {existingApplication.status === 'pending' ? "Your application is being reviewed. We'll email you within 2-3 business days."
              : existingApplication.status === 'approved' ? 'Congratulations! Your tutor account is active.'
              : 'Unfortunately your application was not approved. Please contact us for more information.'}
          </p>
         {existingApplication.status === 'approved' && (
            <a href="/tutor/dashboard" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>Go to Tutor Dashboard →</a>
          )}
          {existingApplication.status === 'rejected' && (
            appeal?.status === 'rejected' ? (
              <div style={{ padding: '1.25rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.06)', border: '1px solid rgba(163,45,45,0.2)' }}>
                <p style={{ fontWeight: 700, color: 'rgb(163,45,45)', marginBottom: '0.5rem' }}>⚖️ Appeal Rejected — Final Decision</p>
                <p style={{ fontSize: '0.9375rem', color: text2, lineHeight: 1.7 }}>
                  We have reviewed your appeal and our decision is final. You are welcome to reapply after{' '}
                  <strong style={{ color: text1 }}>
                    {new Date(new Date(appeal.created_at).getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </strong>{' '}
                  with a stronger application. We wish you the best.
                </p>
              </div>
            ) : appeal?.status === 'pending' ? (
              <div style={{ padding: '1.25rem', borderRadius: '0.875rem', background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.2)' }}>
                <p style={{ fontWeight: 700, color: 'rgb(180,120,10)', marginBottom: '0.5rem' }}>⏳ Appeal Under Review</p>
                <p style={{ fontSize: '0.9375rem', color: text2, lineHeight: 1.7 }}>
                  Your appeal has been submitted and is being reviewed by our team. We will email you within 3-5 business days.
                </p>
              </div>
            ) : (
              <a href={`/tutor/appeal?email=${encodeURIComponent(profile?.email ?? '')}&name=${encodeURIComponent(profile?.display_name ?? '')}`}
                style={{ display: 'inline-flex', justifyContent: 'center', padding: '0.875rem 1.5rem', borderRadius: '0.875rem', background: 'rgba(163,45,45,0.08)', border: '2px solid rgba(163,45,45,0.2)', color: 'rgb(163,45,45)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9375rem' }}>
                ⚖️ Appeal This Decision →
              </a>
            )
          )}
        </div>
      </div>
    )
  }

  if (success) return (
    <div className={rootClass} style={{ paddingTop: '6rem', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 3rem' }}>
      <div className="card" style={{ padding: '3rem', maxWidth: '32rem', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'rgb(234,243,222)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <CheckCircle style={{ width: '2rem', height: '2rem', color: 'rgb(59,109,17)' }} />
        </div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: text1, marginBottom: '0.75rem' }}>Application Submitted! 🎉</h1>
        <p style={{ color: text2, lineHeight: 1.7, marginBottom: '1.5rem' }}>
          Thanks for applying! We'll review your application and get back to you within 2-3 business days.
        </p>
        <a href="/dashboard" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>Back to Dashboard</a>
      </div>
    </div>
  )

  const steps = ['Personal Info', 'Qualifications', 'Availability', 'Agreement']
  const filteredLangs = ALL_LANGUAGES.filter(l => l.toLowerCase().includes(langSearch.toLowerCase()) && !languages.includes(l))
  const filteredSubjects = ALL_SUBJECTS.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase()) && !subjects.includes(s) && !COMMON_SUBJECTS.includes(s))

  return (
    <div className={rootClass} style={{ paddingTop: '5rem', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '44rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: text1, marginBottom: '0.5rem' }}>Become an AceForge Tutor</h1>
          <p style={{ color: text2, fontSize: '1.0625rem' }}>Help students ace their exams. Earn on your schedule.</p>
        </div>

        <div style={{ display: 'flex', gap: '0', marginBottom: '2rem' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: i + 1 <= step ? accent : 'rgba(34,85,14,0.1)', color: i + 1 <= step ? 'white' : text2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 700, transition: 'all 0.3s' }}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.6875rem', color: i + 1 === step ? accent : text2, fontWeight: i + 1 === step ? 700 : 400, textAlign: 'center' }}>{s}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {error && (
            <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />{error}
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: text1 }}>Personal Information</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Full Legal Name *</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} className="input" placeholder="As on your ID" />
                </div>
                <div>
                  <label className="label">Date of Birth *</label>
                  <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Phone Number *</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="label">Timezone *</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input">
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Languages you can tutor in *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                  {languages.map(lang => (
                    <span key={lang} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', color: accent, fontSize: '0.875rem', fontWeight: 600 }}>
                      {lang}
                      <button type="button" onClick={() => toggleLanguage(lang)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: accent, padding: 0, display: 'flex' }}>
                        <X style={{ width: '0.75rem', height: '0.75rem' }} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: text2 }} />
                  <input value={langSearch} onChange={e => { setLangSearch(e.target.value); setShowLangDropdown(true) }}
                    onFocus={() => setShowLangDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLangDropdown(false), 200)}
                    className="input" placeholder="Search and add languages..." style={{ paddingLeft: '2.25rem' }} />
                  {showLangDropdown && filteredLangs.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: surfaceBg, border: '1px solid rgba(34,85,14,0.15)', borderRadius: '0.75rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', marginTop: '0.25rem' }}>
                      {filteredLangs.slice(0, 20).map(lang => (
                        <button key={lang} type="button" onMouseDown={() => { toggleLanguage(lang); setLangSearch('') }}
                          style={{ width: '100%', padding: '0.625rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: text1 }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,85,14,0.05)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

           <div>
                <label className="label">
                  LinkedIn Profile URL
                  <span style={{ fontWeight: 400, color: text2, fontSize: '0.8125rem', marginLeft: '0.375rem' }}>(strongly recommended)</span>
                </label>
                <input value={linkedIn} onChange={e => setLinkedIn(e.target.value)} className="input" placeholder="https://linkedin.com/in/yourname" />
                <div style={{ marginTop: '0.5rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'rgb(37,99,235)', lineHeight: 1.6 }}>
                    💼 <strong>Tip:</strong> Applicants with a verified LinkedIn profile are <strong>3x more likely to be approved</strong>. Make sure your LinkedIn shows your education and experience clearly.
                  </p>
                </div>
              </div>
              <div>
                <label className="label">About You * <span style={{ fontWeight: 400, color: text2, fontSize: '0.8125rem' }}>(students will see this)</span></label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} className="input" rows={4} style={{ resize: 'vertical' }}
                  placeholder="Tell students about your teaching style, experience, and what makes you a great tutor..." />
              </div>

              <div>
                <label className="label">Photo ID * <span style={{ fontWeight: 400, color: text2, fontSize: '0.8125rem' }}>(driver's license or passport — kept confidential)</span></label>
                {idFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.04)', border: '1px solid rgba(34,85,14,0.2)' }}>
                    <span style={{ fontSize: '0.875rem', color: accent, fontWeight: 600, flex: 1 }}>✓ {idFile.name}</span>
                    <button type="button" onClick={() => setIdFile(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: text2 }}><X style={{ width: '1rem', height: '1rem' }} /></button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '0.75rem', border: '2px dashed rgba(34,85,14,0.2)', cursor: 'pointer', background: surfaceBg }}>
                    <Upload style={{ width: '1.25rem', height: '1.25rem', color: text2 }} />
                    <span style={{ fontSize: '0.875rem', color: text2 }}>Upload photo ID (JPG, PNG, PDF)</span>
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={e => setIdFile(e.target.files?.[0] ?? null)} />
                  </label>
                )}
              </div>

              <button onClick={() => {
                if (!fullName || !dateOfBirth || !phone || languages.length === 0 || !bio || !idFile) { setError('Please fill in all required fields.'); return }
                setError(''); setStep(2)
              }} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Continue to Qualifications →
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: text1 }}>Qualifications</h2>

              <div>
                <label className="label">Subjects you can tutor * <span style={{ fontWeight: 400, color: text2, fontSize: '0.8125rem' }}>(select all that apply)</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {COMMON_SUBJECTS.map(sub => (
                    <button key={sub} type="button" onClick={() => toggleSubject(sub)}
                      style={{ padding: '0.375rem 0.875rem', borderRadius: '9999px', border: `1.5px solid ${subjects.includes(sub) ? accent : 'rgba(34,85,14,0.2)'}`, background: subjects.includes(sub) ? 'rgba(34,85,14,0.08)' : 'white', color: subjects.includes(sub) ? accent : text2, fontSize: '0.8125rem', fontWeight: subjects.includes(sub) ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
                      {sub}
                    </button>
                  ))}
                </div>

                {subjects.filter(s => !COMMON_SUBJECTS.includes(s)).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                    {subjects.filter(s => !COMMON_SUBJECTS.includes(s)).map(sub => (
                      <span key={sub} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '9999px', background: 'rgba(34,85,14,0.1)', color: accent, fontSize: '0.8125rem', fontWeight: 600 }}>
                        {sub}
                        <button type="button" onClick={() => toggleSubject(sub)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: accent, padding: 0, display: 'flex' }}>
                          <X style={{ width: '0.75rem', height: '0.75rem' }} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: text2 }} />
                  <input value={subjectSearch} onChange={e => { setSubjectSearch(e.target.value); setShowSubjectDropdown(true) }}
                    onFocus={() => setShowSubjectDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 200)}
                    className="input" placeholder="Search for other subjects (AP, IB, GMAT, etc.)..." style={{ paddingLeft: '2.25rem' }} />
                  {showSubjectDropdown && subjectSearch && filteredSubjects.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: surfaceBg, border: '1px solid rgba(34,85,14,0.15)', borderRadius: '0.75rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', marginTop: '0.25rem' }}>
                      {filteredSubjects.slice(0, 20).map(sub => (
                        <button key={sub} type="button" onMouseDown={() => { toggleSubject(sub); setSubjectSearch('') }}
                          style={{ width: '100%', padding: '0.625rem 1rem', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: text1 }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,85,14,0.05)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                  <input value={institution} onChange={e => setInstitution(e.target.value)} className="input" placeholder="e.g. MIT, Harvard" />
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

              {[
                { label: 'Resume / CV *', file: cvFile, setter: setCvFile, accept: '.pdf,.doc,.docx', hint: 'Upload CV/Resume (PDF)' },
                { label: 'Certifications', file: certFile, setter: setCertFile, accept: '.pdf,.jpg,.jpeg,.png', hint: 'Upload certification (optional)' },
                { label: '30-60 Second Intro Video *', file: videoFile, setter: setVideoFile, accept: '.mp4,.mov,.avi,.webm', hint: 'Upload intro video (MP4, MOV — max 100MB)' },
              ].map(item => (
                <div key={item.label}>
                  <label className="label">{item.label}</label>
                  {item.file ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(34,85,14,0.04)', border: '1px solid rgba(34,85,14,0.2)' }}>
                      <span style={{ fontSize: '0.875rem', color: accent, fontWeight: 600, flex: 1 }}>✓ {item.file.name}</span>
                      <button type="button" onClick={() => item.setter(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: text2 }}><X style={{ width: '1rem', height: '1rem' }} /></button>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '0.75rem', border: '2px dashed rgba(34,85,14,0.2)', cursor: 'pointer', background: surfaceBg }}>
                      <Upload style={{ width: '1.25rem', height: '1.25rem', color: text2 }} />
                      <span style={{ fontSize: '0.875rem', color: text2 }}>{item.hint}</span>
                      <input type="file" accept={item.accept} style={{ display: 'none' }} onChange={e => item.setter(e.target.files?.[0] ?? null)} />
                    </label>
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { setError(''); setStep(1) }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                <button onClick={() => {
                  if (subjects.length === 0 || !education || !institution || !yearsExp || !cvFile || !videoFile) { setError('Please fill in all required fields.'); return }
                  setError(''); setStep(3)
                }} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  Continue to Availability →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: text1 }}>Your Availability</h2>
              <p style={{ fontSize: '0.9375rem', color: text2 }}>Set your weekly availability. Students will book sessions during these times.</p>

              {availability.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.03)', border: '1px dashed rgba(34,85,14,0.2)' }}>
                  <p style={{ color: text2, marginBottom: '1rem' }}>No availability set yet</p>
                  <button onClick={addAvailability} className="btn-secondary" style={{ fontSize: '0.875rem' }}>+ Add Time Slot</button>
                </div>
              )}

              {availability.map((a, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end', padding: '1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.03)', border: '1px solid rgba(34,85,14,0.08)' }}>
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
                  <button onClick={() => removeAvailability(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgb(163,45,45)', padding: '0.5rem', alignSelf: 'flex-end' }}>
                    <X style={{ width: '1.25rem', height: '1.25rem' }} />
                  </button>
                </div>
              ))}

              {availability.length > 0 && (
                <button onClick={addAvailability} className="btn-secondary" style={{ alignSelf: 'flex-start', fontSize: '0.875rem' }}>+ Add Another Slot</button>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { setError(''); setStep(2) }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                <button onClick={() => {
                  if (availability.length === 0) { setError('Please add at least one availability slot.'); return }
                  setError(''); setStep(4)
                }} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  Continue to Agreement →
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: text1 }}>Payment & Agreement</h2>

              <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.04)', border: '1px solid rgba(34,85,14,0.1)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: text1, marginBottom: '0.5rem' }}>💰 How you get paid</p>
                <p style={{ fontSize: '0.8125rem', color: text2, lineHeight: 1.6 }}>
                  You'll receive $30/hr via your preferred payment method within 24 hours after each completed session. Provide at least one payment handle below.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

              <div style={{ padding: '1rem', borderRadius: '0.875rem', background: 'rgba(232,160,32,0.05)', border: '1px solid rgba(232,160,32,0.2)' }}>
                <p style={{ fontSize: '0.8125rem', color: text2, lineHeight: 1.6 }}>
                  🧾 <strong style={{ color: text1 }}>Tax note:</strong> If you earn $600 or more in a calendar year on AceForge, we are required by US law to issue you a 1099-NEC form. We will contact you at that point to collect your tax information securely.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { state: agreedToTerms, setter: setAgreedToTerms, text: "I agree to AceForge's Tutor Terms of Service, including the refund policy, dispute process, and platform fee structure." },
                  { state: agreedToNoCriminal, setter: setAgreedToNoCriminal, text: 'I declare that I have no criminal history and I am legally eligible to work with students including minors. I understand that providing false information will result in immediate termination and potential legal action.' },
                  { state: agreedToNoPoaching, setter: setAgreedToNoPoaching, text: 'I agree not to solicit AceForge students to book sessions outside of the AceForge platform for 12 months. Violation of this agreement may result in legal action and a permanent ban.' },
                  { state: agreedToRecording, setter: setAgreedToRecording, text: 'I consent to all tutoring sessions being recorded for quality assurance and dispute resolution purposes. Recordings are reviewed only in case of a dispute and deleted after 30 days.' },
                  { state: agreedToTax, setter: setAgreedToTax, text: 'I understand that AceForge is required by US law to issue a 1099-NEC to tutors earning $600 or more in a calendar year. By applying, I agree to provide my tax information (W-9) when requested. I understand that failure to provide this information may result in mandatory 24% backup withholding on my payments as required by the IRS.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(34,85,14,0.02)', border: '1px solid rgba(34,85,14,0.08)' }}>
                    <input type="checkbox" checked={item.state} onChange={e => item.setter(e.target.checked)}
                      style={{ width: '1.125rem', height: '1.125rem', accentColor: accent, flexShrink: 0, marginTop: '0.125rem', cursor: 'pointer' }} />
                    <label style={{ fontSize: '0.8125rem', color: text2, lineHeight: 1.6, cursor: 'pointer' }} onClick={() => item.setter(!item.state)}>
                      {item.text}
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { setError(''); setStep(3) }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
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
