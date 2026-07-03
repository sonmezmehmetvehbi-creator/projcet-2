// Shared helper for enforcing feature bans stored in the user_bans table.
//
// The admin panel stores ban_type as a key ('generation_ban'), but bans may
// also have been written with the human label ('Generation Ban'). We match
// both forms so enforcement can't silently miss a stored ban.
//
// A ban is considered active when is_active = true AND either:
//   - is_permanent = true, OR
//   - expires_at is in the future.

type AnyClient = {
  from: (table: string) => any
}

export type BanFeature = 'generation' | 'support' | 'tutoring' | 'full_account'

const BAN_TYPE_ALIASES: Record<BanFeature, string[]> = {
  generation: ['generation_ban', 'Generation Ban'],
  support: ['support_ban', 'Support Ban'],
  tutoring: ['tutoring_ban', 'Tutoring Ban'],
  full_account: ['full_account_ban', 'Full Account Ban'],
}

export interface ActiveBan {
  id: string
  reason: string | null
  expires_at: string | null
  is_permanent: boolean
}

// Returns the active ban for a feature, or null. Never throws — a missing
// user_bans table (before migration) resolves to null.
export async function getActiveBan(
  adminClient: AnyClient,
  userId: string,
  feature: BanFeature,
): Promise<ActiveBan | null> {
  try {
    const { data } = await adminClient
      .from('user_bans')
      .select('id, reason, expires_at, is_permanent')
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('ban_type', BAN_TYPE_ALIASES[feature])

    if (!data || data.length === 0) return null
    const now = Date.now()
    const active = (data as ActiveBan[]).find(
      b => b.is_permanent || (b.expires_at != null && new Date(b.expires_at).getTime() > now),
    )
    return active ?? null
  } catch {
    return null
  }
}
