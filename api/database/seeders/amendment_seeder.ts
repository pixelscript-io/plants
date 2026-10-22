import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Amendment from '#models/amendment'
import Plant from '#models/plant'
import { amendments } from './data/amendments.js'

export default class AmendmentSeeder extends BaseSeeder {
  async run() {
    const plantIds = new Map((await Plant.query().select('id', 'slug')).map((p) => [p.slug, p.id]))
    const missing = new Set<string>()
    let links = 0

    for (const seed of amendments) {
      const amendment = await Amendment.updateOrCreate(
        { slug: seed.slug },
        { name: seed.name, description: seed.description }
      )

      const pivot: Record<number, { effect: string }> = {}
      for (const [plantSlug, effect] of Object.entries(seed.plants)) {
        const plantId = plantIds.get(plantSlug)
        if (plantId) pivot[plantId] = { effect }
        else missing.add(plantSlug)
      }
      await amendment.related('plants').sync(pivot)
      links += Object.keys(pivot).length
    }

    console.log(`Seeded ${amendments.length} amendments with ${links} plant links.`)
    if (missing.size) console.log(`Unknown plant slugs (links skipped): ${[...missing].join(', ')}`)
  }
}
