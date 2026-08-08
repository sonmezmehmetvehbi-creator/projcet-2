import JoinLiveClient from './JoinLiveClient'

// Public code-entry page — anyone with a room code can join a live game without
// an account (guests identify via a client-side guest_id downstream).
export default async function LiveJoinPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)' }}>
      <JoinLiveClient />
    </div>
  )
}
