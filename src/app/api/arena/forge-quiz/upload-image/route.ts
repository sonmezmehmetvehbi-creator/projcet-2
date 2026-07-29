import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Uploads a question image to the public 'quiz-images' bucket.
// In Supabase: create a public storage bucket named 'quiz-images'.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG or PNG images are allowed' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5MB' }, { status: 400 })

    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const fileName = `${user.id}/${Date.now()}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error } = await adminClient.storage
      .from('quiz-images')
      .upload(fileName, buffer, { contentType: file.type })
    if (error) throw error

    const { data } = adminClient.storage.from('quiz-images').getPublicUrl(fileName)
    return NextResponse.json({ url: data.publicUrl })
  } catch (error: any) {
    console.error('Forge quiz upload-image error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
