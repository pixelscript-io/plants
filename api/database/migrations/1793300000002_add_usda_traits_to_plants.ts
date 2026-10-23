import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Traits from the USDA PLANTS profile of a plant's symbol (public domain):
 * duration (annual, perennial...), growth habit (forb/herb, shrub...) and
 * whether it is native to the lower 48 states.
 */
export default class extends BaseSchema {
  protected tableName = 'plants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('usda_durations').nullable()
      table.json('usda_growth_habits').nullable()
      table.string('native_status_contiguous').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('usda_durations', 'usda_growth_habits', 'native_status_contiguous')
    })
  }
}
