import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { parse } from 'csv-parse/sync'
import { DateTime } from 'luxon'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Imports the USDA Plant Hardiness Zone ZIP code listings (2023) published by
 * the PRISM Group at Oregon State University.
 *
 * OSU's terms allow free redistribution only if the data is not altered. Every
 * value is therefore stored exactly as it appears in the CSV: no trimming,
 * case changes, parsing or derived columns. Keep it that way.
 */
const REGIONS = ['us', 'ak', 'hi', 'pr'] as const
const urlFor = (region: string) =>
  `https://prism.oregonstate.edu/phzm/data/2023/phzm_${region}_zipcode_2023.csv`
const CHUNK_SIZE = 500

export default class ImportHardinessZones extends BaseCommand {
  static commandName = 'import:hardiness-zones'
  static description =
    'Import USDA Plant Hardiness Zones by ZIP (OSU PRISM, 2023) verbatim into hardiness_zones'
  static options: CommandOptions = { startApp: true }

  @flags.string({ description: 'Working directory for the downloads', default: 'tmp/imports/prism' })
  declare dir: string

  @flags.boolean({ description: 'Download the files again' })
  declare refresh: boolean

  async run() {
    const { default: db } = await import('@adonisjs/lucid/services/db')
    const workDir = this.app.makePath(this.dir)
    await mkdir(workDir, { recursive: true })

    const now = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    const rows: Record<string, string>[] = []

    for (const region of REGIONS) {
      const path = join(workDir, `phzm_${region}_zipcode_2023.csv`)
      if (this.refresh || !existsSync(path)) {
        this.logger.info(`Downloading ${urlFor(region)}`)
        const response = await fetch(urlFor(region))
        if (!response.ok) {
          this.logger.error(`Download failed with HTTP ${response.status}`)
          this.exitCode = 1
          return
        }
        await writeFile(path, Buffer.from(await response.arrayBuffer()))
      }

      const records = parse(await readFile(path, 'utf8'), {
        columns: true,
        skip_empty_lines: true,
        // Values are kept exactly as published.
        trim: false,
      }) as { zipcode: string; zone: string; trange: string; zonetitle: string }[]

      for (const record of records) {
        if (!/^\d{5}$/.test(record.zipcode)) {
          this.logger.error(`Unexpected ZIP "${record.zipcode}" in ${region}; aborting without writing`)
          this.exitCode = 1
          return
        }
        rows.push({
          zip: record.zipcode,
          zone: record.zone,
          trange: record.trange,
          zonetitle: record.zonetitle,
          region,
          created_at: now,
          updated_at: now,
        })
      }
    }

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      await db
        .knexQuery()
        .table('hardiness_zones')
        .insert(rows.slice(i, i + CHUNK_SIZE))
        .onConflict('zip')
        .merge(['zone', 'trange', 'zonetitle', 'region', 'updated_at'])
    }

    this.logger.success(`Imported ${rows.length} ZIP codes with hardiness zones`)
  }
}
