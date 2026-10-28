import type {
  CatalogResponse,
  CompatibilityRequest,
  CompatibilityResponse,
  PlanSuggestRequest,
  PlanSuggestResponse,
  PlanValidateRequest,
  PlanValidateResponse,
} from './contracts'
import type { ApiError } from './contracts'

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ApiClientError('INVALID_RESPONSE', 'El servidor devolvió una respuesta que no entendemos.', response.status)
  }

  if (!response.ok) {
    const error = payload as ApiError
    throw new ApiClientError(
      error.error?.code ?? 'INTERNAL_ERROR',
      error.error?.message ?? 'No pudimos completar la solicitud.',
      response.status,
    )
  }

  return payload as T
}

export function getCatalog(): Promise<CatalogResponse> {
  return request<CatalogResponse>('/api/catalog', { method: 'GET' })
}

export function getCompatibility(body: CompatibilityRequest): Promise<CompatibilityResponse> {
  return request<CompatibilityResponse>('/api/compatibility', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function validatePlan(body: PlanValidateRequest): Promise<PlanValidateResponse> {
  return request<PlanValidateResponse>('/api/plan/validate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function suggestPlan(body: PlanSuggestRequest): Promise<PlanSuggestResponse> {
  return request<PlanSuggestResponse>('/api/plan/suggest', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
