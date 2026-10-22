import type ApiKey from '#models/api_key'
import { tierFor } from '#config/api_tiers'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ApiKeyTransformer extends BaseTransformer<ApiKey> {
  toObject() {
    const { perMinute, perDay } = tierFor(this.resource.tier)
    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'prefix',
        'tier',
        'lastUsedAt',
        'revokedAt',
        'createdAt',
      ]),
      limits: { perMinute, perDay },
    }
  }
}
