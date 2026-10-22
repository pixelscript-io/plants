/**
 * Cleans up after the old design, where the API token sat in a cookie called
 * `plants_token` that page scripts could read.
 *
 * Anyone who signed in before the upgrade still has that cookie. Because script
 * could read it, the token is treated as exposed: it is revoked on the API and
 * the cookie is deleted, so the visitor simply signs in again (and gets a safe
 * httpOnly session). Once no one has the old cookie, this file can be removed.
 */
const LEGACY_COOKIE = 'plants_token'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, LEGACY_COOKIE)
  if (!token) return

  deleteCookie(event, LEGACY_COOKIE, { path: '/' })
  await callApi(event, 'account/logout', { method: 'POST', token })
})
