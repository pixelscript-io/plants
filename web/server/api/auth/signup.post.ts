export default defineEventHandler(async (event) => {
  const wait = throttle(event, 'signup', 10, 60_000)
  if (wait) return tooManyRequests(event, wait)

  const { fullName, email, password, passwordConfirmation } = (await readBody(event).catch(() => null)) ?? {}
  const result = await callApi(event, 'auth/signup', {
    method: 'POST',
    body: { fullName, email, password, passwordConfirmation },
  })
  if (result.status !== 200) return reply(event, result)

  const { user, token } = result.body.data
  const session = await useAuthSession(event)
  await session.clear()
  await session.update({ token })

  return reply(event, result, { data: { user } })
})
