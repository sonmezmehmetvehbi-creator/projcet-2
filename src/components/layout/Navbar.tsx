'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Settings, LogOut, FileText, Crown, ChevronDown, Zap, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase'
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
  const [scrolled, setScrolled] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:50,
      background: isTransparent ? 'transparent' : 'rgba(255,255,255,0.95)',
      backdropFilter: isTransparent ? 'none' : 'blur(12px)',
      borderBottom: isTransparent ? 'none' : '1px solid rgba(34,85,14,0.08)',
      boxShadow: isTransparent ? 'none' : '0 1px 12px rgba(34,85,14,0.06)',
      transition: 'all 0.3s ease',
    }}>
      <div className="container-base" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:'4rem', padding:'0 1.5rem' }}>
        <Link href={profile ? '/dashboard' : '/'} style={{ display:'flex', alignItems:'center', gap:'0.5rem', textDecoration:'none' }}>
          <div style={{ width:'2rem', height:'2rem', borderRadius:'0.5rem', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BookOpen style={{ width:'1rem', height:'1rem', color:'white' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily:'Fraunces, Georgia, serif', fontWeight:700, fontSize:'1.125rem', color: isTransparent ? 'rgb(34,85,14)' : 'rgb(34,85,14)' }}>AceForge</span>
        </Link>

        {profile ? (
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>

            {/* Streak badge */}
            {streak > 0 && (
              <div style={{
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

            {/* XP + Level */}
            <div style={{
              display:'flex', alignItems:'center', gap:'0.5rem',
              padding:'0.25rem 0.75rem 0.25rem 0.5rem',
              borderRadius:'9999px',
              background:'rgba(34,85,14,0.06)',
              border:'1px solid rgba(34,85,14,0.15)',
              minWidth:'120px',
            }}>
              <span style={{ fontSize:'0.9375rem' }}>{levelInfo.current.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2px' }}>
                  <span style={{ fontSize:'0.6875rem', fontWeight:700, color:'rgb(34,85,14)', fontFamily:'Syne, sans-serif' }}>
                    Lv.{levelInfo.current.level}
                  </span>
                  <span style={{ fontSize:'0.6rem', color:'rgb(107,107,88)', fontFamily:'Syne, sans-serif' }}>
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
                <ChevronDown style={{ width:'0.875rem', height:'0.875rem', color:'rgb(107,107,88)', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
              </button>

              {open && (
                <div style={{ position:'absolute', right:0, top:'calc(100% + 0.5rem)', width:'17rem', background:'white', borderRadius:'1rem', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', border:'1px solid rgba(34,85,14,0.1)', overflow:'hidden', zIndex:100 }}>

                  {/* Profile header */}
                  <div style={{ padding:'0.75rem 1rem', borderBottom:'1px solid rgb(243,244,246)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" style={{ width:'2.5rem', height:'2.5rem', borderRadius:'50%', objectFit:'cover' }} />
                    ) : (
                      <div style={{ width:'2.5rem', height:'2.5rem', borderRadius:'50%', background:avatarBg(profile.id), display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:600 }}>
                        {initials(profile.display_name, profile.email)}
                      </div>
                    )}
                    <div style={{ minWidth:0, flex:1 }}>
                      <p style={{ fontSize:'0.875rem', fontWeight:600, color:'rgb(26,26,20)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile.display_name ?? 'Student'}</p>
                      <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile.email}</p>
                    </div>
                  </div>

                  {/* XP card inside dropdown */}
                  <div style={{ padding:'0.75rem 1rem', borderBottom:'1px solid rgb(243,244,246)', background:'rgba(34,85,14,0.02)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                        <span style={{ fontSize:'1rem' }}>{levelInfo.current.emoji}</span>
                        <span style={{ fontSize:'0.8125rem', fontWeight:700, color:'rgb(26,26,20)', fontFamily:'Syne, sans-serif' }}>
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
                      <span style={{ fontSize:'0.6875rem', color:'rgb(107,107,88)', fontFamily:'Syne, sans-serif' }}>{xp} XP total</span>
                      {levelInfo.next && (
                        <span style={{ fontSize:'0.6875rem', color:'rgb(107,107,88)', fontFamily:'Syne, sans-serif' }}>
                          {levelInfo.next.xpRequired - xp} XP to {levelInfo.next.name} {levelInfo.next.emoji}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding:'0.5rem 0' }}>
                    {[
                      { href:'/settings', icon:<Settings style={{width:'1rem',height:'1rem'}} />, label:'Settings' },
                      { href:'/dashboard?tab=pdfs', icon:<FileText style={{width:'1rem',height:'1rem'}} />, label:'My PDFs' },
                      { href:'/terms', icon:<FileText style={{width:'1rem',height:'1rem'}} />, label:'Terms of Service' },
                      { href:'/privacy', icon:<FileText style={{width:'1rem',height:'1rem'}} />, label:'Privacy Policy' },
                    ].map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                        style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 1rem', fontSize:'0.875rem', color:'rgb(26,26,20)', textDecoration:'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background='rgb(249,250,251)')}
                        onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                        <span style={{ color:'rgb(107,107,88)' }}>{item.icon}</span>{item.label}
                      </Link>
                    ))}

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.625rem 1rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', fontSize:'0.875rem', color:'rgb(26,26,20)' }}>
                        <Crown style={{ width:'1rem', height:'1rem', color:'rgb(107,107,88)' }} />
                        Plan: {profile.is_premium
                          ? <span style={{ fontWeight:600, color:'rgb(217,119,6)' }}>Premium ⚡</span>
                          : <span>Free</span>}
                      </div>
                      {!profile.is_premium && (
                        <Link href="/pricing" onClick={() => setOpen(false)} style={{ fontSize:'0.75rem', fontWeight:600, color:'rgb(34,85,14)', textDecoration:'none' }}>Upgrade →</Link>
                      )}
                    </div>

                    <Link href="/settings?section=password" onClick={() => setOpen(false)}
                      style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 1rem', fontSize:'0.875rem', color:'rgb(26,26,20)', textDecoration:'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background='rgb(249,250,251)')}
                      onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                      <span style={{ color:'rgb(107,107,88)' }}>🔑</span> Change Password
                    </Link>
                  </div>

                  <div style={{ borderTop:'1px solid rgb(243,244,246)', padding:'0.5rem 0' }}>
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
  )
}