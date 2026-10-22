import type { User } from '~/types/api'

/**
 * Who is signed in.
 *
 * The API token lives in an httpOnly session cookie managed by the dashboard's
 * server (`/api/auth/*`). It is invisible to page scripts, so this composable
 * never sees it: it only knows the current user, which it asks the server for.
 */
export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const checked = useState('auth-checked', () => false)

  const isLoggedIn = computed(() => user.value !== null)

  /** Forget the user locally. The server clears the cookie. */
  function clearSession() {
    user.value = null
  }

  /** Asks the server whether there is a session. Checked once per page load. */
  async function ensureSession() {
    if (checked.value) return user.value
    try {
      user.value = (await $fetch<{ data: User }>('/api/auth/session')).data
    } catch {
      user.value = null
    } finally {
      checked.value = true
    }
    return user.value
  }

  /** Reloads the user from the server, for example after confirming an email in another tab. */
  async function refreshUser() {
    try {
      user.value = (await $fetch<{ data: User }>('/api/auth/session')).data
    } catch {
      /* keep what we have; a real session problem surfaces on the next request */
    }
    return user.value
  }

  async function authenticate(path: '/api/auth/login' | '/api/auth/signup', body: Record<string, unknown>) {
    try {
      user.value = (await $fetch<{ data: { user: User } }>(path, { method: 'POST', body })).data.user
      checked.value = true
    } catch (error) {
      throw toRequestError(error)
    }
  }

  const login = (email: string, password: string) => authenticate('/api/auth/login', { email, password })

  const signup = (input: { fullName: string; email: string; password: string; passwordConfirmation: string }) =>
    // The API requires fullName but accepts null.
    authenticate('/api/auth/signup', { ...input, fullName: input.fullName.trim() || null })

  async function logout() {
    try {
      // Revokes the token on the API and clears the cookie.
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      /* the server is unreachable: leave locally either way */
    }
    clearSession()
    await navigateTo('/login')
  }

  return { user, isLoggedIn, ensureSession, refreshUser, login, signup, logout, clearSession }
}
