import type Plant from '#models/plant'
import { BaseTransformer } from '@adonisjs/core/transformers'

const range = (min: number | null, max: number | null) =>
  min === null && max === null ? null : { min, max }

const NATIVE_STATUS: Record<string, 'native' | 'introduced' | 'native_and_introduced'> = {
  Native: 'native',
  Introduced: 'introduced',
  'Introduced, Native': 'native_and_introduced',
}

/**
 * Full representation with growing data, companions and amendments.
 * The controller is expected to preload every relation used here.
 */
export default class PlantDetailTransformer extends BaseTransformer<Plant> {
  toObject() {
    const plant = this.resource

    const companions: Record<string, unknown[]> = {
      beneficial: [],
      antagonistic: [],
      culinary: [],
    }
    for (const companion of plant.companions) {
      companions[companion.relationship]?.push({
        slug: companion.companionPlant.slug,
        commonName: companion.companionPlant.commonName,
        reason: companion.reason,
      })
    }

    const sources = new Map<string, { source: string; license: string; attribution: string | null }>()
    for (const source of plant.sources) {
      sources.set(`${source.source}|${source.license}`, {
        source: source.source,
        license: source.license,
        attribution: source.attribution,
      })
    }

    return {
      ...this.pick(plant, [
        'id',
        'slug',
        'commonName',
        'scientificName',
        'family',
        'genus',
        'plantType',
        'lifeCycle',
        'description',
        'imageUrl',
        'usdaSymbol',
        'wikidataId',
        'gbifId',
      ]),
      // From the USDA PLANTS profile (public domain).
      usda: {
        durations: plant.usdaDurations,
        growthHabits: plant.usdaGrowthHabits,
        nativeStatus: plant.nativeStatusContiguous
          ? (NATIVE_STATUS[plant.nativeStatusContiguous] ?? null)
          : null,
      },
      names: plant.names.map((name) => ({ name: name.name, language: name.language })),
      care: {
        sun: plant.sun,
        waterNeeds: plant.waterNeeds,
        wateringIntervalDays: plant.wateringIntervalDays,
        soilPh: range(plant.soilPhMin, plant.soilPhMax),
        soilTypes: plant.soilTypes,
        hardinessZones: range(plant.hardinessZoneMin, plant.hardinessZoneMax),
        frostTolerance: plant.frostTolerance,
      },
      growth: {
        daysToGermination: range(plant.daysToGerminationMin, plant.daysToGerminationMax),
        daysToHarvest: range(plant.daysToHarvestMin, plant.daysToHarvestMax),
        spacingCm: plant.spacingCm,
        heightCm: plant.heightCm,
      },
      // Weeks relative to the average last spring frost (negative = before).
      planting: {
        sowIndoorsWeeks: range(plant.sowIndoorsWeeksMin, plant.sowIndoorsWeeksMax),
        directSowWeeks: range(plant.directSowWeeksMin, plant.directSowWeeksMax),
        transplantWeeks: range(plant.transplantWeeksMin, plant.transplantWeeksMax),
      },
      companions,
      amendments: plant.amendments.map((amendment) => ({
        slug: amendment.slug,
        name: amendment.name,
        effect: amendment.$extras.pivot_effect as string | null,
      })),
      sources: [...sources.values()],
    }
  }
}
