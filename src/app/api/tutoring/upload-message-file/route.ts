import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const ext = file.name.split('.').pop()
    const fileName = `messages/${Date.now()}_${user.id}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error } = await adminClient.storage
      .from('tutor-docs')
      .upload(fileName, buffer, { contentType: file.type })

    if (error) throw error

    const { data } = adminClient.storage.from('tutor-docs').getPublicUrl(fileName)
    return NextResponse.json({ url: data.publicUrl, name: file.name })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
