'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_consent')
    if (!accepted) {
      // Small delay so it doesn't flash immediately on load
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  function accept() {
    localStorage.setItem('cookie_consent', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Subtle backdrop */}
      <div
        onClick={accept}
        style={{
          position:'fixed', inset:0,
          background:'rgba(0,0,0,0.18)',
          backdropFilter:'blur(2px)',
          zIndex:998,
          animation:'cookieFadeIn 0.4s ease forwards',
        }}
      />

      {/* Banner */}
      <div style={{
        position:'fixed',
        bottom:'1.5rem',
        left:'50%',
        transform:'translateX(-50%)',
        zIndex:999,
        width:'calc(100% - 3rem)',
        maxWidth:'38rem',
        background:'white',
        borderRadius:'1.25rem',
        boxShadow:'0 12px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        border:'1px solid rgba(34,85,14,0.1)',
        padding:'1.5rem',
        animation:'cookieSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
      }}>
        <div style={{ display:'flex', gap:'1rem', alignItems:'flex-start', marginBottom:'1.25rem' }}>
          <span style={{ fontSize:'1.75rem', flexShrink:0 }}>🍪</span>
          <div>
            <p style={{ fontWeight:700, color:'rgb(26,26,20)', marginBottom:'0.375rem', fontSize:'1rem' }}>
              We use cookies
            </p>
            <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', lineHeight:1.6 }}>
              We use essential cookies to keep you signed in. Free-tier users also see ads via Google AdSense, which may use cookies to personalize ads.{' '}
              <Link href="/privacy" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>
                Privacy Policy
              </Link>
              {' '}·{' '}
              <Link href="/terms" style={{ color:'rgb(34,85,14)', fontWeight:600, textDecoration:'none' }}>
                Terms
              </Link>
            </p>
          </div>
        </div>

        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
          <Link href="/pricing" style={{
            display:'inline-flex', alignItems:'center', gap:'0.375rem',
            padding:'0.5rem 1rem', borderRadius:'0.625rem',
            fontSize:'0.8125rem', fontWeight:500, color:'rgb(107,107,88)',
            textDecoration:'none', border:'1px solid rgba(34,85,14,0.15)',
            background:'transparent',
          }}>
            ⚡ Go ad-free
          </Link>
          <button
            onClick={accept}
            className="btn-primary"
            style={{ padding:'0.5rem 1.5rem', fontSize:'0.9375rem' }}
          >
            Got it
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cookieFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cookieSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(24px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  )
}