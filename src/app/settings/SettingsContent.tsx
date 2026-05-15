'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Camera, Trash2, Eye, EyeOff, Zap } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/types'

export default function SettingsContent() {
  const [profile, setProfile] = useState<Profile | null>(null)
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
  const searchParams = useSearchParams()

  const passwordChecks = [
    { label: 'At least 8 characters', pass: newPassword.length >= 8 },
    { label: 'At least one number', pass: /\d/.test(newPassword) },
    { label: 'At least one special character', pass: /[^a-zA-Z0-9]/.test(newPassword) },
  ]

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
    const colors = ['#22550e','#1d4ed8','#7c3aed','#c2410c','#0f766e']
    return colors[id.charCodeAt(0) % colors.length]
  }

  if (!profile) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'2rem', height:'2rem', border:'3px solid rgba(34,85,14,0.2)', borderTop:'3px solid rgb(34,85,14)', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'rgb(250,250,247)' }}>
      <Navbar profile={profile} />
      <div style={{ paddingTop:'5rem' }}>
        <div className="container-base" style={{ padding:'2rem 1.5rem', maxWidth:'42rem' }}>
          <h1 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'2rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'2rem' }}>Settings</h1>

          {/* Profile */}
          <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1.5rem' }}>Profile</h2>

            <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'1.5rem' }}>
              <div style={{ position:'relative' }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={{ width:'5rem', height:'5rem', borderRadius:'50%', objectFit:'cover' }} />
                ) : (
                  <div style={{ width:'5rem', height:'5rem', borderRadius:'50%', background:avatarBg(profile.id), display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.5rem', fontWeight:600 }}>
                    {getInitials(profile.display_name, profile.email)}
                  </div>
                )}
                {avatarUploading && (
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:'1.25rem', height:'1.25rem', border:'2px solid white', borderTop:'2px solid transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                <button onClick={() => fileRef.current?.click()} className="btn-secondary" style={{ fontSize:'0.875rem', padding:'0.5rem 1rem' }}>
                  <Camera style={{ width:'0.875rem', height:'0.875rem' }} />
                  {profile.avatar_url ? 'Change photo' : 'Upload photo'}
                </button>
                {profile.avatar_url && (
                  <button onClick={removeAvatar} className="btn-ghost" style={{ fontSize:'0.8125rem', color:'rgb(163,45,45)', padding:'0.375rem 0.75rem' }}>
                    <Trash2 style={{ width:'0.75rem', height:'0.75rem' }} /> Remove
                  </button>
                )}
                <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)' }}>JPG or PNG, max 2MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" style={{ display:'none' }} onChange={uploadAvatar} />
            </div>

            <form onSubmit={saveName} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label className="label">Display name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="input" placeholder="Your name" />
              </div>
              <div>
                <label className="label">Email</label>
                <input value={profile.email ?? ''} className="input" disabled style={{ background:'rgb(249,250,251)', color:'rgb(107,107,88)' }} />
                <p style={{ fontSize:'0.75rem', color:'rgb(107,107,88)', marginTop:'0.375rem' }}>Email cannot be changed</p>
              </div>
              {nameSuccess && <div className="alert-success"><CheckCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />Name updated!</div>}
              {nameError && <div className="alert-error"><AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />{nameError}</div>}
              <button type="submit" disabled={nameSaving} className="btn-primary" style={{ alignSelf:'flex-start' }}>
                {nameSaving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }} id="password">
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1.5rem' }}>Change Password</h2>
            <form onSubmit={changePassword} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label className="label">New Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="input" placeholder="••••••••" style={{ paddingRight:'3rem' }} />
                  <button type="button" onClick={() => setShowNew(s => !s)}
                    style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', color:'rgb(107,107,88)' }}>
                    {showNew ? <EyeOff style={{ width:'1.125rem', height:'1.125rem' }} /> : <Eye style={{ width:'1.125rem', height:'1.125rem' }} />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <ul style={{ listStyle:'none', padding:0, margin:'0.5rem 0 0', display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                    {passwordChecks.map(c => (
                      <li key={c.label} style={{ display:'flex', alignItems:'center', gap:'0.375rem', fontSize:'0.75rem', color: c.pass ? 'rgb(59,109,17)' : 'rgb(107,107,88)' }}>
                        <CheckCircle style={{ width:'0.75rem', height:'0.75rem' }} />{c.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className={`input${confirmPassword.length > 0 && confirmPassword !== newPassword ? ' input-error' : ''}`}
                  placeholder="••••••••" />
              </div>
              {pwSuccess && <div className="alert-success"><CheckCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />Password updated successfully!</div>}
              {pwError && <div className="alert-error"><AlertCircle style={{ width:'1rem', height:'1rem', flexShrink:0 }} />{pwError}</div>}
              <button type="submit" disabled={pwSaving} className="btn-primary" style={{ alignSelf:'flex-start' }}>
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Plan & Billing */}
          <div className="card" style={{ padding:'2rem', marginBottom:'1.5rem' }}>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(26,26,20)', marginBottom:'1.5rem' }}>Plan & Billing</h2>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
              <div>
                <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'0.25rem' }}>Current plan</p>
                {profile.is_premium ? (
                  <span className="badge badge-premium"><Zap style={{ width:'0.75rem', height:'0.75rem' }} />Premium</span>
                ) : (
                  <span className="badge badge-primary">Free</span>
                )}
              </div>
              {profile.is_premium ? (
                <ManageSubscriptionButton />
              ) : (
                <Link href="/pricing" className="btn-primary" style={{ fontSize:'0.875rem', padding:'0.5rem 1.25rem' }}>
                  <Zap style={{ width:'0.875rem', height:'0.875rem' }} />
                  Upgrade to Premium
                </Link>
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div className="card" style={{ padding:'2rem', border:'1px solid rgba(163,45,45,0.2)' }}>
            <h2 style={{ fontFamily:'Fraunces, Georgia, serif', fontSize:'1.25rem', fontWeight:700, color:'rgb(163,45,45)', marginBottom:'0.5rem' }}>Danger Zone</h2>
            <p style={{ fontSize:'0.875rem', color:'rgb(107,107,88)', marginBottom:'1.25rem' }}>
              Permanently delete your account and all your data. This cannot be undone.
            </p>
            <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
              <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                className="input" placeholder='Type "DELETE" to confirm'
                style={{ maxWidth:'16rem' }} />
              <button onClick={deleteAccount} disabled={deleteConfirm !== 'DELETE'}
                style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.75rem 1.25rem', borderRadius:'0.75rem', background: deleteConfirm === 'DELETE' ? 'rgb(163,45,45)' : 'rgb(229,231,235)', color: deleteConfirm === 'DELETE' ? 'white' : 'rgb(156,163,175)', border:'none', cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed', fontSize:'0.875rem', fontWeight:500, transition:'all 0.2s' }}>
                <Trash2 style={{ width:'0.875rem', height:'0.875rem' }} />
                Delete Account
              </button>
            </div>
            {deleteError && <p style={{ fontSize:'0.875rem', color:'rgb(163,45,45)', marginTop:'0.5rem' }}>{deleteError}</p>}
          </div>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    <button onClick={handleManage} disabled={loading} className="btn-secondary" style={{ fontSize:'0.875rem', padding:'0.5rem 1rem' }}>
      {loading ? 'Loading...' : 'Manage subscription'}
    </button>
  )
}