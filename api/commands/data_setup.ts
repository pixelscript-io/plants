import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { existsSync } from 'node:fs'

const IMPORTS = ['import:usda', 'import:noaa-frost', 'import:zips', 'import:hardiness-zones']
const SEEDERS = ['plant_seeder', 'companion_seeder', 'amendment_seeder']

export default class DataSetup extends BaseCommand {
  static commandName = 'data:setup'
  static description =
    'Load all data: download the public datasets, seed the curated plants, run the audit, and optionally publish'
  static options: CommandOptions = { startApp: true }

  @flags.boolean({ description: 'Publish every plant after the audit passes' })
  declare publish: boolean

  @flags.boolean({ description: 'Skip the downloads and only seed and audit (data already imported)' })
  declare skipImports: boolean

  async run() {
    if (!this.skipImports) {
      for (const name of IMPORTS) {
        if (!(await this.step(name, []))) return
      }
    }

    // Seeders are .ts when running from source and .js in a production build.
    const extension = existsSync(this.app.makePath('database/seeders/plant_seeder.ts')) ? 'ts' : 'js'
    const files = SEEDERS.flatMap((seeder) => ['--files', `database/seeders/${seeder}.${extension}`])
    if (!(await this.step('db:seed', files))) return

    // Needs the plants seeded above (it reads each plant's USDA symbol).
    if (!this.skipImports && !(await this.step('import:usda-traits', []))) return

    if (!(await this.step('plants:audit', []))) return
    if (this.publish && !(await this.step('plants:publish', ['--all']))) return

    this.logger.success('Data is ready')
  }

  /** Runs another command, and stops the whole setup if it fails. */
  private async step(name: string, args: string[]) {
    this.logger.info(`Running ${name}`)
    const command = await this.kernel.exec(name, args)
    if (command.exitCode) {
      this.logger.error(`${name} failed (exit code ${command.exitCode}); stopping`)
      this.exitCode = command.exitCode
      return false
    }
    return true
  }
}
