import ApiError from '#exceptions/api_error'
import HardinessZone from '#models/hardiness_zone'
import { HARDINESS_ATTRIBUTION } from '#services/hardiness_attribution'
import { hardinessValidator } from '#validators/climate'
import type { HttpContext } from '@adonisjs/core/http'

export default class HardinessController {
  /**
   * The USDA hardiness zone for a ZIP code. The zone and temperature range are
   * returned exactly as published by Oregon State University: never parse,
   * round or otherwise change them.
   */
  async show({ request, serialize }: HttpContext) {
    const { zip } = await request.validateUsing(hardinessValidator, { data: request.qs() })

    const row = await HardinessZone.find(zip)
    if (!row) throw new ApiError(`No hardiness zone is published for ZIP code ${zip}.`, 404)

    return serialize({
      zip: row.zip,
      zone: row.zone,
      temperatureRangeF: row.trange,
      title: row.zonetitle,
      attribution: HARDINESS_ATTRIBUTION,
    })
  }
}
