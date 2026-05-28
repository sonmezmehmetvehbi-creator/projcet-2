'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, ChevronDown, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Props { profile: any }

export default function AdminNavbar({ profile }: Props) {
  const [open, setOpen] = useState(false)
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

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const NAV_LINKS = [
    { href:'/admin/dashboard', label:'Dashboard' },
    { href:'/admin/tutors', label:'Tutor Approvals' },
    { href:'/admin/disputes', label:'Disputes' },
    { href:'/admin/support', label:'Support Chat' },
  ]

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:50,
      background:'rgba(26,26,20,0.97)',
      backdropFilter:'blur(12px)',
      borderBottom:'1px solid rgba(255,255,255,0.08)',
      boxShadow:'0 1px 12px rgba(0,0,0,0.2)',
    }}>
      <div style={{ maxWidth:'80rem', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:'4rem', padding:'0 1.5rem', gap:'1rem' }}>

        {/* Logo */}
        <Link href="/admin/dashboard" style={{ display:'flex', alignItems:'center', gap:'0.5rem', textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:'2rem', height:'2rem', borderRadius:'0.5rem', background:'rgba(34,85,14,0.9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Shield style={{ width:'1rem', height:'1rem', color:'white' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily:'Fraunces, Georgia, serif', fontWeight:700, fontSize:'1.125rem', color:'white' }}>AceForge</span>
          <span style={{ fontSize:'0.6875rem', fontWeight:700, padding:'0.2rem 0.5rem', borderRadius:'9999px', background:'rgba(34,85,14,0.8)', color:'white', fontFamily:'Syne, sans-serif', letterSpacing:'0.05em' }}>ADMIN</span>
        </Link>

        {/* Nav links */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.125rem', flex:1, justifyContent:'center' }}>
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href}
                style={{
                  padding:'0.5rem 0.875rem', borderRadius:'0.625rem',
                  fontSize:'0.9375rem', fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                  textDecoration:'none', transition:'all 0.2s', whiteSpace:'nowrap',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}>
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Profile */}
        <div style={{ position:'relative', flexShrink:0 }} ref={ref}>
          <button onClick={() => setOpen(o => !o)}
            style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.375rem 0.75rem', borderRadius:'0.75rem', border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', cursor:'pointer' }}>
            <div style={{ width:'1.875rem', height:'1.875rem', borderRadius:'50%', background:'rgb(34,85,14)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.8125rem', fontWeight:700 }}>
              {profile?.display_name?.[0] ?? 'A'}
            </div>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontSize:'0.8125rem', fontWeight:600, color:'white', lineHeight:1.2 }}>{profile?.display_name ?? 'Admin'}</p>
              <p style={{ fontSize:'0.6875rem', color:'rgba(255,255,255,0.4)', lineHeight:1.2 }}>Administrator</p>
            </div>
            <ChevronDown style={{ width:'0.875rem', height:'0.875rem', color:'rgba(255,255,255,0.4)', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
          </button>

          {open && (
            <div style={{ position:'absolute', right:0, top:'calc(100% + 0.5rem)', width:'14rem', background:'rgb(26,26,20)', borderRadius:'0.875rem', boxShadow:'0 20px 60px rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', overflow:'hidden', zIndex:100 }}>
              <div style={{ padding:'0.75rem 1rem', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize:'0.875rem', fontWeight:600, color:'white' }}>{profile?.display_name}</p>
                <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>{profile?.email}</p>
              </div>
              <div style={{ padding:'0.5rem 0' }}>
                <button onClick={() => { setOpen(false); signOut() }}
                  style={{ display:'flex', alignItems:'center', gap:'0.75rem', width:'100%', padding:'0.625rem 1rem', fontSize:'0.875rem', color:'rgba(255,100,100,0.9)', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                  <LogOut style={{ width:'1rem', height:'1rem' }} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
