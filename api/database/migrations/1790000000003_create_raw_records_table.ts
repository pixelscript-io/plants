import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'raw_records'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('source').notNullable()
      table.string('source_id').notNullable()
      table.json('payload').notNullable()
      table.string('license').notNullable()
      table.timestamp('fetched_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['source', 'source_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
