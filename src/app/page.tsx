import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Navbar from '@/components/layout/Navbar'
import { CheckCircle, ArrowRight } from 'lucide-react'
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

  const subjects = [
    { label:'Biology', emoji:'🧬', color:'#2E7D32', border:'rgba(46,125,50,0.3)' },
    { label:'Chemistry', emoji:'⚗️', color:'#1565C0', border:'rgba(21,101,192,0.3)' },
    { label:'Physics', emoji:'⚛️', color:'#4527A0', border:'rgba(69,39,160,0.3)' },
    { label:'Math', emoji:'📐', color:'#E65100', border:'rgba(230,81,0,0.3)' },
    { label:'Algebra', emoji:'🔢', color:'#880E4F', border:'rgba(136,14,79,0.3)' },
    { label:'US History', emoji:'🦅', color:'#1A237E', border:'rgba(26,35,126,0.3)' },
    { label:'Literature', emoji:'📚', color:'#F57F17', border:'rgba(245,127,23,0.3)' },
    { label:'Geography', emoji:'🗺️', color:'#006064', border:'rgba(0,96,100,0.3)' },
    { label:'Economics', emoji:'📊', color:'#4E342E', border:'rgba(78,52,46,0.3)' },
    { label:'Calculus', emoji:'∫', color:'#6A1B9A', border:'rgba(106,27,154,0.3)' },
    { label:'Grammar', emoji:'✍️', color:'#33691E', border:'rgba(51,105,30,0.3)' },
    { label:'World History', emoji:'🌍', color:'#004D40', border:'rgba(0,77,64,0.3)' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap');

        :root {
          --g: #22550e;
          --g2: #4a7a28;
          --g3: #7ab648;
          --glow: rgba(34,85,14,0.3);
          --glow2: rgba(122,182,72,0.15);
        }

        .af-page { background: #f8faf5; min-height: 100vh; overflow-x: hidden; }

        .af-cursor {
          position: fixed; width: 10px; height: 10px;
          background: var(--g); border-radius: 50%;
          pointer-events: none; z-index: 9999;
          transition: transform 0.15s ease;
          mix-blend-mode: multiply;
          display: none;
        }
        .af-cursor-ring {
          position: fixed; width: 36px; height: 36px;
          border: 1.5px solid var(--g); border-radius: 50%;
          pointer-events: none; z-index: 9998;
          transition: left 0.12s ease, top 0.12s ease, transform 0.2s ease;
          opacity: 0.4;
          display: none;
        }

        #af-particles {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0; opacity: 0.5;
        }

        /* HERO */
        .af-hero {
          min-height: 100vh;
          display: flex; align-items: center;
          position: relative; padding: 7rem 1.5rem 4rem;
          overflow: hidden;
        }
        .af-hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 60% 50% at 15% 50%, rgba(34,85,14,0.05) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 85% 20%, rgba(122,182,72,0.06) 0%, transparent 70%),
            #f8faf5;
        }
        .af-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(34,85,14,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,85,14,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }
        .af-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .af-orb-1 { width:500px; height:500px; background:rgba(34,85,14,0.06); top:-10%; right:-10%; animation-delay:0s; }
        .af-orb-2 { width:350px; height:350px; background:rgba(122,182,72,0.07); bottom:0; left:-5%; animation-delay:-3s; }
        @keyframes orbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }

        .af-hero-inner {
          position: relative; z-index: 2;
          max-width: 72rem; margin: 0 auto; width: 100%;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 4rem; align-items: center;
        }
        @media(max-width:900px){ .af-hero-inner{ grid-template-columns:1fr; gap:3rem; } }

        .af-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(34,85,14,0.06); border: 1px solid rgba(34,85,14,0.15);
          padding: 0.375rem 1rem; border-radius: 9999px;
          font-family: 'Syne', sans-serif; font-size: 0.8125rem; font-weight: 600;
          color: var(--g); letter-spacing: 0.05em; text-transform: uppercase;
          margin-bottom: 1.75rem;
        }
        .af-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--g3);
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }

        /* ── FIXED TITLE ─────────────────────────────────────────────────
           • Reduced max size: 4rem cap instead of 5rem
           • font-weight 700 instead of 800 — less slab-like, easier to scan
           • letter-spacing slightly relaxed (-0.02em → -0.015em)
           • font-feature-settings for ligatures & kerning
        ──────────────────────────────────────────────────────────────── */
        .af-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.25rem, 4.5vw, 4rem);
          font-weight: 700;
          line-height: 1.08;
          color: #0a1a06;
          letter-spacing: -0.015em;
          font-feature-settings: "kern" 1, "liga" 1;
          margin-bottom: 1.5rem;
        }
        .af-title .accent {
          background: linear-gradient(135deg, var(--g) 0%, var(--g3) 60%, #b8e878 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; position: relative; display: block;
        }
        .af-title .accent::after {
          content: ''; position: absolute; bottom: 2px; left: 0;
          width: 100%; height: 3px;
          background: linear-gradient(90deg, var(--g), var(--g3), transparent);
          border-radius: 2px;
          animation: underlineGrow 1.2s cubic-bezier(0.16,1,0.3,1) 0.5s both;
          transform-origin: left; transform: scaleX(0);
        }
        @keyframes underlineGrow { to { transform: scaleX(1); } }

        .af-sub {
          font-family: 'Syne', sans-serif;
          font-size: 1.125rem; color: #3d5c35; line-height: 1.75;
          max-width: 36rem; margin-bottom: 2.5rem;
        }

        .af-cta-row { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 2.5rem; }

        .af-btn-p {
          display: inline-flex; align-items: center; gap: 0.625rem;
          background: var(--g); color: white;
          font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 600;
          padding: 0.875rem 1.75rem; border-radius: 0.75rem;
          text-decoration: none; border: none; cursor: pointer;
          box-shadow: 0 4px 20px var(--glow);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .af-btn-p:hover { transform: translateY(-2px); box-shadow: 0 8px 30px var(--glow); }

        .af-btn-s {
          display: inline-flex; align-items: center; gap: 0.625rem;
          background: transparent; color: var(--g);
          font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 600;
          padding: 0.875rem 1.75rem; border-radius: 0.75rem;
          text-decoration: none; border: 1.5px solid rgba(34,85,14,0.25);
          cursor: pointer; transition: all 0.2s;
        }
        .af-btn-s:hover { background: rgba(34,85,14,0.04); border-color: rgba(34,85,14,0.5); transform: translateY(-1px); }

        .af-trust { display: flex; flex-wrap: wrap; gap: 1.25rem; font-family: 'Syne', sans-serif; font-size: 0.875rem; color: #5a7a52; }
        .af-trust-item { display: flex; align-items: center; gap: 0.4rem; }

        /* ── FIXED DEMO CARD + BADGES ────────────────────────────────────
           The wrapper is now position:relative with enough padding so the
           absolutely-positioned badges sit outside the card but inside the
           wrapper — no clipping, no overflow issues.
        ──────────────────────────────────────────────────────────────── */
        .af-demo-wrap {
          position: relative;
          /* padding gives space for the badges that hang outside the card */
          padding: 2rem 1rem 1rem 1rem;
        }
        .af-demo-wrap::before {
          content: ''; position: absolute;
          /* inset adjusted to match the inner card, not the padded wrapper */
          top: 2rem; left: 1rem; right: 1rem; bottom: 1rem;
          border-radius: 1.375rem;
          background: linear-gradient(135deg, var(--g), var(--g3), rgba(34,85,14,0.1));
          z-index: -1; opacity: 0.3; animation: glowPulse 3s ease-in-out infinite alternate;
        }
        @keyframes glowPulse { from{opacity:0.2;filter:blur(0)} to{opacity:0.5;filter:blur(3px)} }

        .af-demo {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(34,85,14,0.1);
          border-radius: 1.25rem; padding: 1.75rem;
          box-shadow: 0 20px 60px rgba(34,85,14,0.1);
          position: relative; overflow: hidden;
        }
        .af-demo::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--g), var(--g3));
        }

        .af-demo-dots { display: flex; gap: 6px; margin-bottom: 1.25rem; }
        .af-demo-dot { width: 10px; height: 10px; border-radius: 50%; }

        .af-demo-badge {
          float: right; margin-top: -2px;
          background: rgba(34,85,14,0.07); border: 1px solid rgba(34,85,14,0.15);
          padding: 0.2rem 0.6rem; border-radius: 9999px;
          font-family: 'Syne', sans-serif; font-size: 0.6875rem; font-weight: 600; color: var(--g);
        }

        .af-demo-q {
          font-family: 'Syne', sans-serif; font-size: 0.9375rem; font-weight: 600;
          color: #0a1a06; margin-bottom: 1rem; line-height: 1.5; clear: both;
        }

        .af-demo-opts { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
        .af-demo-opt {
          padding: 0.625rem 0.875rem; border-radius: 0.625rem;
          font-family: 'Syne', sans-serif; font-size: 0.8125rem; font-weight: 500;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .af-opt-correct { background: rgba(34,85,14,0.06); border: 1.5px solid var(--g); color: var(--g); }
        .af-opt-neutral { background: #f8f9fa; border: 1.5px solid #e5e7eb; color: #6b7280; }

        .af-demo-fb {
          background: rgba(34,85,14,0.04); border: 1px solid rgba(34,85,14,0.1);
          border-radius: 0.75rem; padding: 0.875rem;
        }
        .af-demo-fb-title { font-family:'Syne',sans-serif; font-size:0.8125rem; font-weight:700; color:var(--g); margin-bottom:0.25rem; }
        .af-demo-fb-text { font-size:0.8125rem; color:#3d5c35; line-height:1.6; }

        /* Badges that float around the demo card */
        .af-float {
          position: absolute;
          background: white;
          border: 1px solid rgba(34,85,14,0.12);
          border-radius: 0.875rem;
          padding: 0.625rem 0.875rem;
          box-shadow: 0 8px 24px rgba(34,85,14,0.12);
          font-family: 'Syne', sans-serif;
          animation: floatUp 4s ease-in-out infinite;
          z-index: 10;
          /* prevent the badges from being cut off */
          white-space: nowrap;
        }
        /* Top-right badge: sits above & to the right of the card */
        .af-float-1 {
          top: 0;
          right: 0;
          animation-delay: 0s;
        }
        /* Bottom-left badge: sits below & slightly left of the card */
        .af-float-2 {
          bottom: -0.25rem;
          left: 0;
          animation-delay: -2s;
        }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .af-float-num { font-size:1.125rem; font-weight:800; color:var(--g); }
        .af-float-label { font-size:0.625rem; color:#7a9470; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; }

        /* SECTIONS */
        .af-section { padding: 6rem 1.5rem; }
        .af-section-inner { max-width: 72rem; margin: 0 auto; }

        .af-label {
          display: flex; align-items: center; gap: 0.5rem;
          font-family: 'Syne', sans-serif; font-size: 0.75rem; font-weight: 700;
          color: var(--g); text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
        }
        .af-label::before { content:''; width:1.5rem; height:2px; background:var(--g3); border-radius:1px; }

        .af-h2 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.875rem, 4vw, 2.75rem);
          font-weight: 800; color: #0a1a06; line-height: 1.1;
          letter-spacing: -0.02em; margin-bottom: 1rem;
        }
        .af-p { font-size: 1.0625rem; color: #3d5c35; line-height: 1.7; max-width: 36rem; }

        /* Steps */
        .af-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 1.5rem; margin-top: 3rem; }
        .af-step {
          padding: 2rem; background: white;
          border: 1px solid rgba(34,85,14,0.08); border-radius: 1.25rem;
          position: relative; overflow: hidden; transition: all 0.3s;
        }
        .af-step:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(34,85,14,0.1); border-color: rgba(34,85,14,0.2); }
        .af-step-bg-num {
          position: absolute; top: 0.5rem; right: 1rem;
          font-family: 'Syne', sans-serif; font-size: 5rem; font-weight: 800;
          color: rgba(34,85,14,0.05); line-height: 1; pointer-events: none;
        }
        .af-step-icon { font-size: 1.75rem; margin-bottom: 1.25rem; }
        .af-step-title { font-family:'Syne',sans-serif; font-size:1.125rem; font-weight:700; color:#0a1a06; margin-bottom:0.625rem; }
        .af-step-desc { font-size:0.9375rem; color:#3d5c35; line-height:1.7; }

        /* Features */
        .af-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap: 1.25rem; margin-top: 3rem; }
        .af-feat {
          padding: 1.75rem; background: white;
          border: 1px solid rgba(34,85,14,0.08); border-radius: 1.25rem;
          transition: all 0.3s; position: relative; overflow: hidden;
        }
        .af-feat::after {
          content:''; position:absolute; bottom:0; left:0; right:0; height:2px;
          background: linear-gradient(90deg, var(--g), var(--g3));
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s;
        }
        .af-feat:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(34,85,14,0.08); border-color:rgba(34,85,14,0.15); }
        .af-feat:hover::after { transform: scaleX(1); }
        .af-feat-icon { font-size:1.5rem; margin-bottom:1rem; }
        .af-feat-title { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; color:#0a1a06; margin-bottom:0.5rem; }
        .af-feat-desc { font-size:0.875rem; color:#3d5c35; line-height:1.6; }

        /* Marquee */
        .af-marquee-outer { overflow: hidden; padding: 0.5rem 0; }
        .af-marquee-track { display: flex; gap: 0.75rem; animation: scroll 30s linear infinite; width: max-content; }
        .af-marquee-track:hover { animation-play-state: paused; }
        @keyframes scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .af-tag {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 1rem; border-radius: 9999px; white-space: nowrap;
          font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 600;
          border: 1.5px solid; transition: transform 0.2s; cursor: default;
        }
        .af-tag:hover { transform: scale(1.05); }

        /* Pricing */
        .af-pricing { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap: 1.5rem; max-width: 46rem; margin: 3rem auto 0; }
        .af-pc {
          background: white; border: 1px solid rgba(34,85,14,0.1);
          border-radius: 1.5rem; padding: 2.25rem; position: relative; transition: all 0.3s;
        }
        .af-pc:hover { transform: translateY(-4px); box-shadow: 0 20px 48px rgba(34,85,14,0.1); }
        .af-pc.hot { border: 2px solid var(--g); box-shadow: 0 8px 40px var(--glow); }
        .af-pc-badge {
          position: absolute; top: -0.875rem; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, var(--g), var(--g2));
          color: white; font-family: 'Syne', sans-serif;
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.08em;
          padding: 0.375rem 1.25rem; border-radius: 9999px; white-space: nowrap;
        }
        .af-pc-name { font-family:'Syne',sans-serif; font-size:1.25rem; font-weight:700; color:#0a1a06; margin-bottom:1rem; }
        .af-pc-price { font-family:'Syne',sans-serif; font-size:2.75rem; font-weight:800; color:#0a1a06; line-height:1; }
        .af-pc-per { font-size:0.9375rem; font-weight:400; color:#7a9470; }
        .af-pc-list { list-style:none; padding:0; margin:1.5rem 0; display:flex; flex-direction:column; gap:0.625rem; }
        .af-pc-item { display:flex; align-items:center; gap:0.625rem; font-family:'Syne',sans-serif; font-size:0.9375rem; color:#3d5c35; }

        /* CTA */
        .af-cta-section {
          background: linear-gradient(135deg, #091505, var(--g), #163a0c);
          padding: 6rem 1.5rem; text-align: center; position: relative; overflow: hidden;
        }
        .af-cta-section::before {
          content:''; position:absolute; inset:0;
          background-image: radial-gradient(circle at 20% 50%, rgba(122,182,72,0.08) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(122,182,72,0.06) 0%, transparent 50%);
        }
        .af-cta-inner { position:relative; z-index:1; max-width:48rem; margin:0 auto; }
        .af-cta-h { font-family:'Syne',sans-serif; font-size:clamp(2rem,5vw,3.5rem); font-weight:800; color:white; line-height:1.1; letter-spacing:-0.02em; margin-bottom:1rem; }
        .af-cta-p { font-size:1.125rem; color:rgba(255,255,255,0.65); margin-bottom:2.5rem; line-height:1.7; }
        .af-cta-btn {
          display:inline-flex; align-items:center; gap:0.625rem;
          background:white; color:var(--g);
          font-family:'Syne',sans-serif; font-size:1rem; font-weight:700;
          padding:0.875rem 2rem; border-radius:0.75rem;
          text-decoration:none; transition:all 0.2s;
          box-shadow:0 4px 20px rgba(0,0,0,0.2);
        }
        .af-cta-btn:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.3); }

        /* Footer */
        .af-footer { background:#050d03; padding:2.5rem 1.5rem; }
        .af-footer-inner { max-width:72rem; margin:0 auto; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem; }
        .af-logo-wrap { display:flex; align-items:center; gap:0.625rem; }
        .af-logo-box { width:1.75rem; height:1.75rem; background:linear-gradient(135deg,var(--g),var(--g3)); border-radius:0.5rem; display:flex; align-items:center; justify-content:center; }
        .af-logo-name { font-family:'Syne',sans-serif; font-weight:700; color:white; }
        .af-copy { font-family:'Syne',sans-serif; font-size:0.8125rem; color:rgba(255,255,255,0.25); }
        .af-flinks { display:flex; gap:1.5rem; }
        .af-flink { font-family:'Syne',sans-serif; font-size:0.8125rem; color:rgba(255,255,255,0.35); text-decoration:none; transition:color 0.2s; }
        .af-flink:hover { color:rgba(255,255,255,0.8); }

        @keyframes heroFade { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .af-anim-1 { animation: heroFade 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .af-anim-2 { animation: heroFade 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .af-anim-3 { animation: heroFade 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .af-anim-4 { animation: heroFade 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s both; }
        .af-anim-5 { animation: heroFade 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s both; }
      `}</style>

      <canvas id="af-particles" style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:0.5 }} />
      <div id="af-cursor" className="af-cursor" />
      <div id="af-cursor-ring" className="af-cursor-ring" />

      <div className="af-page">
        <Navbar profile={profile} />

        {/* HERO */}
        <section className="af-hero">
          <div className="af-hero-bg" />
          <div className="af-grid" />
          <div className="af-orb af-orb-1" />
          <div className="af-orb af-orb-2" />
          <div className="af-hero-inner">

            {/* Left */}
            <div>
              <div className="af-eyebrow af-anim-1">
                <div className="af-eyebrow-dot" />
                AI-Powered Study Platform
              </div>
              <h1 className="af-title af-anim-2">
                Study smarter.
                <span className="accent">Ace everything.</span>
              </h1>
              <p className="af-sub af-anim-3">
                Generate personalized questions, visual worksheets, and instant AI feedback — upload your notes and study from your actual content.
              </p>
              <div className="af-cta-row af-anim-4">
                <Link href={profile ? '/generate' : '/signup'} className="af-btn-p">
                  Start for free <ArrowRight style={{ width:'1rem', height:'1rem' }} />
                </Link>
                <a href="#how-it-works" className="af-btn-s">See how it works</a>
              </div>
              <div className="af-trust af-anim-5">
                {['Free to start', 'All subjects & grades', 'Upload your notes'].map(t => (
                  <div key={t} className="af-trust-item">
                    <CheckCircle style={{ width:'1rem', height:'1rem', color:'var(--g3)' }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — demo card + properly contained floating badges */}
            <div className="af-demo-wrap af-anim-5">
              {/* Badges are siblings of af-demo, positioned within the padded wrapper */}
              <div className="af-float af-float-1">
                <div className="af-float-num">98%</div>
                <div className="af-float-label">Accuracy</div>
              </div>
              <div className="af-float af-float-2">
                <div className="af-float-num">⚡ Fast</div>
                <div className="af-float-label">AI Generation</div>
              </div>

              <div className="af-demo">
                <div className="af-demo-dots">
                  <div className="af-demo-dot" style={{ background:'#ff5f57' }} />
                  <div className="af-demo-dot" style={{ background:'#ffbd2e' }} />
                  <div className="af-demo-dot" style={{ background:'#28c840' }} />
                  <div className="af-demo-badge">Biology · Grade 10</div>
                </div>
                <div className="af-demo-q">
                  Where do the light-dependent reactions of photosynthesis take place?
                </div>
                <div className="af-demo-opts">
                  <div className="af-demo-opt af-opt-neutral">A. Stroma of the chloroplast</div>
                  <div className="af-demo-opt af-opt-correct">
                    <CheckCircle style={{ width:'0.875rem', height:'0.875rem', flexShrink:0 }} />
                    B. Thylakoid membrane
                  </div>
                  <div className="af-demo-opt af-opt-neutral">C. Cytoplasm</div>
                  <div className="af-demo-opt af-opt-neutral">D. Nucleus</div>
                </div>
                <div className="af-demo-fb">
                  <div className="af-demo-fb-title">🎉 Excellent!</div>
                  <div className="af-demo-fb-text">The thylakoid membrane contains chlorophyll, which captures light energy to produce ATP and NADPH.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="af-section" style={{ background:'white' }}>
          <div className="af-section-inner">
            <div className="af-label">How it works</div>
            <h2 className="af-h2">From topic to test-ready<br />in under a minute</h2>
            <p className="af-p">No more staring at a blank page. Just tell AceForge what you're studying.</p>
            <div className="af-steps">
              {[
                { num:'01', emoji:'✏️', title:'Enter your topic', desc:'Type any subject, grade, and topic — or upload your lecture notes, PDFs, slides, or images directly.' },
                { num:'02', emoji:'⚡', title:'AI generates instantly', desc:'GPT-4o creates tailored questions or a full visual worksheet matched to your exact level and difficulty.' },
                { num:'03', emoji:'🧠', title:'Study with feedback', desc:'Answer questions, get instant AI explanations, track your weak spots, and practice them automatically.' },
              ].map(s => (
                <div key={s.num} className="af-step">
                  <div className="af-step-bg-num">{s.num}</div>
                  <div className="af-step-icon">{s.emoji}</div>
                  <div className="af-step-title">{s.title}</div>
                  <div className="af-step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="af-section" style={{ background:'#f8faf5' }}>
          <div className="af-section-inner">
            <div style={{ textAlign:'center', marginBottom:'0.5rem' }}>
              <div className="af-label" style={{ justifyContent:'center' }}>Features</div>
              <h2 className="af-h2">Everything you need to ace it</h2>
              <p className="af-p" style={{ margin:'0 auto' }}>Built for students who want results, not busywork.</p>
            </div>
            <div className="af-features">
              {[
                { emoji:'🧠', title:'Smart Questions', desc:'MC and free response generated for your exact topic, grade, and difficulty level.' },
                { emoji:'📄', title:'Visual Worksheets', desc:'Step-by-step study sheets with vocab, diagrams, summaries, and practice problems.' },
                { emoji:'📤', title:'Upload Your Notes', desc:'Drop in lecture PDFs, slides, or photos — generate questions from your actual content.' },
                { emoji:'📊', title:'Performance Analytics', desc:'See exactly which topics you\'re strong in and which need work with visual charts.' },
                { emoji:'⚡', title:'Instant AI Feedback', desc:'Every wrong answer gets a clear, step-by-step explanation that actually makes sense.' },
                { emoji:'🎯', title:'Smart Retry', desc:'Got questions wrong? AceForge generates targeted practice for your weak spots automatically.' },
                { emoji:'📥', title:'PDF Export', desc:'Download any question set or worksheet as a clean, printable PDF.' },
                { emoji:'🌱', title:'4 Difficulty Levels', desc:'Easy, Medium, Hard, and Expert — from basic review to AP exam difficulty.' },
              ].map(f => (
                <div key={f.title} className="af-feat">
                  <div className="af-feat-icon">{f.emoji}</div>
                  <div className="af-feat-title">{f.title}</div>
                  <div className="af-feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SUBJECTS */}
        <section className="af-section" style={{ background:'white', paddingTop:'4rem', paddingBottom:'4rem' }}>
          <div className="af-section-inner" style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <h2 className="af-h2">Works for every subject</h2>
            <p className="af-p" style={{ margin:'0 auto' }}>K-5 through college — any subject, any topic, any grade.</p>
          </div>
          <div className="af-marquee-outer">
            <div className="af-marquee-track">
              {[...subjects, ...subjects].map((s, i) => (
                <span key={i} className="af-tag" style={{ color:s.color, borderColor:s.border, background:`${s.border.replace('0.3','0.05')}` }}>
                  {s.emoji} {s.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="af-section" style={{ background:'#f8faf5' }}>
          <div className="af-section-inner" style={{ textAlign:'center' }}>
            <div className="af-label" style={{ justifyContent:'center' }}>Pricing</div>
            <h2 className="af-h2">Simple, honest pricing</h2>
            <p className="af-p" style={{ margin:'0 auto' }}>Start free, upgrade when you need more.</p>
            <div className="af-pricing">
              <div className="af-pc">
                <div className="af-pc-name">Free</div>
                <div><span className="af-pc-price">$0</span><span className="af-pc-per"> / month</span></div>
                <ul className="af-pc-list">
                  {['2 question sets per day','2 worksheets per day','All subjects & grades','PDF download','Session history'].map(f => (
                    <li key={f} className="af-pc-item">
                      <CheckCircle style={{ width:'1rem', height:'1rem', color:'var(--g3)', flexShrink:0 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="af-btn-s" style={{ width:'100%', justifyContent:'center', display:'flex' }}>
                  Get started free
                </Link>
              </div>
              <div className="af-pc hot">
                <div className="af-pc-badge">MOST POPULAR</div>
                <div className="af-pc-name">Premium ⚡</div>
                <div>
                  <span className="af-pc-price">$5.99</span>
                  <span className="af-pc-per"> / month</span>
                </div>
                <p style={{ fontFamily:'Syne,sans-serif', fontSize:'0.8125rem', color:'#7a9470', margin:'0.25rem 0 0' }}>Billed monthly · Cancel anytime</p>
                <ul className="af-pc-list">
                  {['Unlimited question sets','Unlimited worksheets','Faster generation (~15s)','No ads','Priority support','All subjects & grades'].map(f => (
                    <li key={f} className="af-pc-item">
                      <CheckCircle style={{ width:'1rem', height:'1rem', color:'var(--g)', flexShrink:0 }} />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup?plan=premium" className="af-btn-p" style={{ width:'100%', justifyContent:'center', display:'flex' }}>
                  Upgrade to Premium <ArrowRight style={{ width:'1rem', height:'1rem' }} />
                </Link>
              </div>
            </div>
            <p style={{ fontFamily:'Syne,sans-serif', fontSize:'0.875rem', color:'#7a9470', marginTop:'1.5rem' }}>
              🔒 Secure payment via Stripe · Cancel any time
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="af-cta-section">
          <div className="af-cta-inner">
            <h2 className="af-cta-h">Ready to ace your next exam?</h2>
            <p className="af-cta-p">Join students using AceForge to turn any topic into an interactive study session — for free.</p>
            <Link href={profile ? '/generate' : '/signup'} className="af-cta-btn">
              Start studying free <ArrowRight style={{ width:'1rem', height:'1rem' }} />
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="af-footer">
          <div className="af-footer-inner">
            <div className="af-logo-wrap">
              <div className="af-logo-box">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1L11 4V8L6 11L1 8V4L6 1Z" fill="white" opacity="0.9"/>
                </svg>
              </div>
              <span className="af-logo-name">AceForge</span>
            </div>
            <p className="af-copy">© {new Date().getFullYear()} AceForge. Built for students.</p>
            <div className="af-flinks">
              <Link href="/pricing" className="af-flink">Pricing</Link>
              <Link href="/login" className="af-flink">Log in</Link>
              <Link href="/terms" className="af-flink">Terms</Link>
              <Link href="/privacy" className="af-flink">Privacy</Link>
            </div>
          </div>
        </footer>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          // Show cursor on desktop only
          if (window.innerWidth > 768) {
            var cursor = document.getElementById('af-cursor');
            var ring = document.getElementById('af-cursor-ring');
            if (cursor) cursor.style.display = 'block';
            if (ring) ring.style.display = 'block';
            var mx = window.innerWidth/2, my = window.innerHeight/2;
            var rx = mx, ry = my;
            document.addEventListener('mousemove', function(e) {
              mx = e.clientX; my = e.clientY;
              cursor.style.left = (mx-5)+'px'; cursor.style.top = (my-5)+'px';
            });
            function animRing() {
              rx += (mx - rx - 18) * 0.1;
              ry += (my - ry - 18) * 0.1;
              ring.style.left = rx+'px'; ring.style.top = ry+'px';
              requestAnimationFrame(animRing);
            }
            animRing();
            document.querySelectorAll('a,button').forEach(function(el) {
              el.addEventListener('mouseenter', function() { cursor.style.transform='scale(2.5)'; ring.style.opacity='0.2'; ring.style.transform='scale(1.5)'; });
              el.addEventListener('mouseleave', function() { cursor.style.transform='scale(1)'; ring.style.opacity='0.4'; ring.style.transform='scale(1)'; });
            });
          }

          // Particles
          var canvas = document.getElementById('af-particles');
          if (!canvas) return;
          var ctx = canvas.getContext('2d');
          var W = canvas.width = window.innerWidth;
          var H = canvas.height = window.innerHeight;
          window.addEventListener('resize', function() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
          var pts = [];
          for (var i = 0; i < 50; i++) {
            pts.push({ x: Math.random()*W, y: Math.random()*H, vx:(Math.random()-0.5)*0.35, vy:(Math.random()-0.5)*0.35, r:Math.random()*1.5+0.5, o:Math.random()*0.35+0.1 });
          }
          function draw() {
            ctx.clearRect(0,0,W,H);
            pts.forEach(function(p) {
              p.x+=p.vx; p.y+=p.vy;
              if(p.x<0)p.x=W; if(p.x>W)p.x=0;
              if(p.y<0)p.y=H; if(p.y>H)p.y=0;
              ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
              ctx.fillStyle='rgba(34,85,14,'+p.o+')'; ctx.fill();
            });
            for(var i=0;i<pts.length;i++) {
              for(var j=i+1;j<pts.length;j++) {
                var dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
                var d=Math.sqrt(dx*dx+dy*dy);
                if(d<130) {
                  ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
                  ctx.strokeStyle='rgba(34,85,14,'+(0.05*(1-d/130))+')'; ctx.lineWidth=0.5; ctx.stroke();
                }
              }
            }
            requestAnimationFrame(draw);
          }
          draw();
        })();
      `}} />
    </>
  )
}
