export default defineEventHandler(async (event) => {
  const session = await useAuthSession(event)
  const token = session.data.token

  // Revoke the token on the API, so a copy of the cookie is useless afterwards.
  // Best effort: the cookie is cleared even if the API cannot be reached.
  if (token) await callApi(event, 'account/logout', { method: 'POST', token })

  await endSession(event)
  setHeader(event, 'Cache-Control', 'no-store')
  return { data: { ok: true } }
})
