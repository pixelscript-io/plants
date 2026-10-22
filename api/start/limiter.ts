/*
|--------------------------------------------------------------------------
| Rate limiting
|--------------------------------------------------------------------------
|
| Limits for API keys are applied in #middleware/api_key_middleware using the
| tiers in #config/api_tiers.
|
| `explorerThrottle` protects the account-authenticated routes the dashboard's
| plant explorer uses. They need no API key, so they are limited per signed-in
| user instead and are not counted as API key usage.
|
*/

import limiter from '@adonisjs/limiter/services/main'

// The status endpoints are public, so they are limited per IP address.
export const statusThrottle = limiter.define('status', (ctx) => {
  return limiter.allowRequests(60).every('1 minute').usingKey(`status_ip_${ctx.request.ip()}`)
})

export const explorerThrottle = limiter.define('explorer', (ctx) => {
  return limiter
    .allowRequests(120)
    .every('1 minute')
    .usingKey(`explorer_user_${ctx.auth.user?.id ?? ctx.request.ip()}`)
})
