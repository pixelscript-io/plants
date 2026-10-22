import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class PlantsAudit extends BaseCommand {
  static commandName = 'plants:audit'
  static description =
    'Check plants, companions and amendments for internal contradictions before publishing'
  static options: CommandOptions = { startApp: true }

  @flags.boolean({ description: 'Also list warnings (errors are always shown)' })
  declare warnings: boolean

  async run() {
    const { auditPlants } = await import('#services/plant_audit')
    const { findings, counts } = await auditPlants()

    const errors = findings.filter((f) => f.severity === 'error')
    const warnings = findings.filter((f) => f.severity === 'warning')
    const show = (list: typeof findings) => {
      for (const f of list) this.logger.log(`  ${f.slug}: ${f.message}`)
    }

    if (errors.length) {
      this.logger.error(`${errors.length} error(s):`)
      show(errors)
    }
    if (warnings.length) {
      this.logger.warning(`${warnings.length} warning(s)${this.warnings ? ':' : ' (run with --warnings to list)'}`)
      if (this.warnings) show(warnings)
    }
    this.logger.info(
      `${counts.plants} plants, ${counts.companions} companion rows, ${counts.amendments} amendments checked`
    )
    if (errors.length) this.exitCode = 1
    else this.logger.success('No errors')
  }
}
