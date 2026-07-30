'use client'

// ============================================================================
// TEMPORARY DIAGNOSTIC PAGE — delete once the Realtime issue is resolved.
// Route: /arena/forge-quiz/live/realtime-test
//
// Purpose: prove whether raw Supabase Realtime events propagate at all for
// forge_quiz_live_players, independent of any app logic / filters / API routes.
//
// FINDINGS (checked against the codebase — see the on-page results too):
//
// 1. ANON KEY: YES — the browser client (src/lib/supabase.ts, createClient())
//    is built with createBrowserClient(NEXT_PUBLIC_SUPABASE_URL,
//    NEXT_PUBLIC_SUPABASE_ANON_KEY). This is the correct anon-key client for
//    Realtime. Realtime does NOT work through the service-role client (that
//    lives only in API routes via createClient(@supabase/supabase-js) and is
//    never shipped to the browser). So the key itself is not the problem — this
//    page uses the very same createClient() the real live pages use.
//
// 2. RLS: cannot be read from client code — it is a DB-side setting. This page
//    probes it empirically: it runs a plain anon-key SELECT on all three tables
//    and reports the outcome on the page.
//      • rows returned            → RLS is off OR a permissive SELECT policy
//                                   exists → Realtime SHOULD deliver events.
//      • 0 rows + NO error        → RLS is ON with no permissive policy. This is
//                                   the classic silent-failure case: the
//                                   publication includes the table, subscribe()
//                                   still reports SUBSCRIBED, yet ZERO change
//                                   events are ever delivered to the client.
//                                   FIX: add a permissive policy, e.g.
//                                     ALTER TABLE forge_quiz_live_players ENABLE ROW LEVEL SECURITY;
//                                     CREATE POLICY "read_all" ON forge_quiz_live_players FOR SELECT USING (true);
//                                   (or DISABLE ROW LEVEL SECURITY for these
//                                   ephemeral game tables, as the schema
//                                   comments in submit-answer/route.ts suggest).
//      • error (e.g. permission)  → RLS on + policy denies; message shown.
//    Compare the SELECT result with whether the INSERT button below produces a
//    Realtime event: SUBSCRIBED + successful insert + NO event back == RLS
//    silently swallowing Realtime.
// ============================================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

// Diagnostic page — never prerender it (the browser client needs the runtime env).
export const dynamic = 'force-dynamic'

type EventLog = { at: string; kind: string; detail: string }

const TABLES = ['forge_quiz_live_players', 'forge_quiz_live_sessions', 'forge_quiz_live_answers'] as const

// Lazily create the browser client on the client only — calling createClient()
// during SSR/prerender throws because the public env vars aren't injected then.
let _client: ReturnType<typeof createClient> | null = null
function getClient() {
  if (!_client) _client = createClient()
  return _client
}

export default function RealtimeTestPage() {
  const [status, setStatus] = useState<string>('(subscribing…)')
  const [events, setEvents] = useState<EventLog[]>([])
  const [rls, setRls] = useState<Record<string, string>>({})
  const [inserting, setInserting] = useState(false)
  const [lastInsert, setLastInsert] = useState<string>('')

  const push = (kind: string, detail: string) =>
    setEvents((prev) => [{ at: new Date().toLocaleTimeString(), kind, detail }, ...prev].slice(0, 200))

  // Subscribe to forge_quiz_live_players with NO filter (all rows, all events).
  useEffect(() => {
    const supabase = getClient()
    const channel = supabase
      .channel('realtime-test-players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forge_quiz_live_players' }, (payload: any) => {
        const detail = JSON.stringify({ eventType: payload.eventType, new: payload.new, old: payload.old })
        console.log('[realtime-test] event:', payload)
        push(payload.eventType ?? 'CHANGE', detail)
      })
      .subscribe((s: string) => {
        console.log('[realtime-test] channel status:', s)
        setStatus(s)
      })
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Probe RLS on all three tables via a plain anon-key SELECT.
  useEffect(() => {
    const supabase = getClient()
    ;(async () => {
      for (const t of TABLES) {
        const { data, error } = await supabase.from(t).select('*').limit(1)
        let verdict: string
        if (error) verdict = `ERROR — ${error.message} (RLS likely ON + policy denies)`
        else if ((data?.length ?? 0) > 0) verdict = `OK — ${data!.length} row(s) readable (RLS off or permissive SELECT policy)`
        else verdict = '0 rows, NO error — table empty OR RLS ON with no permissive policy (Realtime would be silently blocked)'
        setRls((prev) => ({ ...prev, [t]: verdict }))
      }
    })()
  }, [])

  // Insert a dummy row DIRECTLY via the browser client (not an API route), so we
  // can watch whether the same client that inserted it receives the event back.
  async function insertDummy() {
    setInserting(true)
    setLastInsert('')
    const supabase = getClient()
    const row = {
      session_id: crypto.randomUUID(), // random — will trip a FK if one exists (that error is itself diagnostic)
      user_id: null,
      display_name: `Test ${Math.floor(Math.random() * 1000)}`,
      avatar_emoji: '🧪',
    }
    const { data, error } = await supabase.from('forge_quiz_live_players').insert(row).select('*')
    if (error) {
      setLastInsert(`INSERT failed: ${error.message}`)
      push('INSERT-FAILED', error.message)
    } else {
      setLastInsert(`INSERT ok: ${JSON.stringify(data)} — now watch for a Realtime event above`)
    }
    setInserting(false)
  }

  const statusColor =
    status === 'SUBSCRIBED' ? 'rgb(34,197,94)'
    : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED' ? 'rgb(239,68,68)'
    : 'rgb(251,191,36)'

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(10,10,20)', color: 'white', padding: '2rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Realtime Diagnostic — forge_quiz_live_players</h1>

      {/* Channel status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <span style={{ color: 'rgb(148,148,168)' }}>Channel status:</span>
        <span style={{ fontWeight: 900, fontSize: '1.25rem', color: statusColor, padding: '0.25rem 0.75rem', borderRadius: '0.5rem', border: `1px solid ${statusColor}`, background: `${statusColor}22` }}>
          {status}
        </span>
      </div>

      {/* RLS probe */}
      <div style={{ marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.75rem', padding: '1rem' }}>
        <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'rgb(196,181,253)' }}>RLS / anon-SELECT probe</div>
        {TABLES.map((t) => (
          <div key={t} style={{ fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
            <span style={{ color: 'rgb(148,148,168)' }}>{t}:</span>{' '}
            <span>{rls[t] ?? '(checking…)'}</span>
          </div>
        ))}
      </div>

      {/* Insert button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={insertDummy} disabled={inserting}
          style={{ height: '2.75rem', padding: '0 1.5rem', borderRadius: '0.5rem', border: 'none', background: 'rgb(124,58,237)', color: 'white', fontWeight: 800, cursor: inserting ? 'default' : 'pointer', opacity: inserting ? 0.6 : 1 }}>
          {inserting ? 'Inserting…' : 'Insert dummy row via browser client'}
        </button>
        {lastInsert && <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'rgb(226,226,240)' }}>{lastInsert}</p>}
      </div>

      {/* Event log */}
      <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.75rem', overflow: 'hidden' }}>
        <div style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', fontWeight: 800 }}>
          Realtime events ({events.length})
        </div>
        <div style={{ maxHeight: '50vh', overflowY: 'auto', padding: '0.5rem 1rem' }}>
          {events.length === 0 ? (
            <p style={{ color: 'rgb(148,148,168)', fontSize: '0.8125rem', padding: '0.5rem 0' }}>No events yet…</p>
          ) : (
            events.map((e, i) => (
              <div key={i} style={{ padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem' }}>
                <span style={{ color: 'rgb(148,148,168)' }}>{e.at}</span>{' '}
                <span style={{ fontWeight: 800, color: 'rgb(74,222,128)' }}>{e.kind}</span>
                <div style={{ color: 'rgb(200,200,220)', wordBreak: 'break-all' }}>{e.detail}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
