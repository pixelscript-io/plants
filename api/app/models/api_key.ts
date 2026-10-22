import { ApiKeySchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { createHash, randomBytes } from 'node:crypto'
import ApiUsage from '#models/api_usage'
import User from '#models/user'

export default class ApiKey extends ApiKeySchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => ApiUsage)
  declare usage: HasMany<typeof ApiUsage>

  get isRevoked() {
    return this.revokedAt !== null
  }

  static hash(rawKey: string) {
    return createHash('sha256').update(rawKey).digest('hex')
  }

  /**
   * Creates a key for a user. The raw key is returned once and only its hash
   * is stored.
   */
  static async issue(user: User, name: string) {
    const rawKey = `pk_live_${randomBytes(24).toString('base64url')}`
    const apiKey = await ApiKey.create({
      userId: user.id,
      name,
      prefix: rawKey.slice(0, 12),
      keyHash: ApiKey.hash(rawKey),
    })
    // Load database defaults such as the tier.
    await apiKey.refresh()
    return { apiKey, rawKey }
  }
}
