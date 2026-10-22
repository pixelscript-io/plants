import type { ApiErrorItem, PageMetadata } from '~/types/api'

/** An error from the Plants API, with the server's field-level messages. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors: ApiErrorItem[] = []
  ) {
    super(message)
  }

  /** Message for a single form field, if the server flagged it. */
  fieldError(field: string) {
    return this.errors.find((error) => error.field === field)?.message
  }
}

/** Turns a failed $fetch into an ApiRequestError. */
export function toRequestError(error: any) {
  const status: number = error?.response?.status ?? 0
  const errors: ApiErrorItem[] = error?.data?.errors ?? []
  const message =
    status === 0
      ? 'Could not reach the server. Please check your connection.'
      : (errors[0]?.message ?? 'Something went wrong. Please try again.')
  return new ApiRequestError(message, status, errors)
}

/**
 * Calls the Plants API through the dashboard's own server (`/api/proxy`), which
 * adds the session's token. The browser never holds the token or talks to the
 * API directly. Failures throw ApiRequestError; a 401 means the session ended.
 */
export function useApi() {
  const { user, clearSession } = useAuth()

  async function send<R>(
    path: string,
    options: { method?: 'GET' | 'POST' | 'DELETE'; body?: Record<string, unknown>; query?: Record<string, unknown> } = {}
  ): Promise<R> {
    try {
      return await $fetch<R>(path, {
        baseURL: '/api/proxy',
        method: options.method ?? 'GET',
        body: options.body,
        query: options.query,
      })
    } catch (error: any) {
      const failure = toRequestError(error)
      if (failure.status === 401 && user.value) {
        // The session expired or was revoked.
        clearSession()
        await navigateTo('/login')
      }
      throw failure
    }
  }

  type Options = Parameters<typeof send>[1]

  /** A request whose result is wrapped in `{ data }`. */
  async function request<T>(path: string, options?: Options): Promise<T> {
    const response = await send<{ data: T } | null>(path, options)
    // 204 responses (revoking a key) have no body.
    return (response?.data ?? undefined) as T
  }

  /** A paginated list: `{ data, metadata }`. */
  const requestPage = <T>(path: string, options?: Options) => send<{ data: T[]; metadata: PageMetadata }>(path, options)

  return { request, requestPage }
}
