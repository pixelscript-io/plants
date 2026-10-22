const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * CSRF defence for every state-changing request to our own API routes.
 *
 * The session cookie is already SameSite=Lax, which stops browsers attaching it
 * to cross-site POSTs. This adds a second, independent check: a request that
 * declares itself cross-site, or whose Origin is not this site, is refused.
 *
 * Requests with neither header (curl, server-to-server) are not browsers acting
 * for a signed-in victim, so they pass; they have no cookie to abuse.
 */
export default defineEventHandler((event) => {
  if (SAFE_METHODS.has(event.method) || !event.path.startsWith('/api/')) return

  const forbidden = () => {
    setResponseStatus(event, 403)
    return { errors: [{ message: 'Cross-site requests are not allowed.' }] }
  }

  if (getHeader(event, 'sec-fetch-site') === 'cross-site') return forbidden()

  const origin = getHeader(event, 'origin')
  if (origin) {
    const { trustProxy } = useRuntimeConfig(event)
    const host = getRequestHost(event, { xForwardedHost: Boolean(trustProxy) })
    try {
      if (new URL(origin).host !== host) return forbidden()
    } catch {
      return forbidden()
    }
  }
})
