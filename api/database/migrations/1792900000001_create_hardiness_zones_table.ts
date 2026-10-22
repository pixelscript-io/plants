import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * USDA Plant Hardiness Zones by ZIP code (2023 map), from the PRISM Group at
 * Oregon State University.
 *
 * OSU owns this data and allows free redistribution on the condition that it
 * is not altered, so zone, trange and zonetitle are stored exactly as
 * published. Do not normalize, parse or "fix" them. See the importer.
 */
export default class extends BaseSchema {
  protected tableName = 'hardiness_zones'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('zip', 5).notNullable().primary()
      // Verbatim CSV columns.
      table.string('zone').notNullable()
      table.string('trange').notNullable()
      table.string('zonetitle').notNullable()
      // Which published file the row came from: us, ak, hi or pr.
      table.string('region', 2).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
