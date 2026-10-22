import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Replaces the placeholder frost_stations and zip_zones tables (never
 * populated) with the shapes the NOAA and Census importers produce.
 *
 * Frost dates are stored as 'MM-DD' strings from NOAA's 1991-2020 climate
 * normals for a 32F freeze. Each season has three dates by risk:
 *  - conservative: NOAA's 10% probability date. Spring: the late date after
 *    which a freeze has only a 10% chance. Fall: the early date before which a
 *    freeze has a 10% chance.
 *  - average: the 50% date.
 *  - optimistic: the 90% date (spring: early; fall: late).
 * Columns avoid a letter-then-digit boundary (like "p10") because Lucid's
 * snake_case mapping would not round-trip it.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.dropTable('zip_zones')
    this.schema.dropTable('frost_stations')

    this.schema.createTable('frost_stations', (table) => {
      table.increments('id').notNullable()
      table.string('noaa_id').notNullable().unique()
      table.string('name').notNullable()
      table.string('state', 2).nullable().index()
      table.float('latitude').notNullable()
      table.float('longitude').notNullable()
      table.float('elevation_m').nullable()

      table.string('last_spring_conservative', 5).nullable()
      table.string('last_spring_average', 5).nullable()
      table.string('last_spring_optimistic', 5).nullable()
      table.string('first_fall_conservative', 5).nullable()
      table.string('first_fall_average', 5).nullable()
      table.string('first_fall_optimistic', 5).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['latitude', 'longitude'])
    })

    this.schema.createTable('zip_codes', (table) => {
      table.string('zip', 5).notNullable().primary()
      table.float('latitude').notNullable()
      table.float('longitude').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('zip_codes')
    this.schema.dropTable('frost_stations')

    this.schema.createTable('frost_stations', (table) => {
      table.increments('id').notNullable()
      table.string('noaa_id').notNullable().unique()
      table.string('name').notNullable()
      table.string('state', 2).nullable().index()
      table.float('latitude').notNullable()
      table.float('longitude').notNullable()
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
}
