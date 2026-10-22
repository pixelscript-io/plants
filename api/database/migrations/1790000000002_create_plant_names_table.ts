import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plant_names'

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
      table.string('name').notNullable().index()
      table.string('language', 8).notNullable().defaultTo('en')
      table.boolean('is_synonym').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['plant_id', 'name', 'language'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
