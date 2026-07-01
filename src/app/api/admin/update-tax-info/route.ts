import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Tax info collection for 1099 filing (Tax Info tab).
// Run once in Supabase SQL Editor:
// CREATE TABLE IF NOT EXISTS tutor_tax_info (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, tutor_id uuid REFERENCES tutor_profiles(id) UNIQUE, legal_name text, email text, phone text, address_line1 text, address_line2 text, city text, state text, zip text, country text DEFAULT 'US', business_name text, tax_entity_type text DEFAULT 'individual', w9_collected boolean DEFAULT false, w9_collected_date timestamptz, notes text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
// ALTER TABLE tutor_tax_info DISABLE ROW LEVEL SECURITY;

async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return {
    adminClient: createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    ),
  }
}

// POST — save the full tax info form (upsert by tutor_id).
export async function POST(request: Request) {
  try {
    const { adminClient, error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { tutorId } = body
    if (!tutorId) return NextResponse.json({ error: 'Missing tutorId' }, { status: 400 })

    const w9Collected = !!body.w9_collected
    const row = {
      tutor_id: tutorId,
      legal_name: body.legal_name ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address_line1: body.address_line1 ?? null,
      address_line2: body.address_line2 ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      zip: body.zip ?? null,
      country: body.country || 'US',
      business_name: body.business_name ?? null,
      tax_entity_type: body.tax_entity_type || 'individual',
      w9_collected: w9Collected,
      w9_collected_date: w9Collected ? (body.w9_collected_date || new Date().toISOString()) : null,
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    }

    const { data, error: upsertErr } = await adminClient!
      .from('tutor_tax_info')
      .upsert(row, { onConflict: 'tutor_id' })
      .select()
      .single()

    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

    // Keep the tutor_profiles W-9 flag in sync so both tabs agree.
    await adminClient!.from('tutor_profiles').update({ w9_collected: w9Collected }).eq('id', tutorId)

    return NextResponse.json({ success: true, taxInfo: data })
  } catch (error: any) {
    console.error('update-tax-info POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH — toggle just the w9_collected flag.
export async function PATCH(request: Request) {
  try {
    const { adminClient, error } = await requireAdmin()
    if (error) return error

    const { tutorId, w9_collected } = await request.json()
    if (!tutorId) return NextResponse.json({ error: 'Missing tutorId' }, { status: 400 })

    const collected = !!w9_collected
    const { data, error: upsertErr } = await adminClient!
      .from('tutor_tax_info')
      .upsert(
        {
          tutor_id: tutorId,
          w9_collected: collected,
          w9_collected_date: collected ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tutor_id' }
      )
      .select()
      .single()

    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

    await adminClient!.from('tutor_profiles').update({ w9_collected: collected }).eq('id', tutorId)

    return NextResponse.json({ success: true, taxInfo: data })
  } catch (error: any) {
    console.error('update-tax-info PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
