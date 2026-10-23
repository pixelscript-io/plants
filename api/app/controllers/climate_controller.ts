import ApiError from '#exceptions/api_error'
import { MAX_STATION_DISTANCE_KM, nearestStation, resolveLocation, stationSummary } from '#services/frost_service'
import { climateValidator } from '#validators/climate'
import type { HttpContext } from '@adonisjs/core/http'

export default class ClimateController {
  /** Annual temperature, precipitation and growing degree day normals for the nearest station. */
  async show({ request, serialize }: HttpContext) {
    const { zip, lat, lon } = await request.validateUsing(climateValidator, { data: request.qs() })

    const location = await resolveLocation({ zip, lat, lon })
    const match = await nearestStation(location)
    if (!match) {
      throw new ApiError(
        `No weather station within ${MAX_STATION_DISTANCE_KM} km of this location.`,
        404
      )
    }

    const { station } = match

    // A station that reports temperature may not report rain; use the nearest one that does.
    const rain = station.annualPrecipIn === null ? await nearestStation(location, 'annualPrecipIn') : match
    const snow = station.annualSnowIn === null ? await nearestStation(location, 'annualSnowIn') : match

    return serialize({
      location,
      station: stationSummary(station, match.distanceKm),
      period: '1991-2020',
      temperatureF: {
        average: station.avgTempF,
        averageLow: station.avgMinTempF,
        averageHigh: station.avgMaxTempF,
      },
      annualPrecipitationIn: rain?.station.annualPrecipIn ?? null,
      annualSnowfallIn: snow?.station.annualSnowIn ?? null,
      // Set only when rain or snow come from a different station than the temperatures.
      precipitationStation:
        rain && rain.station.id !== station.id ? stationSummary(rain.station, rain.distanceKm) : null,
      snowfallStation:
        snow && snow.station.id !== station.id ? stationSummary(snow.station, snow.distanceKm) : null,
      growingDegreeDays: {
        base40F: station.gddBaseForty,
        base50F: station.gddBaseFifty,
        base60F: station.gddBaseSixty,
      },
    })
  }
}
