import Link from 'next/link'

const GREEN = 'rgb(34,85,14)'
const INK = 'rgb(26,26,20)'
const MUTED = 'rgb(107,107,88)'

const FLOATERS = [
  { label: '🧬 Biology', top: '16%', left: '10%', delay: '0s' },
  { label: '📐 Calculus', top: '28%', left: '78%', delay: '1.1s' },
  { label: '🎯 SAT Math', top: '68%', left: '14%', delay: '0.6s' },
  { label: '🏛️ History', top: '78%', left: '72%', delay: '1.7s' },
  { label: '⚗️ Chemistry', top: '46%', left: '84%', delay: '2.2s' },
]

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F4F7EC, #EFF5E3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem',
    }}>
      {/* Floating subject words */}
      {FLOATERS.map((f) => (
        <span key={f.label} style={{
          position: 'absolute',
          top: f.top,
          left: f.left,
          padding: '0.5rem 0.875rem',
          borderRadius: '0.875rem',
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(34,85,14,0.14)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'rgba(34,85,14,0.8)',
          boxShadow: '0 4px 14px rgba(34,85,14,0.06)',
          animation: `nfFloat 6s ease-in-out ${f.delay} infinite`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>{f.label}</span>
      ))}

      <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '32rem' }}>
        <div style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: '8rem',
          fontWeight: 700,
          lineHeight: 1,
          background: 'linear-gradient(135deg, rgb(34,85,14), rgb(90,150,50))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        }}>404</div>

        <div style={{ fontSize: '4rem', margin: '0.5rem 0 1rem' }}>🎓</div>

        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: INK, marginBottom: '0.75rem' }}>
          Oops! This page skipped class
        </h1>
        <p style={{ color: MUTED, fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            background: GREEN,
            color: 'white',
            fontWeight: 700,
            fontSize: '0.9375rem',
            textDecoration: 'none',
          }}>Go to Dashboard →</Link>
          <Link href="/" style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            background: 'white',
            border: `1.5px solid ${GREEN}`,
            color: GREEN,
            fontWeight: 700,
            fontSize: '0.9375rem',
            textDecoration: 'none',
          }}>Go Home →</Link>
        </div>

        <p style={{ color: MUTED, fontSize: '0.8125rem', marginTop: '1.75rem' }}>
          Lost? Try searching from the dashboard.
        </p>
      </div>

      <style>{`@keyframes nfFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }`}</style>
    </div>
  )
}
