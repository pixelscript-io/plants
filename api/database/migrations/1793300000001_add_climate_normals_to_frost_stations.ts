import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Other NOAA 1991-2020 annual normals for each station: temperature (F),
 * precipitation and snowfall (inches) and growing degree days (F-days, from the
 * given base temperature). All nullable: some stations do not report them.
 */
export default class extends BaseSchema {
  protected tableName = 'frost_stations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.float('avg_temp_f').nullable()
      table.float('avg_min_temp_f').nullable()
      table.float('avg_max_temp_f').nullable()
      table.float('annual_precip_in').nullable()
      table.float('annual_snow_in').nullable()
      table.float('gdd_base_forty').nullable()
      table.float('gdd_base_fifty').nullable()
      table.float('gdd_base_sixty').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns(
        'avg_temp_f',
        'avg_min_temp_f',
        'avg_max_temp_f',
        'annual_precip_in',
        'annual_snow_in',
        'gdd_base_forty',
        'gdd_base_fifty',
        'gdd_base_sixty'
      )
    })
  }
}
