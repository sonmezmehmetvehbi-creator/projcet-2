'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, ChevronDown, GraduationCap, FileText, Headphones, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useTutorTheme } from './TutorThemeContext'

interface Props { profile: any; tutorProfile: any; avatarUrl?: string | null }

export default function TutorNavbar({ profile, tutorProfile, avatarUrl }: Props) {
  const photo = avatarUrl ?? tutorProfile?.avatar_url ?? null
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggle } = useTutorTheme()
  const isDark = theme === 'dark'

  const accent = isDark ? 'rgb(99,102,241)' : 'rgb(234,88,12)'
  const navBg = isDark ? 'rgba(20,20,40,0.97)' : 'rgba(255,255,255,0.97)'
  const navBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(234,88,12,0.12)'
  const logoGrad = isDark ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #ea580c, #f97316)'
  const textColor = isDark ? 'white' : 'rgb(26,26,20)'
  const textMuted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,20,0.5)'
  const textFaint = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(26,26,20,0.4)'
  const activeBg = isDark ? 'rgba(99,102,241,0.2)' : 'rgba(234,88,12,0.1)'
  const dropdownBg = isDark ? 'rgb(18,18,30)' : 'white'
  const dropdownBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(234,88,12,0.12)'
  const dropdownDivider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(234,88,12,0.1)'
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(234,88,12,0.05)'
  const btnBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(234,88,12,0.2)'
  const toggleBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(234,88,12,0.08)'
  const toggleBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(234,88,12,0.2)'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const NAV_LINKS = [
    { href: '/tutor/dashboard', label: '📊 Dashboard' },
    { href: '/tutor/meet-guide', label: '🎥 Meet Guide' },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: navBg,
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${navBorder}`,
      boxShadow: isDark ? '0 1px 16px rgba(0,0,0,0.3)' : '0 1px 12px rgba(234,88,12,0.08)',
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem', padding: '0 1.5rem', gap: '1rem' }}>

        {/* Logo */}
        <Link href="/tutor/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: logoGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap style={{ width: '1rem', height: '1rem', color: 'white' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.125rem', color: textColor }}>AceForge</span>
          <span style={{ fontSize: '0.625rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: logoGrad, color: 'white', fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            TUTOR
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flex: 1, justifyContent: 'center' }}>
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href}
                style={{ padding: '0.5rem 0.875rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: isActive ? 600 : 400, color: isActive ? textColor : textMuted, textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap', background: isActive ? activeBg : 'transparent' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(26,26,20,0.85)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = textMuted }}>
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Theme toggle + profile dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button onClick={toggle} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            style={{ padding: '0.5rem', borderRadius: '0.625rem', border: `1px solid ${toggleBorder}`, background: toggleBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(234,88,12,0.8)' }}>
            {isDark ? <Sun style={{ width: '1rem', height: '1rem' }} /> : <Moon style={{ width: '1rem', height: '1rem' }} />}
          </button>

          <div style={{ position: 'relative' }} ref={ref}>
            <button onClick={() => setOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.375rem 0.75rem', borderRadius: '0.75rem', border: `1px solid ${btnBorder}`, background: btnBg, cursor: 'pointer' }}>
              {photo ? (
                <img src={photo} alt={profile?.display_name ?? 'Tutor'}
                  style={{ width: '1.875rem', height: '1.875rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '1.875rem', height: '1.875rem', borderRadius: '50%', background: logoGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8125rem', fontWeight: 700 }}>
                  {profile?.display_name?.[0] ?? 'T'}
                </div>
              )}
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: textColor, lineHeight: 1.2 }}>{profile?.display_name ?? 'Tutor'}</p>
                <p style={{ fontSize: '0.625rem', color: textFaint, lineHeight: 1.2, fontFamily: 'Syne, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⭐ {tutorProfile?.rating > 0 ? tutorProfile.rating : 'New'} Tutor
                </p>
              </div>
              <ChevronDown style={{ width: '0.875rem', height: '0.875rem', color: textFaint, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {open && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)', width: '15rem', background: dropdownBg, borderRadius: '0.875rem', boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 8px 32px rgba(234,88,12,0.15)', border: `1px solid ${dropdownBorder}`, overflow: 'hidden', zIndex: 100 }}>
                <div style={{ padding: '0.875rem 1rem', borderBottom: `1px solid ${dropdownDivider}` }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: textColor, marginBottom: '0.125rem' }}>{profile?.display_name}</p>
                  <p style={{ fontSize: '0.75rem', color: textFaint }}>{profile?.email}</p>
                </div>
                <div style={{ padding: '0.5rem 0' }}>
                  <Link href="/tutoring/legal" onClick={() => setOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.875rem', color: textMuted, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(234,88,12,0.05)'; e.currentTarget.style.color = textColor }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textMuted }}>
                    <FileText style={{ width: '1rem', height: '1rem' }} />
                    Tutor Policies
                  </Link>
                  <Link href="/support" onClick={() => setOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.875rem', color: textMuted, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(234,88,12,0.05)'; e.currentTarget.style.color = textColor }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textMuted }}>
                    <Headphones style={{ width: '1rem', height: '1rem' }} />
                    Help & Support
                  </Link>
                </div>
                <div style={{ borderTop: `1px solid ${dropdownDivider}`, padding: '0.5rem 0' }}>
                  <button onClick={() => { setOpen(false); signOut() }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.625rem 1rem', fontSize: '0.875rem', color: 'rgba(255,100,100,0.8)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(234,88,12,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <LogOut style={{ width: '1rem', height: '1rem' }} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
