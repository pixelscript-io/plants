import { CompanionSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Plant from '#models/plant'

export default class Companion extends CompanionSchema {
  @belongsTo(() => Plant)
  declare plant: BelongsTo<typeof Plant>

  @belongsTo(() => Plant, { foreignKey: 'companionPlantId' })
  declare companionPlant: BelongsTo<typeof Plant>
}
