export default defineEventHandler(async (event) => {
  const wait = throttle(event, 'login', 20, 60_000)
  if (wait) return tooManyRequests(event, wait)

  const { email, password } = (await readBody(event).catch(() => null)) ?? {}
  const result = await callApi(event, 'auth/login', { method: 'POST', body: { email, password } })
  if (result.status !== 200) return reply(event, result)

  const { user, token } = result.body.data
  const session = await useAuthSession(event)
  // A fresh session on every login, so an old session id can never be reused.
  await session.clear()
  await session.update({ token })

  // The token stays on the server; the browser only learns who signed in.
  return reply(event, result, { data: { user } })
})
