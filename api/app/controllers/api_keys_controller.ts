import ApiKey from '#models/api_key'
import ApiUsage from '#models/api_usage'
import ApiKeyTransformer from '#transformers/api_key_transformer'
import { apiKeyUsageValidator, createApiKeyValidator } from '#validators/api_key'
import { tierFor } from '#config/api_tiers'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class ApiKeysController {
  async index({ auth, serialize }: HttpContext) {
    const keys = await ApiKey.query()
      .where('userId', auth.getUserOrFail().id)
      .whereNull('revokedAt')
      .orderBy('createdAt', 'desc')
    return serialize(ApiKeyTransformer.transform(keys))
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    // Keys are only for confirmed addresses: this is what makes verification
    // worth doing, and it stops throwaway accounts from minting keys in bulk.
    if (!user.emailVerifiedAt) {
      return response.forbidden({
        errors: [{ message: 'Confirm your email address to create API keys.', code: 'EMAIL_NOT_VERIFIED' }],
      })
    }

    const { name } = await request.validateUsing(createApiKeyValidator)

    // The key limit follows the best tier among the user's active keys.
    const active = await ApiKey.query().where('userId', user.id).whereNull('revokedAt')
    const maxKeys = Math.max(...active.map((key) => tierFor(key.tier).maxKeys), tierFor('free').maxKeys)
    if (active.length >= maxKeys) {
      return response.unprocessableEntity({
        errors: [{ message: `You can have at most ${maxKeys} active API keys. Revoke one first.` }],
      })
    }

    const { apiKey, rawKey } = await ApiKey.issue(user, name)
    return serialize({
      apiKey: ApiKeyTransformer.transform(apiKey),
      // Shown once. Only a hash is stored, so it cannot be retrieved again.
      key: rawKey,
    })
  }

  async destroy({ auth, params, response }: HttpContext) {
    const apiKey = await ApiKey.query()
      .where('id', params.id)
      .where('userId', auth.getUserOrFail().id)
      .whereNull('revokedAt')
      .firstOrFail()

    apiKey.revokedAt = DateTime.now()
    await apiKey.save()
    return response.noContent()
  }

  async usage({ auth, params, request, serialize }: HttpContext) {
    const { days = 30 } = await request.validateUsing(apiKeyUsageValidator, { data: request.qs() })
    const apiKey = await ApiKey.query()
      .where('id', params.id)
      .where('userId', auth.getUserOrFail().id)
      .firstOrFail()

    const today = new Date()
    const from = new Date(today)
    from.setUTCDate(from.getUTCDate() - (days - 1))

    const rows = await ApiUsage.query()
      .where('apiKeyId', apiKey.id)
      .where('day', '>=', ApiUsage.dayKey(from))
      .orderBy('day')
    const byDay = new Map(rows.map((row) => [row.day, row]))

    // One entry per day, including days with no traffic.
    const series = Array.from({ length: days }, (_, index) => {
      const date = new Date(from)
      date.setUTCDate(from.getUTCDate() + index)
      const day = ApiUsage.dayKey(date)
      const row = byDay.get(day)
      return {
        day,
        requests: row?.requests ?? 0,
        errors: row?.errors ?? 0,
        rateLimited: row?.rateLimited ?? 0,
      }
    })

    const totals = series.reduce(
      (sum, entry) => ({
        requests: sum.requests + entry.requests,
        errors: sum.errors + entry.errors,
        rateLimited: sum.rateLimited + entry.rateLimited,
      }),
      { requests: 0, errors: 0, rateLimited: 0 }
    )

    return serialize({
      apiKey: ApiKeyTransformer.transform(apiKey),
      days,
      totals,
      series,
    })
  }
}
