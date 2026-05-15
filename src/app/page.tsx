import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Navbar from '@/components/layout/Navbar'
import { BookOpen, Zap, FileText, CheckCircle, ArrowRight, Sparkles, Brain, Download } from 'lucide-react'
import type { Profile } from '@/types'

export default async function HomePage() {
  let profile: Profile | null = null
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      profile = data
    }
  } catch {}

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F4F7EC 0%, #EFF5E3 50%, #F7F3E8 100%)' }}>
      <Navbar profile={profile} />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden pt-16">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{ position:'absolute', top:'25%', right:'-8rem', width:'24rem', height:'24rem', background:'radial-gradient(circle, rgba(34,85,14,0.07) 0%, transparent 70%)', borderRadius:'50%' }} />
          <div style={{ position:'absolute', bottom:'25%', left:'-8rem', width:'20rem', height:'20rem', background:'radial-gradient(circle, rgba(232,160,32,0.08) 0%, transparent 70%)', borderRadius:'50%' }} />
        </div>

        <div className="container-base text-center relative" style={{ zIndex:10 }}>
          <div className="badge badge-primary animate-fade-in" style={{ marginBottom:'1.5rem', padding:'0.5rem 1rem', fontSize:'0.875rem' }}>
            <Sparkles style={{ width:'0.875rem', height:'0.875rem' }} />
            AI-Powered Study Materials
          </div>

          <h1 className="animate-stagger-1" style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'clamp(2.5rem, 8vw, 4.5rem)', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1.5rem', lineHeight:1.1 }}>
            Study smarter,{' '}
            <span className="gradient-text">not harder.</span>
          </h1>

          <p className="animate-stagger-2" style={{ fontSize:'1.125rem', color:'rgb(107,107,88)', maxWidth:'40rem', margin:'0 auto 2.5rem', lineHeight:1.7 }}>
            Generate personalized questions and visual worksheets for any subject, any grade. Get instant AI feedback that actually explains the answer.
          </p>

          <div className="animate-stagger-3" style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem', justifyContent:'center', marginBottom:'3rem' }}>
            <Link href={profile ? '/generate' : '/signup'} className="btn-primary" style={{ fontSize:'1.0625rem', padding:'1rem 2rem', boxShadow:'0 8px 32px rgba(34,85,14,0.2)' }}>
              Start Studying Free <ArrowRight style={{ width:'1rem', height:'1rem' }} />
            </Link>
            <a href="#how-it-works" className="btn-secondary" style={{ fontSize:'1.0625rem', padding:'1rem 2rem' }}>
              See how it works
            </a>
          </div>

          <div className="animate-stagger-4" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:'1.5rem', fontSize:'0.875rem', color:'rgb(107,107,88)' }}>
            {['Free to start', 'All subjects & grades', 'Instant feedback'].map(t => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                <CheckCircle style={{ width:'1rem', height:'1rem', color:'rgb(59,109,17)' }} />
                {t}
              </div>
            ))}
          </div>

          {/* Hero preview card */}
          <div className="animate-stagger-5 card" style={{ marginTop:'4rem', maxWidth:'42rem', marginLeft:'auto', marginRight:'auto', overflow:'hidden', boxShadow:'0 24px 64px rgba(34,85,14,0.12)' }}>
            <div style={{ background:'linear-gradient(135deg, #F8FAF3, white)', padding:'2rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
                <span className="badge badge-primary">Biology · Grade 10</span>
                <span style={{ fontSize:'0.875rem', color:'rgb(107,107,88)' }}>Photosynthesis</span>
              </div>
              <p style={{ fontSize:'0.9375rem', fontWeight:600, color:'rgb(26,26,20)', marginBottom:'1rem' }}>
                1. Where do the light-dependent reactions take place?
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'1rem' }}>
                {[
                  { label:'A. Stroma', correct:false },
                  { label:'B. Thylakoid membrane', correct:true },
                  { label:'C. Cytoplasm', correct:false },
                  { label:'D. Nucleus', correct:false },
                ].map(opt => (
                  <div key={opt.label} style={{
                    padding:'0.625rem 0.875rem', borderRadius:'0.625rem', fontSize:'0.875rem',
                    border: opt.correct ? '2px solid rgb(59,109,17)' : '2px solid rgb(229,231,235)',
                    background: opt.correct ? 'rgb(234,243,222)' : 'rgb(249,250,251)',
                    color: opt.correct ? 'rgb(59,109,17)' : 'rgb(107,107,88)',
                    fontWeight: opt.correct ? 600 : 400,
                    display:'flex', alignItems:'center', gap:'0.375rem'
                  }}>
                    {opt.correct && <CheckCircle style={{ width:'0.875rem', height:'0.875rem', flexShrink:0 }} />}
                    {opt.label}
                  </div>
                ))}
              </div>
              <div style={{ padding:'1rem', borderRadius:'0.75rem', background:'rgb(234,243,222)', border:'1px solid rgba(59,109,17,0.2)' }}>
                <p style={{ fontSize:'0.875rem', fontWeight:700, color:'rgb(59,109,17)', marginBottom:'0.25rem' }}>Excellent!!! 🎉</p>
                <p style={{ fontSize:'0.8125rem', color:'rgba(59,109,17,0.8)', lineHeight:1.6 }}>
                  The light-dependent reactions occur in the thylakoid membrane, where chlorophyll captures sunlight to produce ATP and NADPH.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section" style={{ background:'white' }}>
        <div className="container-base">
          <div style={{ textAlign:'center', marginBottom:'4rem' }}>
            <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(34,85,14)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.75rem' }}>How it works</p>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'clamp(2rem, 5vw, 3rem)', fontWeight:700, color:'rgb(26,26,20)' }}>
              From topic to test-ready <span className="gradient-text">in seconds</span>
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'2rem' }}>
            {[
              { icon: BookOpen, step:1, title:'Enter your topic', desc:'Tell us your subject, grade level, and the specific topic. Add extra focus areas if you want.' },
              { icon: Sparkles, step:2, title:'AI generates materials', desc:'GPT-4 creates tailored questions or a full visual worksheet matched to your grade level.' },
              { icon: Brain, step:3, title:'Study & get feedback', desc:'Answer questions and get instant step-by-step explanations. Download as PDF to study anywhere.' },
            ].map(s => (
              <div key={s.step} className="card" style={{ padding:'2rem' }}>
                <div style={{ width:'3.5rem', height:'3.5rem', borderRadius:'1rem', background:'rgba(34,85,14,0.08)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.25rem' }}>
                  <s.icon style={{ width:'1.5rem', height:'1.5rem', color:'rgb(34,85,14)' }} />
                </div>
                <div style={{ fontSize:'0.6875rem', fontWeight:700, color:'rgba(34,85,14,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>Step {s.step}</div>
                <h3 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.75rem' }}>{s.title}</h3>
                <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', lineHeight:1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ background:'linear-gradient(180deg, #F4F7EC, #EEF4E2)' }}>
        <div className="container-base">
          <div style={{ textAlign:'center', marginBottom:'4rem' }}>
            <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(34,85,14)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.75rem' }}>Features</p>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'clamp(2rem, 5vw, 3rem)', fontWeight:700, color:'rgb(26,26,20)' }}>
              Everything you need to <span className="gradient-text">ace it</span>
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'1.5rem' }}>
            {[
              { icon:Brain, title:'Smart Questions', desc:'MC and free response questions generated for your exact topic and grade.', bg:'rgba(34,85,14,0.08)', color:'rgb(34,85,14)' },
              { icon:FileText, title:'Visual Worksheets', desc:'Step-by-step study sheets with diagrams, vocab, summaries, and practice problems.', bg:'rgba(232,160,32,0.12)', color:'rgb(180,120,10)' },
              { icon:Zap, title:'Instant Feedback', desc:'Clear, encouraging explanations for every answer that actually make sense.', bg:'rgba(99,102,241,0.1)', color:'rgb(79,70,229)' },
              { icon:Download, title:'PDF Download', desc:'Export any worksheet or question set as a clean printable PDF.', bg:'rgba(20,184,166,0.1)', color:'rgb(15,118,110)' },
            ].map(f => (
              <div key={f.title} className="card-hover" style={{ padding:'1.5rem' }}>
                <div style={{ width:'3rem', height:'3rem', borderRadius:'0.75rem', background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem' }}>
                  <f.icon style={{ width:'1.25rem', height:'1.25rem', color:f.color }} />
                </div>
                <h3 style={{ fontWeight:600, color:'rgb(26,26,20)', marginBottom:'0.5rem' }}>{f.title}</h3>
                <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="section" style={{ background:'white' }}>
        <div className="container-base" style={{ textAlign:'center' }}>
          <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'clamp(1.75rem, 4vw, 2.5rem)', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1rem' }}>Works for every subject</h2>
          <p style={{ color:'rgb(107,107,88)', marginBottom:'2.5rem', maxWidth:'32rem', margin:'0 auto 2.5rem' }}>From kindergarten to college — any subject, any topic, any grade level.</p>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'0.75rem' }}>
            {[
              { label:'Biology', emoji:'🧬', bg:'#E8F5E9', color:'#2E7D32' },
              { label:'Chemistry', emoji:'⚗️', bg:'#E3F2FD', color:'#1565C0' },
              { label:'Physics', emoji:'⚛️', bg:'#EDE7F6', color:'#4527A0' },
              { label:'Math', emoji:'📐', bg:'#FFF3E0', color:'#E65100' },
              { label:'Algebra', emoji:'🔢', bg:'#FCE4EC', color:'#880E4F' },
              { label:'US History', emoji:'🦅', bg:'#E8EAF6', color:'#283593' },
              { label:'Literature', emoji:'📚', bg:'#FFF8E1', color:'#F57F17' },
              { label:'Geography', emoji:'🗺️', bg:'#E0F7FA', color:'#006064' },
              { label:'Economics', emoji:'📊', bg:'#EFEBE9', color:'#4E342E' },
              { label:'Calculus', emoji:'∫', bg:'#F3E5F5', color:'#6A1B9A' },
              { label:'Grammar', emoji:'✍️', bg:'#F1F8E9', color:'#33691E' },
              { label:'World History', emoji:'🌍', bg:'#E0F2F1', color:'#004D40' },
            ].map(s => (
              <span key={s.label} className="badge" style={{ background:s.bg, color:s.color, padding:'0.5rem 1rem', fontSize:'0.875rem' }}>
                {s.emoji} {s.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section" style={{ background:'linear-gradient(180deg, #EEF4E2, #F4F7EC)' }}>
        <div className="container-base">
          <div style={{ textAlign:'center', marginBottom:'4rem' }}>
            <p style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(34,85,14)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.75rem' }}>Pricing</p>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'clamp(2rem, 5vw, 3rem)', fontWeight:700, color:'rgb(26,26,20)' }}>Simple, honest pricing</h2>
          </div>
          <PricingCards />
          <p style={{ textAlign:'center', fontSize:'0.875rem', color:'rgb(107,107,88)', marginTop:'2rem' }}>🔒 Secure payment via Stripe · Cancel any time</p>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background:'rgb(34,85,14)' }}>
        <div className="container-base" style={{ textAlign:'center' }}>
          <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'clamp(2rem, 5vw, 3rem)', fontWeight:700, color:'white', marginBottom:'1.5rem' }}>Ready to study smarter?</h2>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'1.125rem', marginBottom:'2.5rem', maxWidth:'32rem', margin:'0 auto 2.5rem' }}>
            Join students using StudySpark to turn any topic into an interactive study session.
          </p>
          <Link href={profile ? '/generate' : '/signup'} className="btn-accent" style={{ fontSize:'1.0625rem', padding:'1rem 2rem' }}>
            Start for free <ArrowRight style={{ width:'1rem', height:'1rem' }} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:'rgb(26,26,20)', color:'rgba(255,255,255,0.5)', padding:'2.5rem 1.5rem' }}>
        <div className="container-base" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'1rem', fontSize:'0.875rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <div style={{ width:'1.5rem', height:'1.5rem', borderRadius:'0.375rem', background:'rgb(74,122,40)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <BookOpen style={{ width:'0.75rem', height:'0.75rem', color:'white' }} />
            </div>
            <span style={{ fontWeight:600, color:'white' }}>StudySpark</span>
          </div>
          <p>© {new Date().getFullYear()} StudySpark. Built for students.</p>
          <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
            <Link href="/pricing" style={{ color:'rgba(255,255,255,0.5)', textDecoration:'none' }}>Pricing</Link>
            <Link href="/login" style={{ color:'rgba(255,255,255,0.5)', textDecoration:'none' }}>Log in</Link>
            <Link href="/terms" style={{ color:'rgba(255,255,255,0.5)', textDecoration:'none' }}>Terms</Link>
            <Link href="/privacy" style={{ color:'rgba(255,255,255,0.5)', textDecoration:'none' }}>Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PricingCards() {
  const FREE = ['2 question sets per day','2 worksheets per day','All subjects & grade levels','Session history','PDF download','30-second generation wait']
  const PREMIUM = ['Unlimited question sets','Unlimited worksheets','All subjects & grade levels','Session history','PDF download','~15 second generation','Priority support','Early access to new features']
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'1.5rem', maxWidth:'48rem', margin:'0 auto' }}>
      <div className="card" style={{ padding:'2rem' }}>
        <h3 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, marginBottom:'0.25rem' }}>Free</h3>
        <div style={{ fontSize:'2rem', fontWeight:700, marginBottom:'2rem' }}>$0<span style={{ fontSize:'1rem', fontWeight:400, color:'rgb(107,107,88)' }}> / month</span></div>
        <ul style={{ listStyle:'none', padding:0, margin:'0 0 2rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {FREE.map(f => <li key={f} style={{ display:'flex', alignItems:'center', gap:'0.625rem', fontSize:'0.875rem', color:'rgb(107,107,88)' }}><CheckCircle style={{ width:'1rem', height:'1rem', color:'rgb(59,109,17)', flexShrink:0 }} />{f}</li>)}
        </ul>
        <Link href="/signup" className="btn-secondary" style={{ width:'100%', justifyContent:'center' }}>Get started free</Link>
      </div>
      <div className="card" style={{ padding:'2rem', border:'2px solid rgb(34,85,14)', position:'relative', boxShadow:'0 8px 32px rgba(34,85,14,0.12)' }}>
        <div style={{ position:'absolute', top:'-0.875rem', left:'50%', transform:'translateX(-50%)', background:'rgb(34,85,14)', color:'white', fontSize:'0.75rem', fontWeight:700, padding:'0.375rem 1rem', borderRadius:'9999px' }}>MOST POPULAR</div>
        <h3 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.5rem', fontWeight:700, marginBottom:'0.25rem' }}>Premium ⚡</h3>
        <div style={{ fontSize:'2rem', fontWeight:700, marginBottom:'0.25rem' }}>$5.99<span style={{ fontSize:'1rem', fontWeight:400, color:'rgb(107,107,88)' }}> / month</span></div>
        <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', marginBottom:'2rem' }}>Billed monthly · Cancel anytime</p>
        <ul style={{ listStyle:'none', padding:0, margin:'0 0 2rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {PREMIUM.map(f => <li key={f} style={{ display:'flex', alignItems:'center', gap:'0.625rem', fontSize:'0.875rem', color:'rgb(26,26,20)' }}><CheckCircle style={{ width:'1rem', height:'1rem', color:'rgb(34,85,14)', flexShrink:0 }} />{f}</li>)}
        </ul>
        <Link href="/signup?plan=premium" className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>Upgrade to Premium →</Link>
      </div>
    </div>
  )
}