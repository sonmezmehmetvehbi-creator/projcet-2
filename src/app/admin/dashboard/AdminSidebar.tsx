'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Shield, LogOut, Menu, X, FileText,
  LayoutDashboard, Users, Flag, GraduationCap, Scale, Flame, Calendar, DollarSign, Headphones,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { SidebarCounts } from './adminSidebarCounts'

interface Props {
  profile: any
  counts?: SidebarCounts
}

const GREEN = 'rgb(34,85,14)'

const GROUPS: { label: string; items: { href: string; label: string; Icon: typeof Users; badge?: keyof SidebarCounts }[] }[] = [
  { label: 'Overview', items: [
    { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  ] },
  { label: 'Users', items: [
    { href: '/admin/users', label: 'All Users', Icon: Users },
    { href: '/admin/reports', label: 'Reports', Icon: Flag },
  ] },
  { label: 'Tutoring', items: [
    { href: '/admin/tutors', label: 'Applications', Icon: GraduationCap, badge: 'applications' },
    { href: '/admin/appeals', label: 'Appeals', Icon: Scale },
    { href: '/admin/disputes', label: 'Disputes', Icon: Flame, badge: 'disputes' },
    { href: '/admin/sessions', label: 'Sessions', Icon: Calendar },
  ] },
  { label: 'Finance', items: [
    { href: '/admin/payouts', label: 'Payouts', Icon: DollarSign },
  ] },
  { label: 'Support', items: [
    { href: '/admin/support', label: 'Support', Icon: Headphones, badge: 'support' },
  ] },
]

export default function AdminSidebar({ profile, counts }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initial = (profile?.display_name?.[0] ?? 'A').toUpperCase()

  return (
    <>
      {/* Mobile hamburger */}
      <button className="admin-hamburger" onClick={() => setOpen(true)}
        style={{ position: 'fixed', top: '0.75rem', left: '0.75rem', zIndex: 45, width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', background: 'rgb(10,10,18)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Menu style={{ width: '1.25rem', height: '1.25rem' }} />
      </button>

      {/* Backdrop (mobile, when open) */}
      {open && <div className="admin-backdrop" onClick={() => setOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 44, background: 'rgba(0,0,0,0.55)' }} />}

      <aside className={`admin-sidebar${open ? ' open' : ''}`} style={{
        position: 'fixed', top: 0, left: 0, zIndex: 46,
        width: '240px', height: '100vh',
        background: 'rgb(10,10,18)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.25s ease',
      }}>
        {/* Top: logo + mobile close */}
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/admin/dashboard" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield style={{ width: '1rem', height: '1rem', color: 'white' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.125rem', color: 'white' }}>AceForge</span>
            <span style={{ fontSize: '0.5625rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '9999px', background: 'linear-gradient(135deg, rgb(185,28,28), rgb(127,29,29))', color: 'white', fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ADMIN
            </span>
          </Link>
          <button className="admin-close" onClick={() => setOpen(false)}
            style={{ display: 'none', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}>
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 0.75rem' }}>
          {GROUPS.map((group, gi) => (
            <div key={group.label}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 1rem', marginTop: gi === 0 ? 0 : '1rem' }}>{group.label}</p>
              {group.items.map(item => {
                const active = pathname === item.href
                const badgeCount = item.badge ? (counts?.[item.badge] ?? 0) : 0
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className="admin-nav-item"
                    style={{
                      position: 'relative', display: 'flex', alignItems: 'center',
                      padding: '0.625rem 1rem', borderRadius: '0.625rem', fontSize: '0.875rem',
                      textDecoration: 'none', marginBottom: '0.125rem',
                      color: active ? 'white' : 'rgba(255,255,255,0.5)',
                      fontWeight: active ? 600 : 400,
                      background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                      borderLeft: `3px solid ${active ? GREEN : 'transparent'}`,
                      transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent' } }}>
                    <item.Icon style={{ width: '1rem', height: '1rem', marginRight: '0.75rem', flexShrink: 0 }} />
                    {item.label}
                    {badgeCount > 0 && (
                      <span style={{ position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)', minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '9999px', background: 'rgb(220,38,38)', color: 'white', fontSize: '0.6875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: profile + sign out */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(220,38,38), rgb(153,27,27))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0 }}>
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'white', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.display_name ?? 'Admin'}</p>
              <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.2, fontFamily: 'Syne, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Administrator</p>
            </div>
          </div>
          <Link href="/admin/policy" onClick={() => setOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '0.25rem' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
            <FileText style={{ width: '0.9375rem', height: '0.9375rem' }} /> Admin Policy
          </Link>
          <button onClick={signOut}
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', width: '100%', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', fontSize: '0.8125rem', color: 'rgba(248,113,113,0.85)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <LogOut style={{ width: '0.9375rem', height: '0.9375rem' }} /> Sign Out
          </button>
        </div>
      </aside>

      <style>{`
        .admin-hamburger { display: none; }
        @media (max-width: 768px) {
          .admin-hamburger { display: flex; }
          .admin-close { display: block !important; }
          .admin-sidebar { transform: translateX(-100%); box-shadow: 0 0 40px rgba(0,0,0,0.6); }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  )
}
