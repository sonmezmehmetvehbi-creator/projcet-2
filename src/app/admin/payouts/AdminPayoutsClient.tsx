'use client'

import { useState } from 'react'

interface Payout {
  id: string
  tutor_name: string
  amount: number
  requested_at: string | null
  method: string
}

export default function AdminPayoutsClient({ payouts: initial }: { payouts: Payout[] }) {
  const [payouts, setPayouts] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  async function markPaid(payoutId: string) {
    if (!confirm('Mark this payout as paid?')) return
    setLoading(payoutId)
    try {
      const res = await fetch('/api/admin/mark-payout-paid', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPayouts(prev => prev.filter(p => p.id !== payoutId))
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoading(null)
  }

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100vh' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: 'rgb(26,26,20)', marginBottom: '0.25rem' }}>
          Payout Requests
        </h1>
        <p style={{ color: 'rgb(107,107,88)', marginBottom: '2rem' }}>{payouts.length} request{payouts.length !== 1 ? 's' : ''} awaiting payment</p>

        {payouts.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'rgb(107,107,88)' }}>
            No payout requests to process 🎉
          </div>
        ) : (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(34,85,14,0.04)' }}>
                    {['Tutor', 'Amount', 'Requested', 'Payout Method', ''].map(h => (
                      <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'rgb(107,107,88)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(34,85,14,0.08)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(34,85,14,0.06)' }}>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.9375rem', fontWeight: 600, color: 'rgb(26,26,20)' }}>{p.tutor_name}</td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.9375rem', fontWeight: 700, color: 'rgb(34,85,14)' }}>${(p.amount ?? 0).toFixed(2)}</td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'rgb(107,107,88)' }}>{p.requested_at ? new Date(p.requested_at).toLocaleString() : '—'}</td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'rgb(107,107,88)' }}>{p.method}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <button onClick={() => markPaid(p.id)} disabled={loading === p.id}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', background: 'rgb(34,85,14)', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {loading === p.id ? '…' : '✓ Mark as Paid'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
