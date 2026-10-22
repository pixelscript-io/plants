import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'companions'

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
      table
        .integer('companion_plant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('plants')
        .onDelete('CASCADE')
      // beneficial | antagonistic | culinary
      table.string('relationship').notNullable()
      table.text('reason').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['plant_id', 'companion_plant_id', 'relationship'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
