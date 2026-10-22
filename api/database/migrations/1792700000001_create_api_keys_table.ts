import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_keys'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      // First characters of the key, safe to display so people can tell keys apart.
      table.string('prefix', 16).notNullable()
      // SHA-256 of the full key. The key itself is shown once and never stored.
      table.string('key_hash', 64).notNullable().unique()
      table.string('tier').notNullable().defaultTo('free')
      table.timestamp('last_used_at').nullable()
      table.timestamp('revoked_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
