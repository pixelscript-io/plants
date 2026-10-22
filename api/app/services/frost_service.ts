import ApiError from '#exceptions/api_error'
import FrostStation from '#models/frost_station'
import ZipCode from '#models/zip_code'

export const MAX_STATION_DISTANCE_KM = 100

export type Risk = 'conservative' | 'average' | 'optimistic'

export interface Location {
  zip: string | null
  latitude: number
  longitude: number
}

const EARTH_RADIUS_KM = 6371

const toRad = (degrees: number) => (degrees * Math.PI) / 180

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

/** Resolves a ZIP code or a coordinate pair to a location. */
export async function resolveLocation(input: {
  zip?: string
  lat?: number
  lon?: number
}): Promise<Location> {
  if (input.zip) {
    const zip = await ZipCode.find(input.zip)
    if (!zip) throw new ApiError(`ZIP code ${input.zip} was not found.`, 404)
    return { zip: zip.zip, latitude: zip.latitude, longitude: zip.longitude }
  }
  if (input.lat !== undefined && input.lon !== undefined) {
    return { zip: null, latitude: input.lat, longitude: input.lon }
  }
  throw new ApiError('Provide either `zip`, or both `lat` and `lon`.', 422)
}

/** The nearest station with frost data, or null when none is close enough. */
export async function nearestStation(location: Location) {
  // About 1.2 degrees of latitude is 133 km; widen longitude for latitude.
  const latDelta = 1.2
  const lonDelta = latDelta / Math.max(Math.cos(toRad(location.latitude)), 0.2)
  const candidates = await FrostStation.query()
    .whereBetween('latitude', [location.latitude - latDelta, location.latitude + latDelta])
    .whereBetween('longitude', [location.longitude - lonDelta, location.longitude + lonDelta])

  let best: { station: FrostStation; distanceKm: number } | null = null
  for (const station of candidates) {
    const distance = distanceKm(location.latitude, location.longitude, station.latitude, station.longitude)
    if (distance <= MAX_STATION_DISTANCE_KM && (!best || distance < best.distanceKm)) {
      best = { station, distanceKm: distance }
    }
  }
  return best
}

/** 'MM-DD' in a given year as YYYY-MM-DD. */
export const dateInYear = (monthDay: string, year: number) => `${year}-${monthDay}`

/**
 * Frost dates for a year. In spring, "conservative" is the late date that a
 * freeze has only a 10% chance of following; in fall it is the early date that
 * a freeze has a 10% chance of preceding.
 */
export function frostDates(station: FrostStation, year: number) {
  const month = (monthDay: string | null) => Number(monthDay!.slice(0, 2))

  // Where freezes are rare the season wraps around New Year: the "last spring"
  // freeze can fall in January and the "first fall" freeze in the following
  // January. Spring dates late in the year belong to the previous winter, and
  // fall dates early in the year to the next.
  const spring = (monthDay: string | null) =>
    dateInYear(monthDay!, month(monthDay) >= 10 ? year - 1 : year)
  const fall = (monthDay: string | null) =>
    dateInYear(monthDay!, month(monthDay) <= 6 ? year + 1 : year)

  return {
    lastSpringFrost: {
      conservative: spring(station.lastSpringConservative),
      average: spring(station.lastSpringAverage),
      optimistic: spring(station.lastSpringOptimistic),
    },
    firstFallFrost: {
      conservative: fall(station.firstFallConservative),
      average: fall(station.firstFallAverage),
      optimistic: fall(station.firstFallOptimistic),
    },
    // Freezes are infrequent here and mostly happen in mid-winter.
    mildWinter: month(station.lastSpringAverage) <= 2 || month(station.firstFallAverage) <= 6,
  }
}

export const MILD_WINTER_NOTE =
  'Freezes are infrequent at this location and mostly happen in mid-winter, so the frost dates describe the winter freeze season rather than a spring and fall boundary. Frost-tender plants can often be grown for much of the year.'

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)

export const stationSummary = (station: FrostStation, distance: number) => ({
  id: station.noaaId,
  name: station.name,
  state: station.state,
  latitude: station.latitude,
  longitude: station.longitude,
  elevationM: station.elevationM,
  distanceKm: Number(distance.toFixed(1)),
})
