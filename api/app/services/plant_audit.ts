import Amendment from '#models/amendment'
import Companion from '#models/companion'
import Plant from '#models/plant'

export type Finding = { severity: 'error' | 'warning'; slug: string; message: string }

const PERENNIAL_TYPES = ['tree', 'shrub']

// Sown or planted in late summer or fall (garlic, biennials, fall crops). Extension
// sources give their dates relative to the first fall frost, not the last spring frost.
const FALL_PLANTED = new Set(['garlic', 'radicchio', 'foxglove', 'hollyhock'])

/**
 * Checks plants, companions and amendments for internal contradictions.
 * Errors block publishing; warnings are known gaps or judgement calls.
 */
export async function auditPlants() {
  const plants = await Plant.query().orderBy('slug')
  const findings: Finding[] = []
  const add = (severity: Finding['severity'], slug: string, message: string) =>
    findings.push({ severity, slug, message })

  const orderedRange = (
    slug: string,
    label: string,
    min: number | null,
    max: number | null,
    bounds?: [number, number]
  ) => {
    if ((min === null) !== (max === null)) add('error', slug, `${label}: only one end of the range is set`)
    if (min === null || max === null) return
    if (min > max) add('error', slug, `${label}: min ${min} is greater than max ${max}`)
    if (bounds && (min < bounds[0] || max > bounds[1])) {
      add('error', slug, `${label}: ${min} to ${max} is outside ${bounds[0]} to ${bounds[1]}`)
    }
  }

  for (const p of plants) {
    const s = p.slug

    for (const [field, value] of Object.entries({
      scientificName: p.scientificName,
      plantType: p.plantType,
      lifeCycle: p.lifeCycle,
      sun: p.sun,
      waterNeeds: p.waterNeeds,
      frostTolerance: p.frostTolerance,
      usdaSymbol: p.usdaSymbol,
      family: p.family,
    })) {
      if (!value) add('error', s, `missing ${field}`)
    }

    orderedRange(s, 'soil pH', p.soilPhMin, p.soilPhMax, [3, 9])
    orderedRange(s, 'hardiness zones', p.hardinessZoneMin, p.hardinessZoneMax, [1, 13])
    orderedRange(s, 'germination days', p.daysToGerminationMin, p.daysToGerminationMax, [1, 90])
    orderedRange(s, 'days to harvest', p.daysToHarvestMin, p.daysToHarvestMax, [1, 400])
    orderedRange(s, 'sow indoors weeks', p.sowIndoorsWeeksMin, p.sowIndoorsWeeksMax, [-20, 16])
    orderedRange(s, 'direct sow weeks', p.directSowWeeksMin, p.directSowWeeksMax, [-20, 16])
    orderedRange(s, 'transplant weeks', p.transplantWeeksMin, p.transplantWeeksMax, [-20, 16])

    if (p.soilPhMin !== null && p.soilPhMax !== null && p.soilPhMax - p.soilPhMin > 3) {
      add('warning', s, `soil pH range ${p.soilPhMin} to ${p.soilPhMax} is very wide`)
    }

    // Perennials have a hardiness zone range; annuals do not. Hardy biennials
    // (foxglove, hollyhock) legitimately have zones.
    const perennial = p.lifeCycle === 'perennial'
    if (perennial && p.hardinessZoneMin === null) add('error', s, 'perennial without hardiness zones')
    if (p.lifeCycle === 'annual' && p.hardinessZoneMin !== null) {
      add('error', s, 'annual plant has hardiness zones')
    }
    if (PERENNIAL_TYPES.includes(p.plantType ?? '') && !perennial) {
      add('error', s, `${p.plantType} must be perennial`)
    }

    // Seed starting must finish before transplanting.
    if (
      p.sowIndoorsWeeksMin !== null &&
      p.transplantWeeksMin !== null &&
      p.sowIndoorsWeeksMax! > p.transplantWeeksMin
    ) {
      add('error', s, 'sow-indoors window ends after the transplant window starts')
    }

    // Frost-tender plants must not be planted out before the last frost.
    if (p.frostTolerance === 'tender') {
      if (p.directSowWeeksMin !== null && p.directSowWeeksMin < 0) {
        add('error', s, `tender plant direct sown ${p.directSowWeeksMin} weeks before last frost`)
      }
      if (p.transplantWeeksMin !== null && p.transplantWeeksMin < 0) {
        add('error', s, `tender plant transplanted ${p.transplantWeeksMin} weeks before last frost`)
      }
    }
    if (p.frostTolerance === 'half_hardy') {
      if (p.directSowWeeksMin !== null && p.directSowWeeksMin < -6) {
        add('warning', s, `half-hardy plant direct sown ${p.directSowWeeksMin} weeks before last frost`)
      }
    }

    // Plants with a harvest estimate need a planting window to anchor it.
    const hasWindow =
      p.directSowWeeksMin !== null || p.transplantWeeksMin !== null || p.sowIndoorsWeeksMin !== null
    if (!hasWindow && FALL_PLANTED.has(s)) {
      add(
        'warning',
        s,
        'fall-planted: has no spring window because planting dates are relative to the first fall frost, which the model does not support yet'
      )
    } else {
      if (p.daysToHarvestMin !== null && !hasWindow) {
        add('warning', s, 'has days to harvest but no planting window (calendar cannot use it)')
      }
      if (!hasWindow && !PERENNIAL_TYPES.includes(p.plantType ?? '') && !perennial) {
        add('warning', s, 'no planting windows')
      }
    }
    if (
      p.daysToHarvestMin !== null &&
      p.sowIndoorsWeeksMin !== null &&
      p.transplantWeeksMin === null &&
      p.directSowWeeksMin === null
    ) {
      add('warning', s, 'only a sow-indoors window; harvest cannot be estimated from it')
    }

    // Watering interval agrees with the water-needs class.
    if (p.wateringIntervalDays !== null) {
      if (p.waterNeeds === 'high' && p.wateringIntervalDays > 3) {
        add('warning', s, `high water needs but watered every ${p.wateringIntervalDays} days`)
      }
      if (p.waterNeeds === 'low' && p.wateringIntervalDays < 5) {
        add('warning', s, `low water needs but watered every ${p.wateringIntervalDays} days`)
      }
      if (p.waterNeeds === 'medium' && (p.wateringIntervalDays < 2 || p.wateringIntervalDays > 7)) {
        add('warning', s, `medium water needs but watered every ${p.wateringIntervalDays} days`)
      }
    }

    // Sprawling vines (melons, squash) legitimately need far more room than their height.
    if (p.heightCm !== null && p.spacingCm !== null && p.spacingCm > 4 * p.heightCm) {
      add('warning', s, `spacing ${p.spacingCm} cm is more than 4x height ${p.heightCm} cm`)
    }
    if (!/^[A-Z][a-z]+( [a-z-]+)?$/.test(p.scientificName ?? '')) {
      add('warning', s, `scientific name "${p.scientificName}" is not "Genus" or "Genus species"`)
    }
  }

  // ---- Companions ----
  const slugById = new Map(plants.map((p) => [p.id, p.slug]))
  const companions = await Companion.query()
  const keys = new Set(companions.map((c) => `${c.plantId}>${c.companionPlantId}>${c.relationship}`))
  const withCompanions = new Set<number>()

  for (const c of companions) {
    const a = slugById.get(c.plantId) ?? `#${c.plantId}`
    const b = slugById.get(c.companionPlantId) ?? `#${c.companionPlantId}`
    withCompanions.add(c.plantId)
    if (c.plantId === c.companionPlantId) add('error', a, `${c.relationship} companion of itself`)
    if (!keys.has(`${c.companionPlantId}>${c.plantId}>${c.relationship}`)) {
      add('error', a, `${c.relationship} with ${b} is not stored in both directions`)
    }
    if (!c.reason || c.reason.trim().length < 10) add('error', a, `${c.relationship} with ${b} has no real reason`)
    if (c.relationship === 'beneficial' && keys.has(`${c.plantId}>${c.companionPlantId}>antagonistic`)) {
      add('error', a, `both beneficial and antagonistic with ${b}`)
    }
  }
  for (const p of plants) {
    if (!withCompanions.has(p.id)) add('warning', p.slug, 'no companions')
  }

  // ---- Amendments ----
  const amendments = await Amendment.query().preload('plants')
  for (const a of amendments) {
    if (!a.description || a.description.length < 20) add('error', a.slug, 'amendment has no description')
    for (const plant of a.plants) {
      const effect = plant.$extras.pivot_effect as string | null
      if (!effect || effect.trim().length < 10) add('error', plant.slug, `${a.slug}: no effect text`)
    }
  }

  return {
    findings,
    counts: { plants: plants.length, companions: companions.length, amendments: amendments.length },
  }
}
