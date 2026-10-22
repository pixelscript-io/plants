import type { H3Event } from 'h3'

interface Window {
  count: number
  resetAt: number
}

const windows = new Map<string, Window>()

/**
 * Best-effort per-IP limit for the login and signup routes, kept in memory.
 *
 * It slows scripted abuse from one address. It is not shared between server
 * instances and resets on restart, so it complements, and does not replace, the
 * API's own per-email lockout (which is the real defence against guessing).
 *
 * Returns the seconds to wait if the limit is exceeded, otherwise null.
 */
export function throttle(event: H3Event, name: string, max: number, windowMs: number): number | null {
  const { trustProxy } = useRuntimeConfig(event)
  const ip = getRequestIP(event, { xForwardedFor: Boolean(trustProxy) }) ?? 'unknown'
  const key = `${name}:${ip}`
  const now = Date.now()

  // Drop expired windows now and then so the map cannot grow without bound.
  if (windows.size > 5000) {
    for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k)
  }

  const current = windows.get(key)
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }
  current.count++
  return current.count > max ? Math.ceil((current.resetAt - now) / 1000) : null
}

/** Replies 429 in the API's error shape. */
export function tooManyRequests(event: H3Event, retryAfter: number) {
  setHeader(event, 'Retry-After', retryAfter)
  setHeader(event, 'Cache-Control', 'no-store')
  setResponseStatus(event, 429)
  return { errors: [{ message: 'Too many attempts. Please wait a moment and try again.', retryAfterSeconds: retryAfter }] }
}
