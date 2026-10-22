import ApiKey from '#models/api_key'
import ApiUsage from '#models/api_usage'
import { tierFor } from '#config/api_tiers'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import limiter from '@adonisjs/limiter/services/main'
import { errors as limiterErrors } from '@adonisjs/limiter'
import { DateTime } from 'luxon'

const LAST_USED_REFRESH_SECONDS = 60

/**
 * Authenticates a request by its X-API-Key header, enforces the per-minute and
 * per-day limits of the key's tier, and records usage.
 */
export default class ApiKeyMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const rawKey = request.header('x-api-key')
    if (!rawKey) {
      return response.unauthorized({
        errors: [{ message: 'Missing API key. Send it in the X-API-Key header.' }],
      })
    }

    const apiKey = await ApiKey.query()
      .where('keyHash', ApiKey.hash(rawKey))
      .whereNull('revokedAt')
      .first()
    if (!apiKey) {
      return response.unauthorized({ errors: [{ message: 'Invalid or revoked API key.' }] })
    }

    const tier = tierFor(apiKey.tier)
    const perMinute = limiter.use({ requests: tier.perMinute, duration: '1 minute' })
    const perDay = limiter.use({ requests: tier.perDay, duration: '1 day' })

    let minute
    let day
    try {
      minute = await perMinute.consume(`key:${apiKey.id}:minute`)
      day = await perDay.consume(`key:${apiKey.id}:day`)
    } catch (error) {
      if (!(error instanceof limiterErrors.E_TOO_MANY_REQUESTS)) throw error
      await ApiUsage.record(apiKey.id, { rateLimited: 1 })
      const { limit, availableIn } = error.response
      response.header('Retry-After', String(availableIn))
      return response.tooManyRequests({
        errors: [
          {
            message:
              limit === tier.perDay
                ? `Daily limit of ${limit} requests reached.`
                : `Rate limit of ${limit} requests per minute reached.`,
            retryAfterSeconds: availableIn,
          },
        ],
      })
    }

    response.header('X-RateLimit-Limit', String(minute.limit))
    response.header('X-RateLimit-Remaining', String(minute.remaining))
    response.header('X-RateLimit-Reset', String(minute.availableIn))
    response.header('X-RateLimit-Daily-Limit', String(day.limit))
    response.header('X-RateLimit-Daily-Remaining', String(day.remaining))

    let failed = false
    try {
      await next()
    } catch (error) {
      failed = true
      throw error
    } finally {
      failed ||= response.getStatus() >= 400
      await ApiUsage.record(apiKey.id, { requests: 1, errors: failed ? 1 : 0 })
      await this.touch(apiKey)
    }
  }

  /** Refreshes last_used_at at most once a minute to avoid a write per request. */
  private async touch(apiKey: ApiKey) {
    const now = DateTime.now()
    if (apiKey.lastUsedAt && now.diff(apiKey.lastUsedAt, 'seconds').seconds < LAST_USED_REFRESH_SECONDS) {
      return
    }
    apiKey.lastUsedAt = now
    await apiKey.save()
  }
}
