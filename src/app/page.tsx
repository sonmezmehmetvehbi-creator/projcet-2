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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap');

        :root {
          --g: #22550e;
          --g2: #4a7a28;
          --g3: #7ab648;
          --glow: rgba(34,85,14,0.35);
          --glow2: rgba(122,182,72,0.2);
        }

        .af-page { background: #f8faf5; min-height: 100vh; overflow-x: hidden; }

        /* Custom cursor */
        .af-cursor {
          position: fixed; width: 10px; height: 10px;
          background: var(--g); border-radius: 50%;
          pointer-events: none; z-index: 9999;
          transition: transform 0.1s ease;
          mix-blend-mode: multiply;
        }
        .af-cursor-ring {
          position: fixed; width: 36px; height: 36px;
          border: 1.5px solid var(--g); border-radius: 50%;
          pointer-events: none; z-index: 9998;
          transition: all 0.15s ease;
          opacity: 0.5;
        }

        /* Particle canvas */
        #af-particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.6; }

        /* Hero */
        .af-hero {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          position: relative; padding: 7rem 1.5rem 4rem;
          overflow: hidden;
        }

        .af-hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 60% 50% at 15% 50%, rgba(34,85,14,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 85% 20%, rgba(122,182,72,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 30% 40% at 60% 90%, rgba(34,85,14,0.04) 0%, transparent 70%),
            #f8faf5;
        }

        /* Grid lines */
        .af-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(34,85,14,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,85,14,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
        }

        /* Floating orbs */
        .af-orb {
          position: absolute; border-radius: 50%; filter: blur(60px);
          animation: orbFloat 8s ease-in-out infinite;
        }
        .af-orb-1 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(34,85,14,0.08), transparent); top: 5%; right: -5%; animation-delay: 0s; }
        .af-orb-2 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(122,182,72,0.1), transparent); bottom: 10%; left: -5%; animation-delay: -3s; }
        .af-orb-3 { width: 200px; height: 200px; background: radial-gradient(circle, rgba(34,85,14,0.06), transparent); top: 40%; left: 30%; animation-delay: -5s; }

        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        .af-hero-content { position: relative; z-index: 2; max-width: 68rem; margin: 0 auto; width: 100%; }

        .af-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(34,85,14,0.06); border: 1px solid rgba(34,85,14,0.15);
          padding: 0.375rem 1rem; border-radius: 9999px;
          font-family: 'Syne', sans-serif; font-size: 0.8125rem; font-weight: 600;
          color: var(--g); letter-spacing: 0.05em; text-transform: uppercase;
          margin-bottom: 2rem;
          animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both;
        }
        .af-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--g3);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.5); } }

        .af-hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(3rem, 8vw, 6rem);
          font-weight: 800;
          line-height: 1.0;
          color: #0d1a08;
          margin-bottom: 1.5rem;
          letter-spacing: -0.03em;
          animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }

        .af-hero-title .accent {
          position: relative; display: inline-block;
          background: linear-gradient(135deg, var(--g), var(--g3), #a8d878);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .af-hero-title .accent::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--g), var(--g3), transparent);
          border-radius: 2px;
          animation: lineGrow 1s cubic-bezier(0.16,1,0.3,1) 0.8s both;
          transform-origin: left;
        }
        @keyframes lineGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        .af-hero-sub {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: #4a6640; line-height: 1.7; max-width: 38rem;
          margin-bottom: 2.5rem;
          animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both;
        }

        .af-cta-row {
          display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 3rem;
          animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both;
        }

        .af-btn-primary {
          display: inline-flex; align-items: center; gap: 0.625rem;
          background: var(--g); color: white;
          font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 600;
          padding: 0.875rem 2rem; border-radius: 0.75rem;
          text-decoration: none; border: none; cursor: pointer;
          position: relative; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px var(--glow), 0 0 0 0 var(--glow);
        }
        .af-btn-primary::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.12));
          pointer-events: none;
        }
        .af-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px var(--glow), 0 0 0 4px var(--glow2);
        }
        .af-btn-primary .arrow {
          transition: transform 0.2s;
        }
        .af-btn-primary:hover .arrow { transform: translateX(4px); }

        .af-btn-secondary {
          display: inline-flex; align-items: center; gap: 0.625rem;
          background: transparent; color: var(--g);
          font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 600;
          padding: 0.875rem 2rem; border-radius: 0.75rem;
          text-decoration: none; border: 1.5px solid rgba(34,85,14,0.25);
          cursor: pointer; transition: all 0.2s;
        }
        .af-btn-secondary:hover {
          background: rgba(34,85,14,0.04);
          border-color: rgba(34,85,14,0.5);
          transform: translateY(-1px);
        }

        .af-trust {
          display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center;
          font-family: 'Syne', sans-serif; font-size: 0.875rem; color: #7a9470;
          animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s both;
        }
        .af-trust-item { display: flex; align-items: center; gap: 0.5rem; }
        .af-trust-check { color: var(--g3); width: 1rem; height: 1rem; }

        /* Hero split layout */
        .af-hero-split {
          display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
        }
        @media (max-width: 768px) {
          .af-hero-split { grid-template-columns: 1fr; gap: 3rem; }
        }

        /* Morphing demo card */
        .af-demo-wrap {
          position: relative;
          animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s both;
        }
        .af-demo-wrap::before {
          content: ''; position: absolute; inset: -1px;
          background: linear-gradient(135deg, var(--g), var(--g3), rgba(34,85,14,0.2));
          border-radius: 1.25rem; z-index: -1;
          opacity: 0.4;
          animation: borderGlow 3s ease-in-out infinite alternate;
        }
        @keyframes borderGlow {
          from { opacity: 0.2; filter: blur(0px); }
          to { opacity: 0.6; filter: blur(2px); }
        }

        .af-demo {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(34,85,14,0.12);
          border-radius: 1.25rem;
          padding: 1.75rem;
          box-shadow: 0 20px 60px rgba(34,85,14,0.1), 0 4px 20px rgba(0,0,0,0.05);
          position: relative; overflow: hidden;
        }
        .af-demo::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--g), var(--g3), rgba(34,85,14,0.1));
        }

        .af-demo-header {
          display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem;
        }
        .af-demo-dot { width: 8px; height: 8px; border-radius: 50%; }

        .af-demo-badge {
          display: inline-flex; align-items: center; gap: 0.375rem;
          background: rgba(34,85,14,0.08); border: 1px solid rgba(34,85,14,0.15);
          padding: 0.25rem 0.75rem; border-radius: 9999px;
          font-family: 'Syne', sans-serif; font-size: 0.75rem; font-weight: 600; color: var(--g);
        }

        .af-demo-question {
          font-family: 'Syne', sans-serif; font-size: 0.9375rem; font-weight: 600;
          color: #0d1a08; margin-bottom: 1rem; line-height: 1.5;
        }

        .af-demo-options { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
        .af-demo-opt {
          padding: 0.625rem 0.875rem; border-radius: 0.625rem;
          font-family: 'Syne', sans-serif; font-size: 0.8125rem; font-weight: 500;
          display: flex; align-items: center; gap: 0.5rem;
          transition: all 0.3s;
        }
        .af-demo-opt.correct {
          background: rgba(34,85,14,0.06); border: 1.5px solid var(--g); color: var(--g);
        }
        .af-demo-opt.wrong {
          background: #fff5f5; border: 1.5px solid rgba(220,38,38,0.3); color: #dc2626;
          opacity: 0.6;
        }
        .af-demo-opt.neutral {
          background: #f8f9fa; border: 1.5px solid #e5e7eb; color: #6b7280;
        }

        .af-demo-feedback {
          background: rgba(34,85,14,0.04); border: 1px solid rgba(34,85,14,0.12);
          border-radius: 0.75rem; padding: 0.875rem;
        }
        .af-demo-feedback-title {
          font-family: 'Syne', sans-serif; font-size: 0.8125rem; font-weight: 700;
          color: var(--g); margin-bottom: 0.25rem;
        }
        .af-demo-feedback-text {
          font-size: 0.8125rem; color: #4a6640; line-height: 1.6;
        }

        /* Floating stats */
        .af-stat-float {
          position: absolute;
          background: white;
          border: 1px solid rgba(34,85,14,0.12);
          border-radius: 0.875rem;
          padding: 0.75rem 1rem;
          box-shadow: 0 8px 24px rgba(34,85,14,0.1);
          font-family: 'Syne', sans-serif;
          animation: statFloat 4s ease-in-out infinite;
          backdrop-filter: blur(10px);
        }
        .af-stat-float-1 { top: -1rem; right: 0.5rem; animation-delay: 0s; }
.af-stat-float-2 { bottom: 1rem; left: 0; animation-delay: -2s; }
        @keyframes statFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .af-stat-num { font-size: 1.25rem; font-weight: 800; color: var(--g); }
        .af-stat-label { font-size: 0.6875rem; color: #7a9470; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Sections */
        .af-section { padding: 6rem 1.5rem; position: relative; }
        .af-section-label {
          font-family: 'Syne', sans-serif; font-size: 0.75rem; font-weight: 700;
          color: var(--g); text-transform: uppercase; letter-spacing: 0.12em;
          margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;
        }
        .af-section-label::before {
          content: ''; width: 2rem; height: 2px; background: var(--g3);
        }
        .af-section-title {
          font-family: 'Syne', sans-serif; font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800; color: #0d1a08; line-height: 1.1;
          letter-spacing: -0.02em; margin-bottom: 1rem;
        }
        .af-section-sub {
          font-size: 1.0625rem; color: #4a6640; max-width: 36rem; line-height: 1.7;
        }

        /* Steps */
        .af-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; margin-top: 3.5rem; }
        .af-step {
          position: relative; padding: 2rem;
          background: white; border: 1px solid rgba(34,85,14,0.08);
          border-radius: 1.25rem;
          transition: all 0.3s;
          overflow: hidden;
        }
        .af-step::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(34,85,14,0.02), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .af-step:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(34,85,14,0.1); border-color: rgba(34,85,14,0.2); }
        .af-step:hover::before { opacity: 1; }
        .af-step-num {
          font-family: 'Syne', sans-serif; font-size: 4rem; font-weight: 800;
          color: rgba(34,85,14,0.06); position: absolute; top: 0.5rem; right: 1rem;
          line-height: 1; pointer-events: none;
        }
        .af-step-icon {
          width: 3rem; height: 3rem; border-radius: 0.875rem;
          background: rgba(34,85,14,0.06); display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.25rem; position: relative;
        }
        .af-step-title {
          font-family: 'Syne', sans-serif; font-size: 1.125rem; font-weight: 700;
          color: #0d1a08; margin-bottom: 0.625rem;
        }
        .af-step-desc { font-size: 0.9375rem; color: #4a6640; line-height: 1.7; }

        /* Features */
        .af-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-top: 3.5rem; }
        .af-feature {
          padding: 1.75rem; background: white;
          border: 1px solid rgba(34,85,14,0.08); border-radius: 1.25rem;
          transition: all 0.3s; position: relative; overflow: hidden;
        }
        .af-feature::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--g), var(--g3));
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s;
        }
        .af-feature:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(34,85,14,0.08); border-color: rgba(34,85,14,0.15); }
        .af-feature:hover::after { transform: scaleX(1); }
        .af-feature-icon {
          width: 2.75rem; height: 2.75rem; border-radius: 0.75rem;
          display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;
          font-size: 1.375rem;
        }
        .af-feature-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: #0d1a08; margin-bottom: 0.5rem; }
        .af-feature-desc { font-size: 0.875rem; color: #4a6640; line-height: 1.6; }

        /* Subjects marquee */
        .af-marquee-wrap { overflow: hidden; margin-top: 3rem; }
        .af-marquee { display: flex; gap: 0.75rem; animation: marquee 25s linear infinite; width: max-content; }
        .af-marquee:hover { animation-play-state: paused; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .af-subject-tag {
          display: inline-flex; align-items: center; gap: 0.375rem;
          padding: 0.5rem 1rem; border-radius: 9999px; white-space: nowrap;
          font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 600;
          border: 1.5px solid; transition: all 0.2s; cursor: default;
        }
        .af-subject-tag:hover { transform: scale(1.05); }

        /* Pricing */
        .af-pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; max-width: 48rem; margin: 3.5rem auto 0; }
        .af-price-card {
          background: white; border: 1px solid rgba(34,85,14,0.1);
          border-radius: 1.5rem; padding: 2.25rem; position: relative;
          transition: all 0.3s;
        }
        .af-price-card:hover { transform: translateY(-4px); box-shadow: 0 20px 48px rgba(34,85,14,0.1); }
        .af-price-card.featured {
          border: 2px solid var(--g);
          box-shadow: 0 8px 40px var(--glow);
        }
        .af-price-card.featured::before {
          content: ''; position: absolute; inset: -2px; border-radius: 1.5rem;
          background: linear-gradient(135deg, var(--g), var(--g3));
          z-index: -1; opacity: 0.15;
        }
        .af-price-badge {
          position: absolute; top: -0.875rem; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, var(--g), var(--g2));
          color: white; font-family: 'Syne', sans-serif;
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.08em;
          padding: 0.375rem 1.25rem; border-radius: 9999px; white-space: nowrap;
        }
        .af-price-name { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 700; color: #0d1a08; margin-bottom: 0.5rem; }
        .af-price-amount { font-family: 'Syne', sans-serif; font-size: 2.75rem; font-weight: 800; color: #0d1a08; line-height: 1; }
        .af-price-period { font-size: 0.9375rem; font-weight: 400; color: #7a9470; }
        .af-price-list { list-style: none; padding: 0; margin: 1.5rem 0; display: flex; flex-direction: column; gap: 0.625rem; }
        .af-price-item { display: flex; align-items: center; gap: 0.625rem; font-size: 0.9375rem; color: #4a6640; font-family: 'Syne', sans-serif; }

        /* CTA section */
        .af-cta {
          background: linear-gradient(135deg, #0d2208, var(--g), #1a4010);
          position: relative; overflow: hidden;
        }
        .af-cta::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .af-cta-title { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; color: white; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 1rem; }
        .af-cta-sub { font-size: 1.125rem; color: rgba(255,255,255,0.7); margin-bottom: 2.5rem; max-width: 32rem; line-height: 1.7; }
        .af-cta-btn {
          display: inline-flex; align-items: center; gap: 0.625rem;
          background: white; color: var(--g);
          font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700;
          padding: 0.875rem 2rem; border-radius: 0.75rem;
          text-decoration: none; transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .af-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }

        /* Footer */
        .af-footer { background: #080f05; padding: 2.5rem 1.5rem; }
        .af-footer-inner { max-width: 72rem; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
        .af-footer-logo { display: flex; align-items: center; gap: 0.625rem; }
        .af-footer-logo-mark { width: 1.75rem; height: 1.75rem; background: linear-gradient(135deg, var(--g), var(--g3)); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; }
        .af-footer-name { font-family: 'Syne', sans-serif; font-weight: 700; color: white; font-size: 1rem; }
        .af-footer-copy { font-size: 0.8125rem; color: rgba(255,255,255,0.3); font-family: 'Syne', sans-serif; }
        .af-footer-links { display: flex; gap: 1.5rem; }
        .af-footer-link { font-family: 'Syne', sans-serif; font-size: 0.8125rem; color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.2s; }
        .af-footer-link:hover { color: rgba(255,255,255,0.8); }

        /* Scroll reveal */
        .af-reveal { opacity: 0; transform: translateY(32px); transition: all 0.7s cubic-bezier(0.16,1,0.3,1); }
        .af-reveal.visible { opacity: 1; transform: translateY(0); }
        .af-reveal-delay-1 { transition-delay: 0.1s; }
        .af-reveal-delay-2 { transition-delay: 0.2s; }
        .af-reveal-delay-3 { transition-delay: 0.3s; }
      `}</style>

      <canvas id="af-particles" />
      <div className="af-cursor" id="af-cursor" />
      <div className="af-cursor-ring" id="af-cursor-ring" />

      <div className="af-page">
        <Navbar profile={profile} />

        {/* HERO */}
        <section className="af-hero">
          <div className="af-hero-bg" />
          <div className="af-grid" />
          <div className="af-orb af-orb-1" />
          <div className="af-orb af-orb-2" />
          <div className="af-orb af-orb-3" />

          <div className="af-hero-content">
            <div className="af-hero-split">
              <div>
                <div className="af-eyebrow">
                  <div className="af-eyebrow-dot" />
                  AI-Powered Study Platform
                </div>
                <h1 className="af-hero-title">
                  Study smarter.<br />
                  <span className="accent">Ace everything.</span>
                </h1>
                <p className="af-hero-sub">
                  Generate personalized questions, visual worksheets, and instant AI feedback for any subject — upload your notes and study from them directly.
                </p>
                <div className="af-cta-row">
                  <Link href={profile ? '/generate' : '/signup'} className="af-btn-primary">
                    Start for free <ArrowRight className="arrow" style={{ width:'1rem', height:'1rem' }} />
                  </Link>
                  <a href="#how-it-works" className="af-btn-secondary">See how it works</a>
                </div>
                <div className="af-trust">
                  {['Free to start', 'All subjects & grades', 'Upload your notes'].map(t => (
                    <div key={t} className="af-trust-item">
                      <CheckCircle className="af-trust-check" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Animated demo card */}
              <div className="af-demo-wrap">
                <div className="af-stat-float af-stat-float-1">
                  <div className="af-stat-num">98%</div>
                  <div className="af-stat-label">Accuracy rate</div>
                </div>
                <div className="af-stat-float af-stat-float-2">
                  <div className="af-stat-num">2.4s</div>
                  <div className="af-stat-label">Avg generation</div>
                </div>

                <div className="af-demo">
                  <div className="af-demo-header">
                    <div className="af-demo-dot" style={{ background:'#ff5f57' }} />
                    <div className="af-demo-dot" style={{ background:'#ffbd2e' }} />
                    <div className="af-demo-dot" style={{ background:'#28c840' }} />
                    <div style={{ flex:1 }} />
                    <div className="af-demo-badge">Biology · Grade 10 · Medium</div>
                  </div>
                  <div className="af-demo-question" id="demo-question">
                    Where do the light-dependent reactions of photosynthesis take place?
                  </div>
                  <div className="af-demo-options">
                    <div className="af-demo-opt neutral">A. Stroma of the chloroplast</div>
                    <div className="af-demo-opt correct">
                      <CheckCircle style={{ width:'0.875rem', height:'0.875rem', flexShrink:0 }} />
                      B. Thylakoid membrane
                    </div>
                    <div className="af-demo-opt neutral">C. Cytoplasm</div>
                    <div className="af-demo-opt neutral">D. Nucleus</div>
                  </div>
                  <div className="af-demo-feedback">
                    <div className="af-demo-feedback-title">🎉 Excellent!</div>
                    <div className="af-demo-feedback-text">
                      The thylakoid membrane contains chlorophyll, which captures light energy to produce ATP and NADPH used in the Calvin cycle.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="af-section" style={{ background:'white' }}>
          <div style={{ maxWidth:'72rem', margin:'0 auto' }}>
            <div className="af-reveal">
              <div className="af-section-label">How it works</div>
              <h2 className="af-section-title">From topic to test-ready<br />in under a minute</h2>
              <p className="af-section-sub">No more staring at a blank page. Just tell AceForge what you're studying.</p>
            </div>
            <div className="af-steps">
              {[
                { num:'01', emoji:'✏️', title:'Enter your topic', desc:'Type any subject, grade, and topic — or upload your lecture notes, PDFs, or slides directly.' },
                { num:'02', emoji:'⚡', title:'AI generates instantly', desc:'GPT-4o creates tailored questions or a full visual worksheet matched to your exact level and difficulty.' },
                { num:'03', emoji:'🧠', title:'Study with feedback', desc:'Answer questions, get instant AI explanations, track your weak spots, and practice them again.' },
              ].map((s, i) => (
                <div key={s.num} className={`af-step af-reveal af-reveal-delay-${i+1}`}>
                  <div className="af-step-num">{s.num}</div>
                  <div className="af-step-icon" style={{ fontSize:'1.5rem' }}>{s.emoji}</div>
                  <div className="af-step-title">{s.title}</div>
                  <div className="af-step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="af-section" style={{ background:'#f8faf5' }}>
          <div style={{ maxWidth:'72rem', margin:'0 auto' }}>
            <div className="af-reveal" style={{ textAlign:'center' }}>
              <div className="af-section-label" style={{ justifyContent:'center' }}>Features</div>
              <h2 className="af-section-title">Everything you need to ace it</h2>
              <p className="af-section-sub" style={{ margin:'0 auto' }}>Built for students who want results, not busywork.</p>
            </div>
            <div className="af-features">
              {[
                { emoji:'🧠', title:'Smart Questions', desc:'MC and free response generated for your exact topic, grade, and difficulty level.', bg:'rgba(34,85,14,0.06)' },
                { emoji:'📄', title:'Visual Worksheets', desc:'Step-by-step study sheets with vocab, diagrams, summaries, and practice problems.', bg:'rgba(232,160,32,0.08)' },
                { emoji:'📤', title:'Upload Your Notes', desc:'Drop in your lecture PDFs, slides, or photos and generate questions from your actual content.', bg:'rgba(59,130,246,0.06)' },
                { emoji:'📊', title:'Performance Analytics', desc:'See exactly which topics you\'re strong in and which need work with visual charts.', bg:'rgba(139,92,246,0.06)' },
                { emoji:'⚡', title:'Instant AI Feedback', desc:'Every wrong answer gets a clear, step-by-step explanation that actually makes sense.', bg:'rgba(34,85,14,0.06)' },
                { emoji:'🎯', title:'Smart Retry', desc:'Got questions wrong? AceForge generates targeted practice for your weak spots automatically.', bg:'rgba(245,158,11,0.07)' },
                { emoji:'📥', title:'PDF Export', desc:'Download any question set or worksheet as a clean, printable PDF.', bg:'rgba(20,184,166,0.06)' },
                { emoji:'🌱', title:'4 Difficulty Levels', desc:'Easy, Medium, Hard, and Expert — from basic review to AP exam difficulty.', bg:'rgba(34,85,14,0.06)' },
              ].map((f, i) => (
                <div key={f.title} className={`af-feature af-reveal af-reveal-delay-${(i % 3) + 1}`}>
                  <div className="af-feature-icon" style={{ background:f.bg }}>{f.emoji}</div>
                  <div className="af-feature-title">{f.title}</div>
                  <div className="af-feature-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SUBJECTS MARQUEE */}
        <section className="af-section" style={{ background:'white', paddingTop:'4rem', paddingBottom:'4rem' }}>
          <div style={{ maxWidth:'72rem', margin:'0 auto', textAlign:'center', marginBottom:'2rem' }} className="af-reveal">
            <h2 className="af-section-title">Works for every subject</h2>
            <p className="af-section-sub" style={{ margin:'0 auto' }}>K-5 through college — any subject, any topic, any grade.</p>
          </div>
          <div className="af-marquee-wrap">
            <div className="af-marquee">
              {[
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
              ].concat([
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
              ]).map((s, i) => (
                <span key={i} className="af-subject-tag" style={{ color:s.color, borderColor:s.border, background:`${s.border.replace('0.3','0.06')}` }}>
                  {s.emoji} {s.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="af-section" style={{ background:'#f8faf5' }}>
          <div style={{ maxWidth:'72rem', margin:'0 auto', textAlign:'center' }}>
            <div className="af-reveal">
              <div className="af-section-label" style={{ justifyContent:'center' }}>Pricing</div>
              <h2 className="af-section-title">Simple, honest pricing</h2>
              <p className="af-section-sub" style={{ margin:'0 auto' }}>Start free, upgrade when you need more. No hidden fees.</p>
            </div>
            <div className="af-pricing-grid">
              <div className="af-price-card af-reveal">
                <div className="af-price-name">Free</div>
                <div style={{ margin:'1rem 0 0.25rem' }}>
                  <span className="af-price-amount">$0</span>
                  <span className="af-price-period"> / month</span>
                </div>
                <ul className="af-price-list">
                  {['2 question sets per day','2 worksheets per day','All subjects & grades','PDF download','Session history'].map(f => (
                    <li key={f} className="af-price-item">
                      <CheckCircle style={{ width:'1rem', height:'1rem', color:'var(--g3)', flexShrink:0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="af-btn-secondary" style={{ width:'100%', justifyContent:'center', display:'flex' }}>
                  Get started free
                </Link>
              </div>
              <div className="af-price-card featured af-reveal af-reveal-delay-1">
                <div className="af-price-badge">MOST POPULAR</div>
                <div className="af-price-name">Premium ⚡</div>
                <div style={{ margin:'1rem 0 0.25rem' }}>
                  <span className="af-price-amount">$5.99</span>
                  <span className="af-price-period"> / month</span>
                </div>
                <p style={{ fontFamily:'Syne, sans-serif', fontSize:'0.8125rem', color:'#7a9470', marginBottom:'0.5rem' }}>Billed monthly · Cancel anytime</p>
                <ul className="af-price-list">
                  {['Unlimited question sets','Unlimited worksheets','All subjects & grades','Faster generation (~15s)','No ads','Priority support'].map(f => (
                    <li key={f} className="af-price-item">
                      <CheckCircle style={{ width:'1rem', height:'1rem', color:'var(--g)', flexShrink:0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup?plan=premium" className="af-btn-primary" style={{ width:'100%', justifyContent:'center', display:'flex' }}>
                  Upgrade to Premium <ArrowRight className="arrow" style={{ width:'1rem', height:'1rem' }} />
                </Link>
              </div>
            </div>
            <p style={{ fontFamily:'Syne, sans-serif', fontSize:'0.875rem', color:'#7a9470', marginTop:'1.5rem' }}>
              🔒 Secure payment via Stripe · Cancel any time
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="af-section af-cta">
          <div style={{ maxWidth:'72rem', margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
            <h2 className="af-cta-title">Ready to ace your next exam?</h2>
            <p className="af-cta-sub" style={{ margin:'0 auto 2.5rem' }}>
              Join students using AceForge to turn any topic into an interactive study session — for free.
            </p>
            <Link href={profile ? '/generate' : '/signup'} className="af-cta-btn">
              Start studying free <ArrowRight style={{ width:'1rem', height:'1rem' }} />
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="af-footer">
          <div className="af-footer-inner">
            <div className="af-footer-logo">
              <div className="af-footer-logo-mark">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1L11 4V8L6 11L1 8V4L6 1Z" fill="white" opacity="0.9"/>
                </svg>
              </div>
              <span className="af-footer-name">AceForge</span>
            </div>
            <p className="af-footer-copy">© {new Date().getFullYear()} AceForge. Built for students.</p>
            <div className="af-footer-links">
              <Link href="/pricing" className="af-footer-link">Pricing</Link>
              <Link href="/login" className="af-footer-link">Log in</Link>
              <Link href="/terms" className="af-footer-link">Terms</Link>
              <Link href="/privacy" className="af-footer-link">Privacy</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Scripts for particles, cursor, scroll reveal */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Custom cursor
        const cursor = document.getElementById('af-cursor');
        const ring = document.getElementById('af-cursor-ring');
        let mx = 0, my = 0, rx = 0, ry = 0;
        document.addEventListener('mousemove', e => {
          mx = e.clientX; my = e.clientY;
          cursor.style.left = mx - 5 + 'px';
          cursor.style.top = my - 5 + 'px';
        });
        function animRing() {
          rx += (mx - rx - 18) * 0.12;
          ry += (my - ry - 18) * 0.12;
          ring.style.left = rx + 'px';
          ring.style.top = ry + 'px';
          requestAnimationFrame(animRing);
        }
        animRing();
        document.querySelectorAll('a,button').forEach(el => {
          el.addEventListener('mouseenter', () => { cursor.style.transform = 'scale(2.5)'; ring.style.transform = 'scale(1.5)'; ring.style.opacity = '0.3'; });
          el.addEventListener('mouseleave', () => { cursor.style.transform = 'scale(1)'; ring.style.transform = 'scale(1)'; ring.style.opacity = '0.5'; });
        });

        // Particle system
        const canvas = document.getElementById('af-particles');
        const ctx = canvas.getContext('2d');
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
        const particles = Array.from({length: 60}, () => ({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
        }));
        function drawParticles() {
          ctx.clearRect(0, 0, W, H);
          particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(34,85,14,' + p.opacity + ')';
            ctx.fill();
          });
          // Draw connections
          for (let i = 0; i < particles.length; i++) {
            for (let j = i+1; j < particles.length; j++) {
              const dx = particles[i].x - particles[j].x;
              const dy = particles[i].y - particles[j].y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < 120) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = 'rgba(34,85,14,' + (0.06 * (1 - dist/120)) + ')';
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
          requestAnimationFrame(drawParticles);
        }
        drawParticles();

        // Scroll reveal
        // Scroll reveal
const reveals = document.querySelectorAll('.af-reveal');
// Make all visible immediately as fallback
reveals.forEach(el => el.classList.add('visible'));
// Also use intersection observer for animated reveal
if ('IntersectionObserver' in window) {
  reveals.forEach(el => { el.classList.remove('visible'); });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.05, rootMargin: '0px 0px -50px 0px' });
  reveals.forEach(el => observer.observe(el));
}
      `}} />
    </>
  )
}