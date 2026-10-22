export default defineEventHandler(async (event) => {
  const wait = throttle(event, 'reset', 20, 60 * 60_000)
  if (wait) return tooManyRequests(event, wait)

  const { token, password, passwordConfirmation } = (await readBody(event).catch(() => null)) ?? {}
  const result = await callApi(event, 'auth/reset-password', {
    method: 'POST',
    body: { token, password, passwordConfirmation },
  })

  // The API signed this account out everywhere, so a session cookie in this
  // browser is now dead weight. Remove it rather than leave it to fail later.
  if (result.status === 200) await endSession(event)

  return reply(event, result)
})
