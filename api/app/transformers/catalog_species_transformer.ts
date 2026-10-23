import type CatalogSpecies from '#models/catalog_species'
import { nativeStatusValue, parseCharacteristics } from '#services/usda_characteristics'
import { BaseTransformer } from '@adonisjs/core/transformers'

/** Compact form for search results. */
export class CatalogSpeciesSummaryTransformer extends BaseTransformer<CatalogSpecies> {
  toObject() {
    const species = this.resource
    const traits = parseCharacteristics(species.characteristics)
    return {
      usdaSymbol: species.usdaSymbol,
      scientificName: species.scientificName,
      commonName: species.commonName,
      family: species.family,
      durations: species.durations,
      growthHabits: species.growthHabits,
      nativeStatus: nativeStatusValue(species.nativeStatusContiguous),
      shadeTolerance: traits?.shadeTolerance ?? null,
      droughtTolerance: traits?.droughtTolerance ?? null,
    }
  }
}

/** Full record: the summary plus every characteristic we keep. */
export default class CatalogSpeciesTransformer extends BaseTransformer<CatalogSpecies> {
  toObject() {
    const species = this.resource
    return {
      usdaSymbol: species.usdaSymbol,
      scientificName: species.scientificName,
      commonName: species.commonName,
      family: species.family,
      durations: species.durations,
      growthHabits: species.growthHabits,
      nativeStatus: nativeStatusValue(species.nativeStatusContiguous),
      characteristics: parseCharacteristics(species.characteristics),
      source: {
        name: 'USDA PLANTS Database',
        license: 'US-Government-Public-Domain',
        note: 'Not curated. Values describe the species in the wild and are not a growing guide.',
      },
    }
  }
}
