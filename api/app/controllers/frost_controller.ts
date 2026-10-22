import ApiError from '#exceptions/api_error'
import {
  MAX_STATION_DISTANCE_KM,
  MILD_WINTER_NOTE,
  daysBetween,
  frostDates,
  nearestStation,
  resolveLocation,
  stationSummary,
} from '#services/frost_service'
import { frostValidator } from '#validators/climate'
import type { HttpContext } from '@adonisjs/core/http'

export default class FrostController {
  async show({ request, serialize }: HttpContext) {
    const { zip, lat, lon, year = new Date().getUTCFullYear() } = await request.validateUsing(
      frostValidator,
      { data: request.qs() }
    )

    const location = await resolveLocation({ zip, lat, lon })
    const match = await nearestStation(location)
    if (!match) {
      throw new ApiError(
        `No weather station with frost data within ${MAX_STATION_DISTANCE_KM} km of this location.`,
        404
      )
    }

    const dates = frostDates(match.station, year)
    return serialize({
      location,
      station: stationSummary(match.station, match.distanceKm),
      year,
      ...dates,
      frostFreeDays: daysBetween(dates.lastSpringFrost.average, dates.firstFallFrost.average),
      notes: dates.mildWinter ? [MILD_WINTER_NOTE] : [],
    })
  }
}
