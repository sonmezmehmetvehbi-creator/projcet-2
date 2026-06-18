import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// SQL — add to tutor_profiles (run manually in Supabase):
//   ALTER TABLE tutor_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
// Also create a public storage bucket named 'avatars'.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: tutorProfile } = await adminClient
      .from('tutor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!tutorProfile) return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG and PNG images are allowed' }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 })
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const path = `tutor-avatars/${tutorProfile.id}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await adminClient.storage
      .from('avatars')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) throw uploadError

    const { data: pub } = adminClient.storage.from('avatars').getPublicUrl(path)
    // Cache-bust so the new image shows immediately after re-upload.
    const publicUrl = `${pub.publicUrl}?t=${Date.now()}`

    await adminClient
      .from('tutor_profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', tutorProfile.id)

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
