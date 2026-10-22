// Fail fast at startup if the session secret is missing, so a production server
// can never run with a guessable one.
export default defineNitroPlugin(() => {
  const { sessionPassword } = useRuntimeConfig()

  if (import.meta.dev) {
    if (!sessionPassword) {
      console.warn('[auth] NUXT_SESSION_PASSWORD is not set: using an insecure development secret.')
    }
    return
  }

  if (!sessionPassword || sessionPassword.length < 32) {
    throw new Error('NUXT_SESSION_PASSWORD must be set to a random string of at least 32 characters.')
  }
})
