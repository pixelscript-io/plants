// Pages only for signed-out visitors; signed-in users are sent to the dashboard.
const GUEST_ONLY_PAGES = ['/login', '/signup']
// Pages anyone can see, signed in or not.
// The emailed-link pages must work whether or not someone is signed in on this device.
const OPEN_PAGES = ['/status', '/verify-email', '/reset-password', '/forgot-password']

// Sends signed-out visitors to the login page, and signed-in ones away from it.
export default defineNuxtRouteMiddleware(async (to) => {
  // The session cookie is httpOnly, so ask the server who (if anyone) is signed in.
  const user = await useAuth().ensureSession()

  if (OPEN_PAGES.includes(to.path)) return

  const isGuestOnly = GUEST_ONLY_PAGES.includes(to.path)
  if (!user) {
    return isGuestOnly ? undefined : navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
  if (isGuestOnly) return navigateTo('/')
})
