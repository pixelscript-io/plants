import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('frost_stations', (table) => {
      table.increments('id').notNullable()
      table.string('noaa_id').notNullable().unique()
      table.string('name').notNullable()
      table.string('state', 2).nullable().index()
      table.float('latitude').notNullable()
      table.float('longitude').notNullable()
      // Day of year (1-366) at which there is a 50% chance of a 32F freeze.
      table.integer('last_spring_frost_doy').nullable()
      table.integer('first_fall_frost_doy').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    this.schema.createTable('zip_zones', (table) => {
      table.string('zip', 5).notNullable().primary()
      table.string('zone', 4).notNullable()
      table.float('min_temp_f').nullable()
      table.float('latitude').nullable()
      table.float('longitude').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('zip_zones')
    this.schema.dropTable('frost_stations')
  }
}
