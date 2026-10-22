import vine from '@vinejs/vine'

/**
 * Validator for the plant search query string.
 */
export const plantIndexValidator = vine.create({
  q: vine.string().trim().minLength(1).maxLength(100).optional(),
  type: vine.enum(['vegetable', 'herb', 'fruit', 'flower', 'shrub', 'tree']).optional(),
  lifeCycle: vine.enum(['annual', 'biennial', 'perennial']).optional(),
  sun: vine.enum(['full', 'partial', 'shade']).optional(),
  water: vine.enum(['low', 'medium', 'high']).optional(),
  frost: vine.enum(['tender', 'half_hardy', 'hardy']).optional(),
  /** USDA hardiness zone (1-13); annuals are always included. */
  zone: vine.number().min(1).max(13).optional(),
  page: vine.number().min(1).optional(),
  perPage: vine.number().min(1).max(100).optional(),
})
