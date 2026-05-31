'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, ChevronDown, Shield, FileText } from 'lucide-react'
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
    { href: '/admin/dashboard', label: '📊 Dashboard' },
    { href: '/admin/support', label: '🎧 Support Tickets' },
    { href: '/admin/tutors', label: '🎓 Tutor Applications' },
    { href: '/admin/appeals', label: '⚖️ Appeals' },
    { href: '/admin/disputes', label: '⚠️ Disputes' },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(15,15,12,0.97)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 1px 16px rgba(0,0,0,0.3)',
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem', padding: '0 1.5rem', gap: '1rem' }}>

        {/* Logo */}
        <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'rgb(34,85,14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield style={{ width: '1rem', height: '1rem', color: 'white' }} strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.125rem', color: 'white' }}>AceForge</span>
          <span style={{ fontSize: '0.625rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgb(34,85,14)', color: 'white', fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ADMIN
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flex: 1, justifyContent: 'center' }}>
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href}
                style={{
                  padding: '0.5rem 0.875rem', borderRadius: '0.625rem',
                  fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                  textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Profile dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }} ref={ref}>
          <button onClick={() => setOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.375rem 0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
            <div style={{ width: '1.875rem', height: '1.875rem', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(34,85,14), rgb(74,122,40))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8125rem', fontWeight: 700 }}>
              {profile?.display_name?.[0] ?? 'A'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'white', lineHeight: 1.2 }}>{profile?.display_name ?? 'Admin'}</p>
              <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.2, fontFamily: 'Syne, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrator</p>
            </div>
            <ChevronDown style={{ width: '0.875rem', height: '0.875rem', color: 'rgba(255,255,255,0.3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {open && (
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)', width: '15rem', background: 'rgb(18,18,14)', borderRadius: '0.875rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', zIndex: 100 }}>

              {/* Admin info */}
              <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', marginBottom: '0.125rem' }}>{profile?.display_name}</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{profile?.email}</p>
              </div>

              {/* Admin policy link */}
              <div style={{ padding: '0.5rem 0' }}>
                <Link href="/admin/policy" onClick={() => setOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}>
                  <FileText style={{ width: '1rem', height: '1rem' }} />
                  Admin Policy & Guidelines
                </Link>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '0.5rem 0' }}>
                <button onClick={() => { setOpen(false); signOut() }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.625rem 1rem', fontSize: '0.875rem', color: 'rgba(255,100,100,0.8)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <LogOut style={{ width: '1rem', height: '1rem' }} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
