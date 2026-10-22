import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Companion from '#models/companion'
import Plant from '#models/plant'
import { companions } from './data/companions.js'

export default class CompanionSeeder extends BaseSeeder {
  async run() {
    const plantIds = new Map((await Plant.query().select('id', 'slug')).map((p) => [p.slug, p.id]))
    const missing = new Set<string>()
    let written = 0

    for (const [slug, otherSlug, relationship, reason] of companions) {
      const plantId = plantIds.get(slug)
      const otherId = plantIds.get(otherSlug)
      if (!plantId || !otherId) {
        if (!plantId) missing.add(slug)
        if (!otherId) missing.add(otherSlug)
        continue
      }

      // Relationships are symmetric, so store both directions.
      for (const [a, b] of [
        [plantId, otherId],
        [otherId, plantId],
      ]) {
        await Companion.updateOrCreate(
          { plantId: a, companionPlantId: b, relationship },
          { reason }
        )
        written++
      }
    }

    console.log(`Seeded ${written} companion rows from ${companions.length} pairs.`)
    if (missing.size) console.log(`Unknown plant slugs (pairs skipped): ${[...missing].join(', ')}`)
  }
}
