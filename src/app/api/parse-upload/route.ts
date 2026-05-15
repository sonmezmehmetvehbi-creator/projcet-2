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

    try {
      if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
        extractedText = await extractPPTX(buffer)
        // If PPTX extraction got very little text, fall back to vision
        if (extractedText.trim().length < 100) {
          extractedText = await extractWithVision(
            buffer,
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'PowerPoint presentation'
          )
        }
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        extractedText = await extractDocx(buffer)
        if (extractedText.trim().length < 50) {
          extractedText = await extractWithVision(buffer, 'application/msword', 'Word document')
        }
      } else if (fileName.endsWith('.txt')) {
        extractedText = buffer.toString('utf-8')
      } else if (
        fileName.endsWith('.pdf') ||
        fileType === 'application/pdf'
      ) {
        extractedText = await extractWithVision(buffer, 'application/pdf', 'PDF document')
      } else if (
        fileType.startsWith('image/') ||
        fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)
      ) {
        const mime = fileType || 'image/jpeg'
        extractedText = await extractWithVision(buffer, mime, 'image of notes')
      } else {
        // Unknown type — try vision as last resort
        extractedText = await extractWithVision(buffer, fileType || 'application/octet-stream', 'document')
      }
    } catch (innerErr: any) {
      console.error('Extraction error:', innerErr)
      return NextResponse.json({
        error: `Could not read this file: ${innerErr.message}. Try converting it to PDF or an image first.`
      }, { status: 400 })
    }

    if (!extractedText || extractedText.trim().length < 30) {
      return NextResponse.json({
        error: 'Could not extract enough text from this file. Try a PDF, image of your notes, or plain text file.'
      }, { status: 400 })
    }

    const truncated = extractedText.slice(0, 12000)
    return NextResponse.json({ text: truncated, fileName: file.name })

  } catch (error: any) {
    console.error('Parse upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to parse file' }, { status: 500 })
  }
}

async function extractWithVision(buffer: Buffer, mimeType: string, fileDescription: string): Promise<string> {
  const base64 = buffer.toString('base64')

  // For non-image types that vision might not support, convert description
  const supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const isImage = supportedImageTypes.includes(mimeType)

  if (!isImage) {
    // For PDFs and other docs, use text completion with base64 hint
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract ALL text content from this ${fileDescription}. Return only the raw text, preserving structure.`,
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

async function extractPPTX(buffer: Buffer): Promise<string> {
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
    const matches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? []
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
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(buffer)

  if (!zip.files['word/document.xml']) return ''

  const content = await zip.files['word/document.xml'].async('text')
  const matches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? []
  return matches
    .map(m => m.replace(/<[^>]+>/g, '').trim())
    .filter(t => t.length > 0)
    .join(' ')
}