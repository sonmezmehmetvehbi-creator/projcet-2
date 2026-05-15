import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = file.name.toLowerCase()
    const fileType = file.type

    let extractedText = ''

    if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
      extractedText = await extractPPTX(buffer)
    } else if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      extractedText = await extractWithVision(buffer, 'application/pdf', 'PDF document')
    } else if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) {
      extractedText = await extractWithVision(buffer, fileType || 'image/jpeg', 'image')
    } else if (fileName.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8')
    } else if (fileName.endsWith('.docx')) {
      extractedText = await extractDocx(buffer)
    } else {
      // Try vision as fallback for unknown types
      extractedText = await extractWithVision(buffer, fileType || 'application/octet-stream', 'document')
    }

    if (!extractedText || extractedText.trim().length < 30) {
      return NextResponse.json({
        error: 'Could not extract enough text from this file. Try a PDF, image, or PowerPoint file.',
      }, { status: 400 })
    }

    // Truncate to ~12000 chars to stay within token limits
    const truncated = extractedText.slice(0, 12000)
    return NextResponse.json({ text: truncated, fileName: file.name })

  } catch (error: any) {
    console.error('Parse upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to parse file' }, { status: 500 })
  }
}

// Use OpenAI vision to extract text from images and PDFs
async function extractWithVision(buffer: Buffer, mimeType: string, fileDescription: string): Promise<string> {
  const base64 = buffer.toString('base64')
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract ALL text content from this ${fileDescription}. Return only the raw text, preserving structure (headings, bullets, paragraphs). Include everything you can read.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
    max_tokens: 4000,
  })
  return response.choices[0].message.content ?? ''
}

// Extract text from PPTX by unzipping and reading slide XML
async function extractPPTX(buffer: Buffer): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(buffer)
    const texts: string[] = []

    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] ?? '0')
        const numB = parseInt(b.match(/\d+/)?.[0] ?? '0')
        return numA - numB
      })

    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async('text')
      const matches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) ?? []
      const slideText = matches
        .map(m => m.replace(/<[^>]+>/g, '').trim())
        .filter(t => t.length > 0)
        .join(' ')
      if (slideText.trim()) {
        const slideNum = slideFile.match(/\d+/)?.[0]
        texts.push(`[Slide ${slideNum}] ${slideText}`)
      }
    }

    return texts.join('\n\n')
  } catch (err) {
    console.error('PPTX extraction error:', err)
    return ''
  }
}

// Extract text from DOCX
async function extractDocx(buffer: Buffer): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(buffer)

    if (!zip.files['word/document.xml']) return ''

    const content = await zip.files['word/document.xml'].async('text')
    const matches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) ?? []
    return matches
      .map(m => m.replace(/<[^>]+>/g, '').trim())
      .filter(t => t.length > 0)
      .join(' ')
  } catch (err) {
    console.error('DOCX extraction error:', err)
    return ''
  }
}