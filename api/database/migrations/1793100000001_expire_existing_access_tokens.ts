import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Access tokens now expire after 7 days (see User.accessTokens), but tokens
 * issued before that never did. Give every such token a 7-day expiry so a leaked
 * old token cannot stay valid forever. Anyone affected simply logs in again.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db
        .from('auth_access_tokens')
        .whereNull('expires_at')
        .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    })
  }

  async down() {
    // Expiry cannot be taken back off tokens, and should not be.
  }
}
