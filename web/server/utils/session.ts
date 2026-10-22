import type { H3Event } from 'h3'

export interface SessionData {
  /** The Plants API access token. It never leaves the server. */
  token?: string
}

/** Matches the API's token lifetime (see User.accessTokens in the API). */
export const SESSION_SECONDS = 60 * 60 * 24 * 7

// Used only in development, so a fresh checkout works without setup. Production
// refuses to start without a real secret (see server/plugins/check-config.ts).
const DEV_PASSWORD = 'dev-only-session-password-change-me-0123456789'

/**
 * The signed-in user's session.
 *
 * It is stored in a sealed (encrypted and tamper-proof) cookie that is httpOnly,
 * so page scripts cannot read it, and SameSite=Lax, so other sites cannot make
 * the browser send it on a cross-site POST. When served over HTTPS the cookie is
 * also Secure and uses the `__Host-` prefix, which pins it to this exact origin.
 */
export function useAuthSession(event: H3Event) {
  const config = useRuntimeConfig(event)
  const secure = Boolean(config.cookieSecure)

  const password = config.sessionPassword || (import.meta.dev ? DEV_PASSWORD : '')
  if (!password) {
    throw createError({ statusCode: 500, statusMessage: 'Server is not configured: set NUXT_SESSION_PASSWORD' })
  }

  return useSession<SessionData>(event, {
    name: cookieName(secure),
    password,
    maxAge: SESSION_SECONDS,
    cookie: cookieOptions(secure),
  })
}

const cookieName = (secure: boolean) => (secure ? '__Host-plants_session' : 'plants_session')
const cookieOptions = (secure: boolean) => ({ httpOnly: true, secure, sameSite: 'lax' as const, path: '/' })

/**
 * Ends the session: forgets the data and tells the browser to delete the cookie.
 * Clearing alone would leave an empty cookie behind until the browser closed.
 */
export async function endSession(event: H3Event) {
  const secure = Boolean(useRuntimeConfig(event).cookieSecure)
  await (await useAuthSession(event)).clear()
  // Same name and attributes as when it was set, or the browser keeps the old one.
  deleteCookie(event, cookieName(secure), cookieOptions(secure))
}

/** The API token for this request, if the visitor is signed in. */
export async function getApiToken(event: H3Event) {
  return (await useAuthSession(event)).data.token ?? null
}
