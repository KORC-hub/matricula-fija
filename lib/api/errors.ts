import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { ApiError } from './contracts'

export class ApiRouteError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiRouteError'
  }
}

export async function readValidatedJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    throw new ApiRouteError('INVALID_REQUEST', 'Envía una solicitud JSON válida.', 400)
  }

  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    const hasTimeError = parsed.error.issues.some((issue) => issue.path.includes('blocks') || issue.path.includes('dayPreferences'))
    const message = parsed.error.issues[0]?.message ?? 'Revisa los datos enviados.'
    throw new ApiRouteError(hasTimeError ? 'INVALID_TIME_BLOCK' : 'INVALID_REQUEST', message, 400)
  }

  return parsed.data
}

export function apiErrorResponse(error: unknown): NextResponse<ApiError> {
  if (error instanceof ApiRouteError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status })
  }

  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado. Inténtalo de nuevo.' } },
    { status: 500 },
  )
}

export function catalogItemNotFound(kind: 'materia' | 'grupo', id: string): ApiRouteError {
  return new ApiRouteError(
    'CATALOG_ITEM_NOT_FOUND',
    `No encontramos la ${kind} «${id}» en los datos de ejemplo.`,
    404,
  )
}

export function studentNotFound(id: string): ApiRouteError {
  return new ApiRouteError(
    'STUDENT_NOT_FOUND',
    `No encontramos el expediente del estudiante «${id}» en los datos de ejemplo.`,
    404,
  )
}

export function inconsistentPlan(message: string): ApiRouteError {
  return new ApiRouteError('INCONSISTENT_PLAN', message, 409)
}
