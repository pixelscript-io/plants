export default defineEventHandler(async (event) => {
  // Per IP address; the API separately limits emails sent to any one address.
  const wait = throttle(event, 'forgot', 10, 60 * 60_000)
  if (wait) return tooManyRequests(event, wait)

  const { email } = (await readBody(event).catch(() => null)) ?? {}
  // The API answers the same way whether or not the account exists. Pass it on untouched.
  return reply(event, await callApi(event, 'auth/forgot-password', { method: 'POST', body: { email } }))
})
