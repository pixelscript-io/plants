import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

const GAZETTEER_URL =
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip'
const CHUNK_SIZE = 500

export default class ImportZips extends BaseCommand {
  static commandName = 'import:zips'
  static description =
    'Import ZIP Code Tabulation Area centroids from the US Census Gazetteer (public domain) into zip_codes'
  static options: CommandOptions = { startApp: true }

  @flags.string({ description: 'Working directory for the download', default: 'tmp/imports/census' })
  declare dir: string

  @flags.boolean({ description: 'Download the file again' })
  declare refresh: boolean

  async run() {
    const { default: db } = await import('@adonisjs/lucid/services/db')
    const workDir = this.app.makePath(this.dir)
    const archive = join(workDir, 'gaz_zcta.zip')
    const extracted = join(workDir, 'gaz_zcta')

    if (this.refresh || !existsSync(archive)) {
      this.logger.info('Downloading Census ZCTA Gazetteer')
      await mkdir(workDir, { recursive: true })
      const response = await fetch(GAZETTEER_URL)
      if (!response.ok) {
        this.logger.error(`Download failed with HTTP ${response.status}`)
        this.exitCode = 1
        return
      }
      await writeFile(archive, Buffer.from(await response.arrayBuffer()))
    }

    if (this.refresh || !existsSync(extracted)) {
      await mkdir(extracted, { recursive: true })
      // bsdtar (Windows 10+, macOS) reads zip archives; GNU tar does not.
      await run('tar', ['-xf', archive, '-C', extracted])
    }

    const text = await readFile(join(extracted, '2023_Gaz_zcta_national.txt'), 'utf8')
    const [header, ...lines] = text.split(/\r?\n/).filter(Boolean)
    const names = header.split('\t').map((name) => name.trim())
    const geoid = names.indexOf('GEOID')
    const lat = names.indexOf('INTPTLAT')
    const lng = names.indexOf('INTPTLONG')
    if ([geoid, lat, lng].includes(-1)) {
      this.logger.error(`Unexpected columns: ${names.join(', ')}`)
      this.exitCode = 1
      return
    }

    const now = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    const zips = lines.map((line) => {
      const cells = line.split('\t')
      return {
        zip: cells[geoid].trim(),
        latitude: Number(cells[lat]),
        longitude: Number(cells[lng]),
        created_at: now,
        updated_at: now,
      }
    })

    for (let i = 0; i < zips.length; i += CHUNK_SIZE) {
      await db
        .knexQuery()
        .table('zip_codes')
        .insert(zips.slice(i, i + CHUNK_SIZE))
        .onConflict('zip')
        .merge()
    }

    this.logger.success(`Imported ${zips.length} ZIP code areas`)
  }
}
