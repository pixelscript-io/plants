import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class PlantsPublish extends BaseCommand {
  static commandName = 'plants:publish'
  static description =
    'Make plants visible in the API (is_published). Refuses to run while plants:audit reports errors.'
  static options: CommandOptions = { startApp: true }

  @args.spread({ description: 'Plant slugs to publish; omit with --all', required: false })
  declare slugs: string[]

  @flags.boolean({ description: 'Publish every plant' })
  declare all: boolean

  @flags.boolean({ description: 'Hide the plants again instead of publishing them' })
  declare unpublish: boolean

  async run() {
    const { default: Plant } = await import('#models/plant')
    const { auditPlants } = await import('#services/plant_audit')

    if (!this.all && !this.slugs?.length) {
      this.logger.error('Name the plants to change, or pass --all.')
      this.exitCode = 1
      return
    }

    // Unpublishing is always allowed; publishing requires a clean audit.
    if (!this.unpublish) {
      const { findings } = await auditPlants()
      const errors = findings.filter((f) => f.severity === 'error')
      if (errors.length) {
        this.logger.error(`Not publishing: plants:audit reports ${errors.length} error(s). Run it for details.`)
        this.exitCode = 1
        return
      }
    }

    const query = Plant.query()
    if (!this.all) query.whereIn('slug', this.slugs)
    const plants = await query

    if (!this.all) {
      const missing = this.slugs.filter((slug) => !plants.some((plant) => plant.slug === slug))
      if (missing.length) {
        this.logger.error(`Unknown plants: ${missing.join(', ')}`)
        this.exitCode = 1
        return
      }
    }

    const publish = !this.unpublish
    let changed = 0
    for (const plant of plants) {
      // SQLite returns booleans as 0 or 1.
      if (Boolean(plant.isPublished) !== publish) {
        plant.isPublished = publish
        await plant.save()
        changed++
      }
    }

    this.logger.success(
      `${publish ? 'Published' : 'Unpublished'} ${changed} plant(s) (${plants.length - changed} already ${publish ? 'published' : 'hidden'})`
    )
  }
}
