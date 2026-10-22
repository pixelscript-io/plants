import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('amendments', (table) => {
      table.increments('id').notNullable()
      table.string('slug').notNullable().unique()
      table.string('name').notNullable()
      table.text('description').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('plant_amendments', (table) => {
      table.increments('id').notNullable()
      table
        .integer('plant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('plants')
        .onDelete('CASCADE')
      table
        .integer('amendment_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('amendments')
        .onDelete('CASCADE')
      table.text('effect').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['plant_id', 'amendment_id'])
    })
  }

  async down() {
    this.schema.dropTable('plant_amendments')
    this.schema.dropTable('amendments')
  }
}
