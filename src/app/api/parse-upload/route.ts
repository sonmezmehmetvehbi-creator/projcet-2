import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 60

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
      if (fileName.endsWith('.txt')) {
        // Plain text — just read it
        extractedText = buffer.toString('utf-8')

      } else if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
        // Extract text from PPTX XML
        extractedText = await extractPPTX(buffer)
        if (extractedText.trim().length < 50) {
          return NextResponse.json({
            error: 'Could not extract text from this PowerPoint. Try saving it as PDF first, then uploading the PDF.'
          }, { status: 400 })
        }

      } else if (fileName.endsWith('.docx')) {
        // Extract text from DOCX XML
        extractedText = await extractDocx(buffer)
        if (extractedText.trim().length < 50) {
          return NextResponse.json({
            error: 'Could not extract text from this Word document. Try copying and pasting your notes as a .txt file.'
          }, { status: 400 })
        }

      } else if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
        // Use OpenAI file API for PDFs
        extractedText = await extractPDFWithOpenAI(buffer, file.name)

      } else if (
        fileType.startsWith('image/') ||
        fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)
      ) {
        // Images — use vision
        const mime = fileType || 'image/jpeg'
        extractedText = await extractImageWithVision(buffer, mime)

      } else {
        return NextResponse.json({
          error: 'Unsupported file type. Please upload a PDF, image (PNG/JPG), PowerPoint, Word doc, or text file.'
        }, { status: 400 })
      }

    } catch (innerErr: any) {
      console.error('Extraction error:', innerErr.message)
      return NextResponse.json({
        error: `Could not read this file: ${innerErr.message}`
      }, { status: 400 })
    }

    if (!extractedText || extractedText.trim().length < 30) {
      return NextResponse.json({
        error: 'Could not extract enough text from this file. Make sure the file contains readable text.'
      }, { status: 400 })
    }

    const truncated = extractedText.slice(0, 12000)
    return NextResponse.json({ text: truncated, fileName: file.name })

  } catch (error: any) {
    console.error('Parse upload error:', error.message)
    return NextResponse.json({ error: error.message || 'Failed to parse file' }, { status: 500 })
  }
}

// PDF — use OpenAI Assistants file upload API
async function extractPDFWithOpenAI(buffer: Buffer, fileName: string): Promise<string> {
  console.log('Starting PDF extraction, buffer size:', buffer.length)
  
  const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' })
  const file = new File([blob], fileName, { type: 'application/pdf' })

  const uploaded = await openai.files.create({
    file,
    purpose: 'assistants',
  })

  // Use a completion with file content
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract ALL text content from this PDF. Return only the raw text preserving structure.',
          },
          {
            // @ts-ignore
            type: 'file',
            file: { file_id: uploaded.id },
          },
        ],
      },
    ],
    max_tokens: 4000,
  })

  // Clean up uploaded file
  await openai.files.del(uploaded.id).catch(() => {})

  return response.choices[0].message.content ?? ''
}

// Images — OpenAI vision
async function extractImageWithVision(buffer: Buffer, mimeType: string): Promise<string> {
  const base64 = buffer.toString('base64')
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract ALL text content from this image. This may be a photo of handwritten notes, a textbook page, or lecture slides. Return only the raw text content, preserving structure.',
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

// PPTX — extract text from slide XML
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

// DOCX — extract text from document XML
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