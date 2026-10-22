import type Plant from '#models/plant'
import { BaseTransformer } from '@adonisjs/core/transformers'

/**
 * Compact representation used in search results.
 */
export default class PlantTransformer extends BaseTransformer<Plant> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'slug',
        'commonName',
        'scientificName',
        'family',
        'plantType',
        'lifeCycle',
        'imageUrl',
        'sun',
        'waterNeeds',
        'frostTolerance',
      ]),
    }
  }
}
