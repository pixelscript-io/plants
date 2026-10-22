import { AmendmentSchema } from '#database/schema'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Plant from '#models/plant'

export default class Amendment extends AmendmentSchema {
  @manyToMany(() => Plant, {
    pivotTable: 'plant_amendments',
    pivotColumns: ['effect'],
    pivotTimestamps: true,
  })
  declare plants: ManyToMany<typeof Plant>
}
