import * as Astronomy from 'astronomy-engine'

const DAY_MS = 24 * 60 * 60 * 1000

const PHASE_NAMES = [
  'new_moon',
  'waxing_crescent',
  'first_quarter',
  'waxing_gibbous',
  'full_moon',
  'waning_gibbous',
  'last_quarter',
  'waning_crescent',
] as const

export type PhaseName = (typeof PHASE_NAMES)[number]

const QUARTER_NAMES = ['new_moon', 'first_quarter', 'full_moon', 'last_quarter'] as const

// Traditional full moon names by calendar month (UTC), as used in almanacs.
const FULL_MOON_NAMES = [
  'Wolf Moon',
  'Snow Moon',
  'Worm Moon',
  'Pink Moon',
  'Flower Moon',
  'Strawberry Moon',
  'Buck Moon',
  'Sturgeon Moon',
  'Corn Moon',
  "Hunter's Moon",
  'Beaver Moon',
  'Cold Moon',
]

/** A date at noon UTC, so a calendar day maps to one stable moment. */
export const noonUtc = (isoDate: string) => new Date(`${isoDate}T12:00:00Z`)

const iso = (date: Date) => date.toISOString()

/** The full moon closest to the September equinox is the Harvest Moon. */
export function harvestMoon(year: number): Date {
  const equinox = Astronomy.Seasons(year).sep_equinox.date
  let best: Date | null = null
  let cursor = new Date(equinox.getTime() - 20 * DAY_MS)
  for (let i = 0; i < 3; i++) {
    const full = Astronomy.SearchMoonPhase(180, cursor, 40)!.date
    if (!best || Math.abs(full.getTime() - equinox.getTime()) < Math.abs(best.getTime() - equinox.getTime())) {
      best = full
    }
    cursor = new Date(full.getTime() + DAY_MS)
  }
  return best!
}

export function fullMoonName(date: Date): string {
  const harvest = harvestMoon(date.getUTCFullYear())
  if (Math.abs(harvest.getTime() - date.getTime()) < DAY_MS) return 'Harvest Moon'

  // A second full moon in one calendar month is a Blue Moon.
  const previous = Astronomy.SearchMoonPhase(180, new Date(date.getTime() - 33 * DAY_MS), 31)
  if (
    previous &&
    previous.date.getTime() < date.getTime() - DAY_MS &&
    previous.date.getUTCMonth() === date.getUTCMonth() &&
    previous.date.getUTCFullYear() === date.getUTCFullYear()
  ) {
    return 'Blue Moon'
  }
  return FULL_MOON_NAMES[date.getUTCMonth()]
}

/**
 * Traditional moon-gardening advice. This is folklore: controlled studies have
 * not shown a consistent effect, so the API labels it as such.
 */
function traditionalGuidance(waxing: boolean) {
  return waxing
    ? {
        basis: 'traditional',
        stage: 'waxing',
        suggests: 'Sow and transplant crops that grow leaves, flowers or fruit above ground.',
      }
    : {
        basis: 'traditional',
        stage: 'waning',
        suggests: 'Sow root crops and bulbs; prune, weed and harvest for storage.',
      }
}

export function moonOn(date: Date) {
  const angle = Astronomy.MoonPhase(date)
  const illumination = Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction
  const waxing = angle < 180
  const name = PHASE_NAMES[Math.floor(((angle + 22.5) % 360) / 45)]

  // Age: time since the most recent new moon.
  const first = Astronomy.SearchMoonPhase(0, new Date(date.getTime() - 30 * DAY_MS), 31)!.date
  const second = Astronomy.SearchMoonPhase(0, new Date(first.getTime() + DAY_MS), 31)!.date
  const lastNew = second.getTime() <= date.getTime() ? second : first

  const nextNew = Astronomy.SearchMoonPhase(0, date, 40)!.date
  const nextFull = Astronomy.SearchMoonPhase(180, date, 40)!.date

  return {
    date: iso(date).slice(0, 10),
    computedFor: iso(date),
    phase: name,
    phaseAngle: Number(angle.toFixed(2)),
    illumination: Number((illumination * 100).toFixed(1)),
    ageDays: Number(((date.getTime() - lastNew.getTime()) / DAY_MS).toFixed(1)),
    waxing,
    nextNewMoon: iso(nextNew),
    nextFullMoon: { at: iso(nextFull), name: fullMoonName(nextFull) },
    traditionalGuidance: traditionalGuidance(waxing),
  }
}

/** Principal phases (new, first quarter, full, last quarter) in [from, to). */
export function principalPhases(from: Date, to: Date) {
  const phases: { phase: (typeof QUARTER_NAMES)[number]; at: string; name?: string }[] = []
  let quarter = Astronomy.SearchMoonQuarter(from)
  while (quarter.time.date.getTime() < to.getTime()) {
    const phase = QUARTER_NAMES[quarter.quarter]
    phases.push({
      phase,
      at: iso(quarter.time.date),
      ...(phase === 'full_moon' ? { name: fullMoonName(quarter.time.date) } : {}),
    })
    quarter = Astronomy.NextMoonQuarter(quarter)
  }
  return phases
}
