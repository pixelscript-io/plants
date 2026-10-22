/**
 * Who is signed in? The browser cannot read the httpOnly cookie, so this is how
 * the app finds out whether a session exists, and for whom.
 */
export default defineEventHandler(async (event) => {
  const session = await useAuthSession(event)
  const token = session.data.token
  if (!token) return unauthorized(event)

  const result = await callApi(event, 'account/profile', { token })
  if (result.status === 401) {
    // Expired or revoked on the API: forget it here too.
    await endSession(event)
    return reply(event, result)
  }
  return reply(event, result)
})
