import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_usage'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('api_key_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('api_keys')
        .onDelete('CASCADE')
      // UTC calendar day, YYYY-MM-DD.
      table.string('day', 10).notNullable()
      table.integer('requests').notNullable().defaultTo(0)
      table.integer('errors').notNullable().defaultTo(0)
      table.integer('rate_limited').notNullable().defaultTo(0)

      table.unique(['api_key_id', 'day'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
