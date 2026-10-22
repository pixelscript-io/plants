import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plant_sources'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('plant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('plants')
        .onDelete('CASCADE')
      // Which plants column this provenance row covers ('*' = whole record).
      table.string('field').notNullable().defaultTo('*')
      table.string('source').notNullable()
      table.string('source_id').nullable()
      table.string('license').notNullable()
      table.string('attribution').nullable()
      table.string('url').nullable()
      table.timestamp('fetched_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['plant_id', 'field'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
