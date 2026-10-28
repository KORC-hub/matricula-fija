import { NextResponse } from 'next/server'
import { catalog } from '@/data/catalog'
import { apiErrorResponse } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'

export function GET() {
  try {
    return NextResponse.json(catalog)
  } catch (error) {
    return apiErrorResponse(error)
  }
}
