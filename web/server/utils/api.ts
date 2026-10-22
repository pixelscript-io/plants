import type { H3Event } from 'h3'

export interface ApiResult {
  status: number
  body: any
  retryAfter: string | null
}

/**
 * Calls the Plants API from the server. Never throws for an HTTP error status:
 * the caller passes the API's answer (including its `{ errors: [...] }` body)
 * on to the browser unchanged, so the client sees the same shape as before.
 */
export async function callApi(
  event: H3Event,
  path: string,
  options: { method?: 'GET' | 'POST' | 'DELETE'; body?: unknown; query?: Record<string, any>; token?: string | null } = {}
): Promise<ApiResult> {
  const { apiUrl } = useRuntimeConfig(event)
  try {
    const response = await $fetch.raw(`${apiUrl}/${path}`, {
      method: options.method ?? 'GET',
      body: options.body as any,
      query: options.query,
      headers: options.token ? { Authorization: `Bearer ${options.token}` } : undefined,
      ignoreResponseError: true,
      retry: 0,
      timeout: 15_000,
    })
    return { status: response.status, body: response._data, retryAfter: response.headers.get('retry-after') }
  } catch {
    return { status: 502, body: { errors: [{ message: 'Could not reach the Plants API.' }] }, retryAfter: null }
  }
}

/** Sends an ApiResult to the browser. Account data must never be cached. */
export function reply(event: H3Event, result: ApiResult, body: unknown = result.body) {
  setHeader(event, 'Cache-Control', 'no-store')
  // The API sends seconds. (h3 types this header as a number.)
  if (Number(result.retryAfter) > 0) setHeader(event, 'Retry-After', Number(result.retryAfter))
  if (result.status === 204) return sendNoContent(event, 204)
  setResponseStatus(event, result.status)
  return body
}

export const unauthorized = (event: H3Event) =>
  reply(event, { status: 401, body: { errors: [{ message: 'Unauthorized access' }] }, retryAfter: null })
