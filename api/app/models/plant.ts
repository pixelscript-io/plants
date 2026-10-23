import { PlantSchema } from '#database/schema'
import { column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import env from '#start/env'
import Amendment from '#models/amendment'
import Companion from '#models/companion'
import PlantName from '#models/plant_name'
import PlantSource from '#models/plant_source'

export default class Plant extends PlantSchema {
  /**
   * Plants the API may serve. Curated rows stay hidden until reviewed and
   * published; local development can opt in with SERVE_UNPUBLISHED=true.
   */
  static visible() {
    const query = Plant.query()
    if (!env.get('SERVE_UNPUBLISHED', false)) query.where('isPublished', true)
    return query
  }

  // SQLite returns JSON columns as strings, Postgres as parsed values.
  @column({
    prepare: (value: string[] | null) => (value === null ? null : JSON.stringify(value)),
    consume: (value: string | string[] | null) =>
      typeof value === 'string' ? JSON.parse(value) : value,
  })
  declare soilTypes: string[] | null

  @column({
    prepare: (value: string[] | null) => (value === null ? null : JSON.stringify(value)),
    consume: (value: string | string[] | null) =>
      typeof value === 'string' ? JSON.parse(value) : value,
  })
  declare usdaDurations: string[] | null

  @column({
    prepare: (value: string[] | null) => (value === null ? null : JSON.stringify(value)),
    consume: (value: string | string[] | null) =>
      typeof value === 'string' ? JSON.parse(value) : value,
  })
  declare usdaGrowthHabits: string[] | null

  @hasMany(() => PlantName)
  declare names: HasMany<typeof PlantName>

  @hasMany(() => PlantSource)
  declare sources: HasMany<typeof PlantSource>

  @hasMany(() => Companion)
  declare companions: HasMany<typeof Companion>

  @manyToMany(() => Amendment, {
    pivotTable: 'plant_amendments',
    pivotColumns: ['effect'],
    pivotTimestamps: true,
  })
  declare amendments: ManyToMany<typeof Amendment>
}
