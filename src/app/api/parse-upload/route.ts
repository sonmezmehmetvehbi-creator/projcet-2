import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileType = file.type
    const fileName = file.name.toLowerCase()

    let extractedText = ''

    // PDF
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      extractedText = await extractPDF(buffer)
    }
    // Images — send directly to OpenAI vision
    else if (fileType.startsWith('image/')) {
      const base64 = buffer.toString('base64')
      extractedText = await extractImageText(base64, fileType)
    }
    // PPTX — use mammoth-like approach or extract as zip
    else if (fileName.endsWith('.pptx')) {
      extractedText = await extractPPTX(buffer)
    }
    else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json({ error: 'Could not extract enough text from this file. Please try a different file.' }, { status: 400 })
    }

    // Truncate to avoid token limits (~12000 chars ≈ 3000 tokens)
    const truncated = extractedText.slice(0, 12000)

    return NextResponse.json({ text: truncated, fileName: file.name })
  } catch (error: any) {
    console.error('Parse upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to parse file' }, { status: 500 })
  }
}

async function extractPDF(buffer: Buffer): Promise<string> {
  // Use OpenAI to extract — send as base64
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const base64 = buffer.toString('base64')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract ALL text content from this PDF document. Return only the raw text, preserving structure. Include everything — headings, body text, bullet points, tables.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:application/pdf;base64,${base64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 4000,
  })

  return response.choices[0].message.content ?? ''
}

async function extractImageText(base64: string, mimeType: string): Promise<string> {
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract ALL text content from this image. This may be a photo of handwritten notes, a textbook page, or lecture slides. Return only the raw text content, preserving structure as much as possible.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 4000,
  })

  return response.choices[0].message.content ?? ''
}

async function extractPPTX(buffer: Buffer): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(buffer)
    const texts: string[] = []

    // Extract text from each slide XML
    const slideFiles = Object.keys(zip.files).filter(
      name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    ).sort()

    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async('text')
      // Extract text between <a:t> tags
      const matches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) ?? []
      const slideText = matches
        .map(m => m.replace(/<[^>]+>/g, ''))
        .join(' ')
      if (slideText.trim()) texts.push(slideText)
    }

    return texts.join('\n\n')
  } catch {
    return ''
  }
}