import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

const PROFILE_URL = 'https://plantsservices.sc.egov.usda.gov/api/PlantProfile?symbol='
const PAUSE_MS = 250

type Profile = {
  Durations: string[] | null
  GrowthHabits: string[] | null
  NativeStatuses: { Region: string; Type: string }[] | null
}

export default class ImportUsdaTraits extends BaseCommand {
  static commandName = 'import:usda-traits'
  static description =
    'Fetch duration, growth habit and native status from the USDA PLANTS profile (public domain) for every plant with a USDA symbol'
  static options: CommandOptions = { startApp: true }

  async run() {
    const { default: Plant } = await import('#models/plant')
    const plants = await Plant.query().whereNotNull('usdaSymbol').orderBy('slug')

    let updated = 0
    let failed = 0
    for (const plant of plants) {
      try {
        const response = await fetch(`${PROFILE_URL}${encodeURIComponent(plant.usdaSymbol!)}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const profile = (await response.json()) as Profile

        // "Native", "Introduced" or both ("Native, Introduced") for the lower 48 states.
        const types = [
          ...new Set(
            (profile.NativeStatuses ?? []).filter((s) => s.Region === 'L48').map((s) => s.Type)
          ),
        ]
        plant.usdaDurations = profile.Durations?.length ? profile.Durations : null
        plant.usdaGrowthHabits = profile.GrowthHabits?.length ? profile.GrowthHabits : null
        plant.nativeStatusContiguous = types.length ? types.sort().join(', ') : null
        await plant.save()
        updated++
      } catch (error) {
        failed++
        this.logger.warning(`${plant.slug} (${plant.usdaSymbol}): ${(error as Error).message}`)
      }
      await new Promise((resolve) => setTimeout(resolve, PAUSE_MS))
    }

    this.logger.success(`Updated ${updated} plants (${failed} failed)`)
    if (failed > plants.length / 2) this.exitCode = 1
  }
}
