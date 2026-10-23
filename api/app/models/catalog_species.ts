import { CatalogSpecySchema } from '#database/schema'
import { column } from '@adonisjs/lucid/orm'
import type { RawCharacteristics } from '#services/usda_characteristics'

// SQLite returns JSON columns as strings, Postgres as parsed values.
const json = {
  prepare: (value: unknown) => (value === null ? null : JSON.stringify(value)),
  consume: (value: string | unknown) => (typeof value === 'string' ? JSON.parse(value) : value),
}

export default class CatalogSpecies extends CatalogSpecySchema {
  /** Species the API serves: those USDA has growing characteristics for. */
  static served() {
    return CatalogSpecies.query().where('hasCharacteristics', true)
  }

  @column(json)
  declare durations: string[] | null

  @column(json)
  declare growthHabits: string[] | null

  @column(json)
  declare characteristics: RawCharacteristics | null
}
