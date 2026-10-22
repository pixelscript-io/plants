import vine from '@vinejs/vine'

const location = {
  zip: vine.string().regex(/^\d{5}$/).optional(),
  lat: vine.number().min(-90).max(90).optional(),
  lon: vine.number().min(-180).max(180).optional(),
}

export const frostValidator = vine.create({
  ...location,
  year: vine.number().withoutDecimals().min(1900).max(2100).optional(),
})

export const calendarValidator = vine.create({
  ...location,
  /**
   * Plant slugs, comma-separated or repeated. The query parser may deliver
   * either a string or an array, so the controller normalizes it.
   */
  plants: vine.any(),
  year: vine.number().withoutDecimals().min(1900).max(2100).optional(),
  risk: vine.enum(['conservative', 'average', 'optimistic']).optional(),
})

export const hardinessValidator = vine.create({
  zip: vine.string().regex(/^\d{5}$/),
})

export const moonValidator = vine.create({
  date: vine
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export const moonPhasesValidator = vine.create({
  year: vine.number().withoutDecimals().min(1900).max(2100),
  month: vine.number().withoutDecimals().min(1).max(12).optional(),
})
