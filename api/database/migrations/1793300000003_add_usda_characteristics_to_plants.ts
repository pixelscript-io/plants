import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * A selection of the USDA PLANTS "characteristics" of a plant (public domain),
 * as an object of USDA's own labels to USDA's own values. Null where USDA has none.
 */
export default class extends BaseSchema {
  protected tableName = 'plants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('usda_characteristics').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('usda_characteristics')
    })
  }
}
