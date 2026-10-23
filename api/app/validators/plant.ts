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

/** Validator for the catalog search query string. */
export const catalogIndexValidator = vine.create({
  q: vine.string().trim().minLength(1).maxLength(100).optional(),
  growthHabit: vine
    .enum(['Forb/herb', 'Graminoid', 'Shrub', 'Subshrub', 'Tree', 'Vine', 'Lichenous', 'Nonvascular'])
    .optional(),
  duration: vine.enum(['Annual', 'Biennial', 'Perennial']).optional(),
  nativeStatus: vine.enum(['native', 'introduced']).optional(),
  shadeTolerance: vine.enum(['Low', 'Medium', 'High']).optional(),
  droughtTolerance: vine.enum(['None', 'Low', 'Medium', 'High']).optional(),
  page: vine.number().min(1).optional(),
  perPage: vine.number().min(1).max(100).optional(),
})
