'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Settings, LogOut, FileText, Crown, ChevronDown, Zap, BookOpen, Menu, X, Headphones, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useStudentTheme } from '@/app/contexts/StudentThemeContext'
import type { Profile } from '@/types'

const LEVELS = [
  { level: 1, name: 'Freshman', emoji: '📚', xpRequired: 0 },
  { level: 2, name: 'Apprentice', emoji: '✏️', xpRequired: 150 },
  { level: 3, name: 'Scholar', emoji: '🎓', xpRequired: 400 },
  { level: 4, name: 'Analyst', emoji: '🔍', xpRequired: 800 },
  { level: 5, name: 'Achiever', emoji: '⭐', xpRequired: 1500 },
  { level: 6, name: 'Expert', emoji: '🧠', xpRequired: 2500 },
  { level: 7, name: 'Master', emoji: '🏆', xpRequired: 4000 },
  { level: 8, name: 'Prodigy', emoji: '⚡', xpRequired: 6000 },
  { level: 9, name: 'Sage', emoji: '🌟', xpRequired: 9000 },
  { level: 10, name: 'Legend', emoji: '👑', xpRequired: 13000 },
]

function getLevelInfo(xp: number) {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) current = l
    else break
  }
  const next = LEVELS.find(l => l.level === current.level + 1) ?? null
  const xpIntoLevel = xp - current.xpRequired
  const xpNeeded = next ? next.xpRequired - current.xpRequired : 1
  const pct = next ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 100
  return { current, next, pct, xpIntoLevel, xpNeeded }
}

interface NavbarProps { profile?: Profile | null }

export default function Navbar({ profile }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggle } = useStudentTheme()
  const isDark = theme === 'dark'

  // Theme tokens — green accents stay identical in both modes.
  const navSolidBg = isDark ? 'rgba(15,15,25,0.95)' : 'rgba(255,255,255,0.95)'
  const navBorderColor = isDark ? 'rgba(255,255,255,0.08)' : 'var(--af-border)'
  const tText = isDark ? 'rgb(255,255,255)' : 'var(--af-text)'
  const tMuted = isDark ? 'rgba(255,255,255,0.6)' : 'var(--af-text-muted)'
  const tHover = isDark ? 'rgba(255,255,255,0.08)' : 'rgb(249,250,251)'
  const dropBg = isDark ? 'rgb(20,20,32)' : 'white'
  const dropDivider = isDark ? 'rgba(255,255,255,0.08)' : 'rgb(243,244,246)'
  const dropBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(34,85,14,0.1)'
  const overlayBg = isDark ? 'rgba(15,15,25,0.98)' : 'rgba(255,255,255,0.98)'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setMobileOpen(false) } }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function initials(name?: string | null, email?: string | null) {
    if (name) return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    if (email) return email[0].toUpperCase()
    return '?'
  }

  function avatarBg(id: string) {
    const colors = ['#22550e','#1d4ed8','#7c3aed','#c2410c','#0f766e']
    return colors[id.charCodeAt(0) % colors.length]
  }

  const isHome = pathname === '/'
  const isTransparent = isHome && !scrolled

  const xp = (profile as any)?.xp ?? 0
  const streak = (profile as any)?.streak_count ?? 0
  const levelInfo = getLevelInfo(xp)

  const NAV_LINKS = [
    { href:'/dashboard', label:'Dashboard' },
    { href:'/generate', label:'Generate' },
    { href:'/sat', label:'SAT Prep' },
    { href:'/tutoring/dashboard', label:'Tutoring 🎓' },
  ]

  return (
    <>
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:50,
        background: isTransparent ? 'transparent' : navSolidBg,
        backdropFilter: isTransparent ? 'none' : 'blur(12px)',
        borderBottom: isTransparent ? 'none' : `1px solid ${navBorderColor}`,
        boxShadow: isTransparent ? 'none' : '0 1px 12px rgba(34,85,14,0.06)',
        transition: 'all 0.3s ease',
      }}>
        <div className="container-base" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:'4rem', padding:'0 1.5rem', gap:'1rem' }}>

          {/* Logo */}
          <Link href={profile ? '/dashboard' : '/'} style={{ display:'flex', alignItems:'center', gap:'0.5rem', textDecoration:'none', flexShrink:0 }}>
            <div style={{ width:'2rem', height:'2rem', borderRadius:'0.5rem', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <BookOpen style={{ width:'1rem', height:'1rem', color:'white' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily:'Fraunces, Georgia, serif', fontWeight:700, fontSize:'1.125rem', color:'rgb(34,85,14)' }}>AceForge</span>
          </Link>

          {/* Desktop nav links */}
          {profile && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.125rem', flex:1, justifyContent:'center' }} className="af-nav-links">
              {NAV_LINKS.map(link => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                return (
                  <Link key={link.href} href={link.href}
                    style={{
                      padding:'0.5rem 0.875rem', borderRadius:'0.625rem',
                      fontSize:'0.9375rem', fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'rgb(34,85,14)' : isTransparent ? 'rgb(34,85,14)' : tMuted,
                      textDecoration:'none', transition:'all 0.2s', whiteSpace:'nowrap',
                      background: isActive ? 'var(--af-border)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(34,85,14,0.06)'; e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.9)' : 'rgb(34,85,14)' }}}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isTransparent ? 'rgb(34,85,14)' : tMuted }}}>
                    {link.label}
                  </Link>
                )
              })}
            </div>
          )}

          {profile ? (
            <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', flexShrink:0 }}>

              {/* Streak badge — hidden on small screens */}
              {streak > 0 && (
                <div className="af-streak-badge" style={{
                  display:'flex', alignItems:'center', gap:'0.3rem',
                  padding:'0.25rem 0.625rem', borderRadius:'9999px',
                  background: streak >= 7 ? 'rgba(232,160,32,0.12)' : 'rgba(34,85,14,0.06)',
                  border: `1px solid ${streak >= 7 ? 'rgba(232,160,32,0.3)' : 'rgba(34,85,14,0.15)'}`,
                }}>
                  <span style={{ fontSize:'0.875rem' }}>🔥</span>
                  <span style={{ fontSize:'0.8125rem', fontWeight:700, color: streak >= 7 ? 'rgb(180,120,10)' : 'rgb(34,85,14)', fontFamily:'Syne, sans-serif' }}>
                    {streak}
                  </span>
                </div>
              )}

              {/* XP + Level — hidden on small screens */}
              <div className="af-xp-badge" style={{
                display:'flex', alignItems:'center', gap:'0.5rem',
                padding:'0.25rem 0.75rem 0.25rem 0.5rem',
                borderRadius:'9999px',
                background:'rgba(34,85,14,0.06)',
                border:'1px solid rgba(34,85,14,0.15)',
                minWidth:'110px',
              }}>
                <span style={{ fontSize:'0.9375rem' }}>{levelInfo.current.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2px' }}>
                    <span style={{ fontSize:'0.6875rem', fontWeight:700, color:'rgb(34,85,14)', fontFamily:'Syne, sans-serif' }}>
                      Lv.{levelInfo.current.level}
                    </span>
                    <span style={{ fontSize:'0.6rem', color:tMuted, fontFamily:'Syne, sans-serif' }}>
                      {xp} XP
                    </span>
                  </div>
                  <div style={{ width:'100%', height:'4px', background:'rgba(34,85,14,0.12)', borderRadius:'9999px', overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:'9999px',
                      background:'linear-gradient(90deg, rgb(34,85,14), rgb(122,182,72))',
                      width:`${levelInfo.pct}%`,
                      transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>
                </div>
              </div>

              {/* Dark mode toggle */}
              <button onClick={toggle} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                style={{ padding:'0.5rem', borderRadius:'0.625rem', border:'1px solid rgba(34,85,14,0.2)', background:'rgba(34,85,14,0.05)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgb(34,85,14)', flexShrink:0 }}>
                {isDark ? <Sun style={{ width:'1.05rem', height:'1.05rem' }} /> : <Moon style={{ width:'1.05rem', height:'1.05rem' }} />}
              </button>

              {/* Mobile menu button */}
              <button onClick={() => setMobileOpen(o => !o)}
                className="af-mobile-menu-btn"
                style={{ display:'none', padding:'0.5rem', background:'transparent', border:'none', cursor:'pointer', color:'rgb(34,85,14)', borderRadius:'0.5rem' }}>
                {mobileOpen ? <X style={{ width:'1.25rem', height:'1.25rem' }} /> : <Menu style={{ width:'1.25rem', height:'1.25rem' }} />}
              </button>

              {/* Avatar dropdown */}
              <div style={{ position:'relative' }} ref={ref}>
                <button onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.25rem', borderRadius:'9999px', border:'none', background:'transparent', cursor:'pointer' }}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" style={{ width:'2.25rem', height:'2.25rem', borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(34,85,14,0.2)' }} />
                  ) : (
                    <div style={{ width:'2.25rem', height:'2.25rem', borderRadius:'50%', background:avatarBg(profile.id), display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.875rem', fontWeight:600, border:'2px solid rgba(34,85,14,0.2)' }}>
                      {initials(profile.display_name, profile.email)}
                    </div>
                  )}
                  {profile.is_premium && (
                    <div style={{ position:'absolute', top:0, right:'1.25rem', width:'0.875rem', height:'0.875rem', background:'rgb(251,191,36)', borderRadius:'50%', border:'2px solid white', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Zap style={{ width:'0.5rem', height:'0.5rem', color:'white' }} strokeWidth={3} />
                    </div>
                  )}
                  <ChevronDown className="af-nav-links" style={{ width:'0.875rem', height:'0.875rem', color:tMuted, transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
                </button>

                {open && (
                  <div style={{ position:'absolute', right:0, top:'calc(100% + 0.5rem)', width:'17rem', background:dropBg, borderRadius:'1rem', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', border:`1px solid ${dropBorder}`, overflow:'hidden', zIndex:100 }}>

                    <div style={{ padding:'0.75rem 1rem', borderBottom:`1px solid `, display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" style={{ width:'2.5rem', height:'2.5rem', borderRadius:'50%', objectFit:'cover' }} />
                      ) : (
                        <div style={{ width:'2.5rem', height:'2.5rem', borderRadius:'50%', background:avatarBg(profile.id), display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:600 }}>
                          {initials(profile.display_name, profile.email)}
                        </div>
                      )}
                      <div style={{ minWidth:0, flex:1 }}>
                        <p style={{ fontSize:'0.875rem', fontWeight:600, color:tText, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile.display_name ?? 'Student'}</p>
                        <p style={{ fontSize:'0.75rem', color:tMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile.email}</p>
                      </div>
                    </div>

                    <div style={{ padding:'0.75rem 1rem', borderBottom:`1px solid `, background:'rgba(34,85,14,0.02)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                          <span style={{ fontSize:'1rem' }}>{levelInfo.current.emoji}</span>
                          <span style={{ fontSize:'0.8125rem', fontWeight:700, color:tText, fontFamily:'Syne, sans-serif' }}>
                            Level {levelInfo.current.level} — {levelInfo.current.name}
                          </span>
                        </div>
                        {streak > 0 && (
                          <div style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
                            <span style={{ fontSize:'0.875rem' }}>🔥</span>
                            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'rgb(180,120,10)', fontFamily:'Syne, sans-serif' }}>{streak} day streak</span>
                          </div>
                        )}
                      </div>
                      <div style={{ width:'100%', height:'6px', background:'rgba(34,85,14,0.1)', borderRadius:'9999px', overflow:'hidden', marginBottom:'0.375rem' }}>
                        <div style={{
                          height:'100%', borderRadius:'9999px',
                          background:'linear-gradient(90deg, rgb(34,85,14), rgb(122,182,72))',
                          width:`${levelInfo.pct}%`,
                          transition:'width 0.8s ease',
                          boxShadow:'0 0 6px rgba(34,85,14,0.3)',
                        }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:'0.6875rem', color:tMuted, fontFamily:'Syne, sans-serif' }}>{xp} XP total</span>
                        {levelInfo.next && (
                          <span style={{ fontSize:'0.6875rem', color:tMuted, fontFamily:'Syne, sans-serif' }}>
                            {levelInfo.next.xpRequired - xp} XP to {levelInfo.next.name} {levelInfo.next.emoji}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ padding:'0.5rem 0' }}>
                      {[
                      { href:'/settings', icon:<Settings style={{width:'1rem',height:'1rem'}} />, label:'Settings' },
                      { href:'/dashboard?tab=pdfs', icon:<FileText style={{width:'1rem',height:'1rem'}} />, label:'My PDFs' },
                      { href:'/support', icon:<Headphones style={{width:'1rem',height:'1rem'}} />, label:'Support' },
                      { href:'/terms', icon:<FileText style={{width:'1rem',height:'1rem'}} />, label:'Terms of Service' },
                      { href:'/privacy', icon:<FileText style={{width:'1rem',height:'1rem'}} />, label:'Privacy Policy' },
                    ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                          style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 1rem', fontSize:'0.875rem', color:tText, textDecoration:'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background=tHover)}
                          onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                          <span style={{ color:tMuted }}>{item.icon}</span>{item.label}
                        </Link>
                      ))}

                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.625rem 1rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', fontSize:'0.875rem', color:tText }}>
                          <Crown style={{ width:'1rem', height:'1rem', color:tMuted }} />
                          Plan: {profile.is_premium
                            ? <span style={{ fontWeight:600, color:'rgb(217,119,6)' }}>Premium ⚡</span>
                            : <span>Free</span>}
                        </div>
                        {!profile.is_premium && (
                          <Link href="/pricing" onClick={() => setOpen(false)} style={{ fontSize:'0.75rem', fontWeight:600, color:'rgb(34,85,14)', textDecoration:'none' }}>Upgrade →</Link>
                        )}
                      </div>

                      <Link href="/settings?section=password" onClick={() => setOpen(false)}
                        style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 1rem', fontSize:'0.875rem', color:tText, textDecoration:'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background=tHover)}
                        onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                        <span style={{ color:tMuted }}>🔑</span> Change Password
                      </Link>
                    </div>

                    <div style={{ borderTop:`1px solid `, padding:'0.5rem 0' }}>
                      <button onClick={() => { setOpen(false); signOut() }}
                        style={{ display:'flex', alignItems:'center', gap:'0.75rem', width:'100%', padding:'0.625rem 1rem', fontSize:'0.875rem', color:'rgb(163,45,45)', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}
                        onMouseEnter={e => (e.currentTarget.style.background='rgb(254,242,242)')}
                        onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                        <LogOut style={{ width:'1rem', height:'1rem' }} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <Link href="/login" className="btn-ghost" style={{ fontSize:'0.9375rem', padding:'0.5rem 1rem' }}>Log In</Link>
              <Link href="/signup" className="btn-primary" style={{ fontSize:'0.9375rem', padding:'0.5rem 1.25rem' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {profile && mobileOpen && (
        <div style={{
          position:'fixed', top:'4rem', left:0, right:0, bottom:0,
          background:overlayBg, zIndex:49,
          backdropFilter:'blur(12px)', padding:'1.5rem',
          display:'flex', flexDirection:'column', gap:'0.5rem',
          overflowY:'auto',
        }}>
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                style={{
                  padding:'1rem 1.25rem', borderRadius:'0.875rem',
                  fontSize:'1.0625rem', fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'rgb(34,85,14)' : tText,
                  textDecoration:'none', transition:'all 0.2s',
                  background: isActive ? 'var(--af-border)' : 'transparent',
                  border: isActive ? '1.5px solid rgba(34,85,14,0.2)' : '1.5px solid transparent',
                }}>
                {link.label}
              </Link>
            )
          })}

          <div style={{ marginTop:'1rem', padding:'1rem', borderRadius:'0.875rem', background:'rgba(34,85,14,0.04)', border:'1px solid rgba(34,85,14,0.1)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
              <span style={{ fontSize:'1.25rem' }}>{levelInfo.current.emoji}</span>
              <div>
                <p style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'0.9375rem', color:tText }}>Level {levelInfo.current.level} — {levelInfo.current.name}</p>
                <p style={{ fontSize:'0.8125rem', color:tMuted }}>{xp} XP total</p>
              </div>
              {streak > 0 && <span style={{ marginLeft:'auto', fontSize:'0.9375rem', fontWeight:700, color:'rgb(180,120,10)' }}>🔥 {streak}</span>}
            </div>
            <div style={{ width:'100%', height:'6px', background:'rgba(34,85,14,0.1)', borderRadius:'9999px', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:'9999px', background:'linear-gradient(90deg, rgb(34,85,14), rgb(122,182,72))', width:`${levelInfo.pct}%` }} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .af-nav-links { display: none !important; }
          .af-streak-badge { display: none !important; }
          .af-xp-badge { display: none !important; }
          .af-mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}