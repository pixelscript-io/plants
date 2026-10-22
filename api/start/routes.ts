/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { explorerThrottle, statusThrottle } from '#start/limiter'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router.get('/openapi.json', [controllers.Docs, 'spec'])
router.get('/docs', [controllers.Docs, 'ui'])

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
        router.post('verify-email', [controllers.EmailVerification, 'verify'])
        router.post('forgot-password', [controllers.PasswordReset, 'forgot'])
        router.post('reset-password', [controllers.PasswordReset, 'reset'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
        router.post('resend-verification', [controllers.EmailVerification, 'resend'])

        router.get('api-keys', [controllers.ApiKeys, 'index'])
        router.post('api-keys', [controllers.ApiKeys, 'store'])
        router.delete('api-keys/:id', [controllers.ApiKeys, 'destroy'])
        router.get('api-keys/:id/usage', [controllers.ApiKeys, 'usage'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    // Public health and status. No key needed.
    router.get('health', [controllers.Health, 'live'])
    router.get('health/ready', [controllers.Health, 'ready']).use(statusThrottle)
    router.get('status', [controllers.Status, 'show']).use(statusThrottle)

    // The dashboard's plant explorer: the same data as the public routes below,
    // authenticated by account token instead of API key, and limited per user.
    router
      .group(() => {
        router.get('plants', [controllers.Plants, 'index'])
        router.get('plants/:slug', [controllers.Plants, 'show'])
        router.get('calendar', [controllers.Calendar, 'show'])
      })
      .prefix('account')
      .as('explorer')
      .use([middleware.auth(), explorerThrottle])

    router
      .group(() => {
        router.get('/', [controllers.Plants, 'index'])
        router.get('/:slug', [controllers.Plants, 'show'])
      })
      .prefix('plants')
      .as('plants')
      .use(middleware.apiKey())

    router
      .group(() => {
        router.get('moon', [controllers.Moon, 'show'])
        router.get('moon/phases', [controllers.Moon, 'phases'])
        router.get('frost', [controllers.Frost, 'show'])
        router.get('hardiness', [controllers.Hardiness, 'show'])
        router.get('calendar', [controllers.Calendar, 'show'])
      })
      .as('climate')
      .use(middleware.apiKey())
  })
  .prefix('/api/v1')
