import ApiError from '#exceptions/api_error'
import { moonOn, noonUtc, principalPhases } from '#services/moon_service'
import { moonPhasesValidator, moonValidator } from '#validators/climate'
import type { HttpContext } from '@adonisjs/core/http'

export default class MoonController {
  /** Moon phase for a date (default: today, UTC). */
  async show({ request, serialize }: HttpContext) {
    const { date } = await request.validateUsing(moonValidator, { data: request.qs() })
    const day = date ?? new Date().toISOString().slice(0, 10)

    const at = noonUtc(day)
    // Rejects impossible dates such as 2026-02-31, which JS would roll over.
    if (Number.isNaN(at.getTime()) || at.toISOString().slice(0, 10) !== day) {
      throw new ApiError(`${day} is not a valid date.`, 422)
    }
    const year = at.getUTCFullYear()
    if (year < 1900 || year > 2100) throw new ApiError('Dates must be between 1900 and 2100.', 422)

    return serialize(moonOn(at))
  }

  /** New, first quarter, full and last quarter moons for a year or month. */
  async phases({ request, serialize }: HttpContext) {
    const { year, month } = await request.validateUsing(moonPhasesValidator, {
      data: request.qs(),
    })

    const from = new Date(Date.UTC(year, month ? month - 1 : 0, 1))
    const to = month ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year + 1, 0, 1))

    return serialize({ year, month: month ?? null, phases: principalPhases(from, to) })
  }
}
