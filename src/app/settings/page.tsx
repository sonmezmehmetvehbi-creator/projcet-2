import { Suspense } from 'react'
import SettingsContent from './SettingsContent'

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:'2rem', height:'2rem', border:'3px solid rgba(34,85,14,0.2)', borderTop:'3px solid rgb(34,85,14)', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}