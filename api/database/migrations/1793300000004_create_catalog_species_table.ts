import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The catalog tier: species from the USDA PLANTS Database (public domain) that
 * USDA has growing characteristics for. These are not curated like the plants
 * table. Every USDA species with a common name is probed once; rows without
 * characteristics are kept (has_characteristics false) so an import can resume
 * without asking USDA about them again, and the API serves only the rest.
 */
export default class extends BaseSchema {
  protected tableName = 'catalog_species'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('usda_symbol').notNullable().unique()
      table.integer('usda_id').nullable()
      table.string('scientific_name').notNullable().index()
      table.string('common_name').nullable().index()
      table.string('family').nullable()
      table.json('durations').nullable()
      table.json('growth_habits').nullable()
      table.string('native_status_contiguous').nullable()
      table.json('characteristics').nullable()
      table.boolean('has_characteristics').notNullable().defaultTo(false).index()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
