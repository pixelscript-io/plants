export default defineEventHandler(async (event) => {
  const wait = throttle(event, 'verify', 30, 60 * 60_000)
  if (wait) return tooManyRequests(event, wait)

  const { token } = (await readBody(event).catch(() => null)) ?? {}
  return reply(event, await callApi(event, 'auth/verify-email', { method: 'POST', body: { token } }))
})
