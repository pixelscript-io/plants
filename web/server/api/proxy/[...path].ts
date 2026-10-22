/**
 * Forwards the dashboard's calls to the Plants API, adding the session's token
 * on the server so the browser never holds it.
 *
 * Only a short allow-list of API paths is reachable, and only the account routes
 * and the public status endpoint: not login, signup or the key-authenticated
 * data routes. Letters, digits, dashes, underscores and slashes only, so a path
 * cannot climb out with `..` or smuggle in a query string.
 */
const ALLOWED = /^(account\/[\w\-/]*|status)$/
// Logging out goes through /api/auth/logout, which also clears the cookie.
const BLOCKED = /^account\/logout$/

const METHODS = ['GET', 'POST', 'DELETE'] as const

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') ?? ''
  if (!ALLOWED.test(path) || BLOCKED.test(path)) {
    setResponseStatus(event, 404)
    return { errors: [{ message: 'Resource not found.' }] }
  }

  const method = event.method as (typeof METHODS)[number]
  if (!METHODS.includes(method)) {
    setResponseStatus(event, 405)
    return { errors: [{ message: 'Method not allowed.' }] }
  }

  const session = await useAuthSession(event)
  const token = session.data.token ?? null
  if (path.startsWith('account/') && !token) return unauthorized(event)

  const result = await callApi(event, path, {
    method,
    query: getQuery(event),
    body: method === 'GET' ? undefined : await readBody(event).catch(() => undefined),
    token,
  })

  // The API no longer accepts this token (expired or revoked): end the session.
  if (result.status === 401 && token) await endSession(event)

  return reply(event, result)
})
