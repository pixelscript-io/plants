import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Email verification and password reset.
 *
 * - users.email_verified_at: null until the owner proves control of the inbox.
 *   Accounts that already exist are marked verified, so nobody is locked out by
 *   this change.
 * - user_tokens: single-use, expiring tokens for verifying an email address and
 *   resetting a password. Only a SHA-256 hash of each token is stored, so a copy
 *   of the database cannot be used to take over accounts.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.timestamp('email_verified_at').nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery('update users set email_verified_at = created_at where email_verified_at is null')
    })

    this.schema.createTable('user_tokens', (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      // verify_email | reset_password
      table.string('purpose', 24).notNullable()
      table.string('token_hash', 64).notNullable().unique()
      table.timestamp('expires_at').notNullable()
      table.timestamp('used_at').nullable()
      table.timestamp('created_at').notNullable()

      table.index(['user_id', 'purpose'])
    })
  }

  async down() {
    this.schema.dropTable('user_tokens')
    this.schema.alterTable('users', (table) => {
      table.dropColumn('email_verified_at')
    })
  }
}
