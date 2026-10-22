import type Plant from '#models/plant'
import { daysBetween } from '#services/frost_service'

type Window = { start: string; end: string }

const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Weeks relative to the last spring frost as a calendar window. */
const window = (anchor: string, minWeeks: number | null, maxWeeks: number | null): Window | null => {
  if (minWeeks === null || maxWeeks === null) return null
  return { start: addDays(anchor, minWeeks * 7), end: addDays(anchor, maxWeeks * 7) }
}

/**
 * Builds a planting calendar for a plant from its frost-relative windows.
 * `lastSpringFrost` and `firstFallFrost` are the dates chosen by the caller's
 * risk level.
 */
export function plantCalendar(
  plant: Plant,
  lastSpringFrost: string,
  firstFallFrost: string
) {
  const sowIndoors = window(lastSpringFrost, plant.sowIndoorsWeeksMin, plant.sowIndoorsWeeksMax)
  const directSow = window(lastSpringFrost, plant.directSowWeeksMin, plant.directSowWeeksMax)
  const transplant = window(lastSpringFrost, plant.transplantWeeksMin, plant.transplantWeeksMax)

  // Days to harvest are counted from transplanting when a plant is
  // transplanted, otherwise from sowing in the ground.
  const planting = transplant ?? directSow
  const harvest =
    planting && plant.daysToHarvestMin !== null
      ? {
          earliest: addDays(planting.start, plant.daysToHarvestMin),
          latest: addDays(planting.end, plant.daysToHarvestMax ?? plant.daysToHarvestMin),
        }
      : null

  const warnings: string[] = []
  if (!sowIndoors && !directSow && !transplant) {
    warnings.push('No planting windows are on file for this plant.')
  }
  if (harvest && plant.frostTolerance === 'tender') {
    if (daysBetween(harvest.earliest, firstFallFrost) < 0) {
      warnings.push(
        `Even the earliest harvest (${harvest.earliest}) is after the first fall frost (${firstFallFrost}) and this plant is frost tender. Start earlier or choose a shorter-season variety.`
      )
    } else if (daysBetween(harvest.latest, firstFallFrost) < 0) {
      warnings.push(
        `Plantings late in the window may be harvested after the first fall frost (${firstFallFrost}); this plant is frost tender.`
      )
    }
  }

  return {
    slug: plant.slug,
    commonName: plant.commonName,
    frostTolerance: plant.frostTolerance,
    windows: { sowIndoors, directSow, transplant },
    harvest,
    warnings,
  }
}
