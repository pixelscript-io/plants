import ApiError from '#exceptions/api_error'
import Plant from '#models/plant'
import { plantCalendar } from '#services/calendar_service'
import {
  MAX_STATION_DISTANCE_KM,
  MILD_WINTER_NOTE,
  frostDates,
  nearestStation,
  resolveLocation,
  stationSummary,
} from '#services/frost_service'
import { calendarValidator } from '#validators/climate'
import type { HttpContext } from '@adonisjs/core/http'

const MAX_PLANTS = 25

export default class CalendarController {
  async show({ request, serialize }: HttpContext) {
    const {
      zip,
      lat,
      lon,
      plants: plantsParam,
      year = new Date().getUTCFullYear(),
      risk = 'average',
    } = await request.validateUsing(calendarValidator, { data: request.qs() })

    const slugs = [
      ...new Set(
        (Array.isArray(plantsParam) ? plantsParam : [plantsParam])
          .flatMap((value) => String(value).split(','))
          .map((slug) => slug.trim())
          .filter(Boolean)
      ),
    ]
    if (slugs.length === 0) throw new ApiError('Provide at least one plant slug in `plants`.', 422)
    if (slugs.length > MAX_PLANTS) {
      throw new ApiError(`Request at most ${MAX_PLANTS} plants at a time.`, 422)
    }

    const found = await Plant.visible().whereIn('slug', slugs)
    const missing = slugs.filter((slug) => !found.some((plant) => plant.slug === slug))
    if (missing.length) throw new ApiError(`Unknown plants: ${missing.join(', ')}.`, 422)

    const location = await resolveLocation({ zip, lat, lon })
    const match = await nearestStation(location)
    if (!match) {
      throw new ApiError(
        `No weather station with frost data within ${MAX_STATION_DISTANCE_KM} km of this location.`,
        404
      )
    }

    const dates = frostDates(match.station, year)
    const lastSpringFrost = dates.lastSpringFrost[risk]
    const firstFallFrost = dates.firstFallFrost[risk]

    // Keep the response in the order the caller asked for.
    const bySlug = new Map(found.map((plant) => [plant.slug, plant]))
    return serialize({
      location,
      station: stationSummary(match.station, match.distanceKm),
      year,
      risk,
      lastSpringFrost,
      firstFallFrost,
      mildWinter: dates.mildWinter,
      notes: dates.mildWinter ? [MILD_WINTER_NOTE] : [],
      plants: slugs.map((slug) => plantCalendar(bySlug.get(slug)!, lastSpringFrost, firstFallFrost)),
    })
  }
}
