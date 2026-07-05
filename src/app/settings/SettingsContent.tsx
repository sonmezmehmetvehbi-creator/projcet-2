'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Camera, Trash2, Eye, EyeOff, Zap, User, Lock, CreditCard, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/types'

const GREEN = 'rgb(34,85,14)'
const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'
const RED = 'rgb(163,45,45)'

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

type TabId = 'profile' | 'password' | 'subscription' | 'danger'
const TABS: { id: TabId; label: string; icon: typeof User; danger?: boolean }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
]

const sectionTitle: React.CSSProperties = { fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: INK, marginBottom: '1.5rem' }
const cardStyle: React.CSSProperties = { background: 'white', borderRadius: '1.25rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(34,85,14,0.06)', padding: '2rem' }

export default function SettingsContent() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  const [displayName, setDisplayName] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const passwordChecks = [
    { label: 'At least 8 characters', pass: newPassword.length >= 8 },
    { label: 'At least one number', pass: /\d/.test(newPassword) },
    { label: 'At least one special character', pass: /[^a-zA-Z0-9]/.test(newPassword) },
  ]
  // Strength score (0-4) for the visual bars.
  const strengthCriteria = [newPassword.length >= 8, /\d/.test(newPassword), /[^a-zA-Z0-9]/.test(newPassword), newPassword.length >= 12]
  const strength = strengthCriteria.filter(Boolean).length
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = strength <= 1 ? 'rgb(220,38,38)' : strength === 2 ? 'rgb(217,119,6)' : strength === 3 ? 'rgb(202,138,4)' : GREEN

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setDisplayName(data?.display_name ?? '')
    }
    load()
  }, [])

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setNameError(''); setNameSuccess(false); setNameSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', profile!.id)
    setNameSaving(false)
    if (error) setNameError(error.message)
    else { setNameSuccess(true); setProfile(p => p ? { ...p, display_name: displayName } : p) }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return }
    if (!passwordChecks.every(c => c.pass)) { setPwError('Please meet all password requirements.'); return }
    setPwError(''); setPwSuccess(false); setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) setPwError(error.message)
    else { setPwSuccess(true); setNewPassword(''); setConfirmPassword('') }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return }
    setAvatarUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { alert(uploadError.message); setAvatarUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    setProfile(p => p ? { ...p, avatar_url: publicUrl } : p)
    setAvatarUploading(false)
  }

  async function removeAvatar() {
    if (!profile) return
    const supabase = createClient()
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id)
    setProfile(p => p ? { ...p, avatar_url: null } : p)
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'DELETE') { setDeleteError('Type DELETE to confirm.'); return }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  function getInitials(name?: string | null, email?: string | null) {
    if (name) return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    if (email) return email[0].toUpperCase()
    return '?'
  }

  function avatarBg(id: string) {
    const colors = ['#22550e', '#1d4ed8', '#7c3aed', '#c2410c', '#0f766e']
    return colors[id.charCodeAt(0) % colors.length]
  }

  if (!profile) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '2rem', height: '2rem', border: '3px solid rgba(34,85,14,0.2)', borderTop: '3px solid rgb(34,85,14)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const xp = (profile as any)?.xp ?? 0
  const levelInfo = getLevelInfo(xp)

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(250,250,247)' }}>
      <Navbar profile={profile} />
      <div style={{ paddingTop: '5rem' }}>
        <div className="container-base" style={{ padding: '2rem 1.5rem', maxWidth: '60rem' }}>
          <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: INK, marginBottom: '1.75rem' }}>Settings</h1>

          <div className="settings-layout" style={{ display: 'flex', gap: '1.75rem', alignItems: 'flex-start' }}>

            {/* ── Sidebar ── */}
            <nav className="settings-sidebar" style={{ width: '240px', flexShrink: 0, background: 'white', borderRadius: '1.25rem', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(34,85,14,0.06)', padding: '0.75rem', position: 'sticky', top: '5.5rem' }}>
              {TABS.map(t => {
                const active = activeTab === t.id
                const accent = t.danger ? RED : GREEN
                return (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 0.875rem', marginBottom: '0.25rem', borderRadius: '0.75rem',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontSize: '0.9375rem', fontWeight: active ? 700 : 500,
                      color: active ? accent : MUTED,
                      background: active ? (t.danger ? 'rgba(163,45,45,0.07)' : 'rgba(34,85,14,0.07)') : 'transparent',
                      borderLeft: `3px solid ${active ? accent : 'transparent'}`,
                      transition: 'all 0.15s ease',
                    }}>
                    <t.icon style={{ width: '1.125rem', height: '1.125rem', flexShrink: 0 }} />
                    {t.label}
                  </button>
                )
              })}
            </nav>

            {/* ── Content ── */}
            <div className="settings-content" style={{ flex: 1, minWidth: 0 }}>
              <div key={activeTab} className="settings-fade">

                {/* ========== PROFILE ========== */}
                {activeTab === 'profile' && (
                  <div style={cardStyle}>
                    <h2 style={sectionTitle}>Profile</h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                      <div className="avatar-wrap" style={{ position: 'relative', width: '5rem', height: '5rem', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" style={{ width: '5rem', height: '5rem', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: avatarBg(profile.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 600 }}>
                            {getInitials(profile.display_name, profile.email)}
                          </div>
                        )}
                        {/* camera overlay on hover */}
                        <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s ease' }}>
                          <Camera style={{ width: '1.375rem', height: '1.375rem', color: 'white' }} />
                        </div>
                        {avatarUploading && (
                          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '1.25rem', height: '1.25rem', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button onClick={() => fileRef.current?.click()} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                          <Camera style={{ width: '0.875rem', height: '0.875rem' }} />
                          {profile.avatar_url ? 'Change photo' : 'Upload photo'}
                        </button>
                        {profile.avatar_url && (
                          <button onClick={removeAvatar} className="btn-ghost" style={{ fontSize: '0.8125rem', color: RED, padding: '0.375rem 0.75rem' }}>
                            <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} /> Remove
                          </button>
                        )}
                        <p style={{ fontSize: '0.75rem', color: MUTED }}>JPG or PNG, max 2MB</p>
                      </div>
                      <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={uploadAvatar} />
                    </div>

                    <form onSubmit={saveName} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                      <div>
                        <label className="label">Display name</label>
                        <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="input" placeholder="Your name" />
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <div style={{ position: 'relative' }}>
                          <input value={profile.email ?? ''} className="input" disabled style={{ background: 'rgb(249,250,251)', color: MUTED, paddingRight: '6rem' }} />
                          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', fontWeight: 700, color: 'rgb(59,109,17)', background: 'rgba(34,85,14,0.1)', padding: '0.25rem 0.5rem', borderRadius: '9999px' }}>
                            <CheckCircle style={{ width: '0.75rem', height: '0.75rem' }} /> Verified
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: MUTED, marginTop: '0.375rem' }}>Email cannot be changed</p>
                      </div>

                      {/* Decorative XP / level */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '1rem', background: 'linear-gradient(135deg, rgba(34,85,14,0.04), rgba(122,182,72,0.06))', border: '1px solid rgba(34,85,14,0.1)' }}>
                        <span style={{ fontSize: '2rem', lineHeight: 1 }}>{levelInfo.current.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: INK }}>Level {levelInfo.current.level} · {levelInfo.current.name}</span>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.8125rem', color: MUTED }}>{xp.toLocaleString()} XP</span>
                          </div>
                          <div style={{ height: '7px', borderRadius: '9999px', background: 'rgba(34,85,14,0.12)', overflow: 'hidden' }}>
                            <div style={{ width: `${levelInfo.pct}%`, height: '100%', borderRadius: '9999px', background: `linear-gradient(90deg, ${GREEN}, rgb(122,182,72))`, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      </div>

                      {nameSuccess && <div className="alert-success settings-pop"><CheckCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />Name updated!</div>}
                      {nameError && <div className="alert-error settings-shake"><AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />{nameError}</div>}
                      <button type="submit" disabled={nameSaving} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                        {nameSaving ? 'Saving...' : 'Save changes'}
                      </button>
                    </form>
                  </div>
                )}

                {/* ========== PASSWORD ========== */}
                {activeTab === 'password' && (
                  <div style={cardStyle}>
                    <h2 style={sectionTitle}>Password</h2>
                    <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                      <div>
                        <label className="label">New Password</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                            className="input" placeholder="••••••••" style={{ paddingRight: '3rem' }} />
                          <button type="button" onClick={() => setShowNew(s => !s)}
                            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED }}>
                            {showNew ? <EyeOff style={{ width: '1.125rem', height: '1.125rem' }} /> : <Eye style={{ width: '1.125rem', height: '1.125rem' }} />}
                          </button>
                        </div>
                        {newPassword.length > 0 && (
                          <div style={{ marginTop: '0.625rem' }}>
                            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.375rem' }}>
                              {[0, 1, 2, 3].map(i => (
                                <div key={i} style={{ flex: 1, height: '5px', borderRadius: '9999px', background: i < strength ? strengthColor : 'rgba(34,85,14,0.12)', transition: 'background 0.3s ease' }} />
                              ))}
                            </div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: strengthColor }}>
                              {strengthLabel}<span style={{ fontWeight: 400, color: MUTED }}> — use 8+ characters, a number, and a symbol</span>
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="label">Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                          className={`input${confirmPassword.length > 0 && confirmPassword !== newPassword ? ' input-error' : ''}`}
                          placeholder="••••••••" />
                      </div>
                      {pwSuccess && <div className="alert-success settings-pop"><CheckCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />Password updated successfully!</div>}
                      {pwError && <div className="alert-error settings-shake"><AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />{pwError}</div>}
                      <button type="submit" disabled={pwSaving} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                        {pwSaving ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                )}

                {/* ========== SUBSCRIPTION ========== */}
                {activeTab === 'subscription' && (
                  <div style={cardStyle}>
                    <h2 style={sectionTitle}>Subscription</h2>

                    {/* Current plan card */}
                    <div style={{ padding: '1.5rem', borderRadius: '1rem', border: `1px solid ${profile.is_premium ? 'rgba(34,85,14,0.25)' : 'rgba(0,0,0,0.08)'}`, background: profile.is_premium ? 'rgba(34,85,14,0.04)' : 'rgb(250,250,247)', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <p style={{ fontSize: '0.8125rem', color: MUTED, marginBottom: '0.375rem' }}>Current plan</p>
                          {profile.is_premium ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: GREEN }}>
                              <Zap style={{ width: '1.125rem', height: '1.125rem' }} /> Premium
                            </span>
                          ) : (
                            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: INK }}>Free</span>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: INK }}>{profile.is_premium ? '$5.99' : '$0'}<span style={{ fontSize: '0.8125rem', fontWeight: 400, color: MUTED }}>/mo</span></p>
                          {profile.is_premium && profile.premium_since && (
                            <p style={{ fontSize: '0.75rem', color: MUTED }}>Member since {new Date(profile.premium_since).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {profile.is_premium ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        <p style={{ fontSize: '0.9375rem', color: MUTED, lineHeight: 1.6 }}>
                          You have unlimited access to everything AceForge offers. Manage your billing, update your payment method, or cancel your plan from the secure Stripe portal.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <ManageSubscriptionButton />
                          <span style={{ fontSize: '0.8125rem', color: MUTED }}>Cancel anytime — no fees, no hassle.</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* mini comparison */}
                        <div style={{ borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', background: 'rgba(34,85,14,0.04)', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', gap: '1.5rem' }}>
                            <span>Feature</span><span style={{ textAlign: 'center', minWidth: '3rem' }}>Free</span><span style={{ textAlign: 'center', minWidth: '4.5rem', color: GREEN }}>Premium</span>
                          </div>
                          {[
                            { f: 'AI questions / day', free: '2', prem: 'Unlimited' },
                            { f: 'Worksheets / day', free: '2', prem: 'Unlimited' },
                            { f: 'SAT practice / day', free: '1', prem: 'Unlimited' },
                            { f: 'Wait between generations', free: '30s', prem: 'None ⚡' },
                            { f: 'Ads', free: 'Yes', prem: 'Ad-free' },
                          ].map((r, i) => (
                            <div key={r.f} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '0.75rem 1rem', fontSize: '0.875rem', gap: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', background: i % 2 ? 'white' : 'rgba(34,85,14,0.01)' }}>
                              <span style={{ color: INK }}>{r.f}</span>
                              <span style={{ textAlign: 'center', minWidth: '3rem', color: MUTED }}>{r.free}</span>
                              <span style={{ textAlign: 'center', minWidth: '4.5rem', color: GREEN, fontWeight: 600 }}>{r.prem}</span>
                            </div>
                          ))}
                        </div>
                        <Link href="/pricing" className="btn-primary" style={{ boxShadow: '0 4px 16px rgba(34,85,14,0.2)' }}>
                          <Zap style={{ width: '1rem', height: '1rem' }} /> Upgrade to Premium →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* ========== DANGER ZONE ========== */}
                {activeTab === 'danger' && (
                  <div style={{ ...cardStyle, border: `1px solid rgba(163,45,45,0.3)`, boxShadow: '0 4px 24px rgba(163,45,45,0.08)' }}>
                    <h2 style={{ ...sectionTitle, color: RED, marginBottom: '0.5rem' }}>Danger Zone</h2>
                    <p style={{ fontSize: '0.9375rem', color: MUTED, lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      Permanently delete your account and all associated data — sessions, progress, XP, and subscription. This action <strong style={{ color: RED }}>cannot be undone</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                        className="input" placeholder='Type "DELETE" to confirm'
                        style={{ maxWidth: '16rem' }} />
                      <button onClick={deleteAccount} disabled={deleteConfirm !== 'DELETE'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', background: deleteConfirm === 'DELETE' ? RED : 'rgb(229,231,235)', color: deleteConfirm === 'DELETE' ? 'white' : 'rgb(156,163,175)', border: 'none', cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s' }}>
                        <Trash2 style={{ width: '0.875rem', height: '0.875rem' }} />
                        Delete Account
                      </button>
                    </div>
                    {deleteError && <p className="settings-shake" style={{ fontSize: '0.875rem', color: RED, marginTop: '0.75rem', fontWeight: 600 }}>{deleteError}</p>}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes settingsFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes settingsPop { 0% { opacity: 0; transform: scale(0.9); } 60% { transform: scale(1.03); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes settingsShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        .settings-fade { animation: settingsFade 0.35s ease both; }
        .settings-pop { animation: settingsPop 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .settings-shake { animation: settingsShake 0.4s ease both; }
        .avatar-wrap:hover .avatar-overlay { opacity: 1; }
        @media (max-width: 720px) {
          .settings-layout { flex-direction: column; }
          .settings-sidebar { width: 100% !important; position: static !important; display: flex; flex-wrap: wrap; gap: 0.25rem; }
          .settings-sidebar button { width: auto !important; flex: 1 1 auto; }
        }
      `}</style>
    </div>
  )
}

function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  async function handleManage() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else { alert(data.error || 'Something went wrong'); setLoading(false) }
    } catch {
      alert('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <button onClick={handleManage} disabled={loading} className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.625rem 1.25rem' }}>
      {loading ? 'Loading...' : 'Manage Subscription'}
    </button>
  )
}
