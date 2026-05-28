
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 20MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const fileName = `session-files/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error } = await supabase.storage
      .from('tutor-docs')
      .upload(fileName, buffer, { contentType: file.type })

    if (error) throw error

    const { data } = supabase.storage.from('tutor-docs').getPublicUrl(fileName)

    return NextResponse.json({ url: data.publicUrl, name: file.name })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
