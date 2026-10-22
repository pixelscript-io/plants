import { RawRecordSchema } from '#database/schema'
import { column } from '@adonisjs/lucid/orm'

export default class RawRecord extends RawRecordSchema {
  @column({
    prepare: (value: unknown) => JSON.stringify(value),
    consume: (value: unknown) => (typeof value === 'string' ? JSON.parse(value) : value),
  })
  declare payload: Record<string, unknown>
}
