import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('slug').notNullable().unique()
      table.string('common_name').notNullable().index()
      table.string('scientific_name').nullable().index()
      table.string('family').nullable()
      table.string('genus').nullable()
      table.string('plant_type').nullable().index()
      table.string('life_cycle').nullable()
      table.text('description').nullable()
      table.string('image_url').nullable()

      table.string('sun').nullable()
      table.string('water_needs').nullable()
      table.integer('watering_interval_days').nullable()
      table.float('soil_ph_min').nullable()
      table.float('soil_ph_max').nullable()
      table.json('soil_types').nullable()
      table.integer('hardiness_zone_min').nullable()
      table.integer('hardiness_zone_max').nullable()
      table.string('frost_tolerance').nullable()

      table.integer('days_to_germination_min').nullable()
      table.integer('days_to_germination_max').nullable()
      table.integer('days_to_harvest_min').nullable()
      table.integer('days_to_harvest_max').nullable()
      table.integer('spacing_cm').nullable()
      table.integer('height_cm').nullable()

      // Planting windows, in weeks relative to the average last spring frost.
      // Negative = before the frost date, positive = after.
      table.integer('sow_indoors_weeks_min').nullable()
      table.integer('sow_indoors_weeks_max').nullable()
      table.integer('direct_sow_weeks_min').nullable()
      table.integer('direct_sow_weeks_max').nullable()
      table.integer('transplant_weeks_min').nullable()
      table.integer('transplant_weeks_max').nullable()

      table.string('usda_symbol').nullable().index()
      table.string('wikidata_id').nullable().index()
      table.string('gbif_id').nullable().index()
      table.boolean('is_published').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
