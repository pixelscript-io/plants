import { ApiUsageSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import db from '@adonisjs/lucid/services/db'
import ApiKey from '#models/api_key'

export default class ApiUsage extends ApiUsageSchema {
  static table = 'api_usage'

  @belongsTo(() => ApiKey)
  declare apiKey: BelongsTo<typeof ApiKey>

  /** UTC calendar day as YYYY-MM-DD. */
  static dayKey(date = new Date()) {
    return date.toISOString().slice(0, 10)
  }

  /**
   * Adds to today's counters for a key in a single atomic upsert.
   */
  static async record(
    apiKeyId: number,
    counts: { requests?: number; errors?: number; rateLimited?: number }
  ) {
    const { requests = 0, errors = 0, rateLimited = 0 } = counts
    await db.rawQuery(
      `insert into api_usage (api_key_id, day, requests, errors, rate_limited)
       values (?, ?, ?, ?, ?)
       on conflict (api_key_id, day) do update set
         requests = api_usage.requests + excluded.requests,
         errors = api_usage.errors + excluded.errors,
         rate_limited = api_usage.rate_limited + excluded.rate_limited`,
      [apiKeyId, ApiUsage.dayKey(), requests, errors, rateLimited]
    )
  }
}
