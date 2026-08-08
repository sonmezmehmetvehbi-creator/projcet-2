import JoinByCodeClient from './JoinByCodeClient'

// Standalone, guest-accessible join-by-code entry point. Intentionally has NO
// auth gate (the Arena hub at /arena stays auth-required) — anyone with a room
// code can land here directly from a shared link and jump into a Live Host game
// or a Self-Paced Room without an account. Works identically for signed-in users.
export default function ArenaJoinPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <JoinByCodeClient />
    </div>
  )
}
