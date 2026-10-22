import { PlantSourceSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Plant from '#models/plant'

export default class PlantSource extends PlantSourceSchema {
  @belongsTo(() => Plant)
  declare plant: BelongsTo<typeof Plant>
}
