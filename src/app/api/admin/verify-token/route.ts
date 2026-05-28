
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const valid = token === process.env.ADMIN_INVITE_TOKEN
  return NextResponse.json({ valid })
}