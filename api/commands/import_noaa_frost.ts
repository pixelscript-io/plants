import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { parse } from 'csv-parse/sync'
import { DateTime } from 'luxon'
import { execFile } from 'node:child_process'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { promisify } from 'node:util'

const run = promisify(execFile)

const ARCHIVE_URL =
  'https://www.ncei.noaa.gov/data/normals-annualseasonal/1991-2020/archive/us-climate-normals_1991-2020_v1.0.1_annualseasonal_multivariate_by-station_c20230404.tar.gz'
const CHUNK_SIZE = 200
// Stations whose frost dates rest on fewer years of data are too noisy to use.
const MIN_YEARS = 10

/** NOAA column for the 32F freeze probability dates (LST = last spring, FST = first fall). */
const column = (kind: 'LST' | 'FST', percent: 10 | 50 | 90) => `ANN-TMIN-PRB${kind}-T32FP${percent}`

const toMonthDay = (value: string | undefined) => {
  const match = value?.trim().match(/^(\d\d)\/(\d\d)$/)
  return match ? `${match[1]}-${match[2]}` : null
}

export default class ImportNoaaFrost extends BaseCommand {
  static commandName = 'import:noaa-frost'
  static description =
    'Import freeze dates from NOAA 1991-2020 climate normals (public domain) into frost_stations'
  static options: CommandOptions = { startApp: true }

  @flags.string({ description: 'Working directory for the archive', default: 'tmp/imports/noaa' })
  declare dir: string

  @flags.boolean({ description: 'Download and extract the archive again' })
  declare refresh: boolean

  async run() {
    const { default: db } = await import('@adonisjs/lucid/services/db')
    const workDir = this.app.makePath(this.dir)
    const archive = join(workDir, 'normals.tar.gz')
    const extracted = join(workDir, 'normals')

    if (this.refresh || !existsSync(archive)) {
      this.logger.info('Downloading NOAA climate normals (about 54 MB)')
      await mkdir(workDir, { recursive: true })
      const response = await fetch(ARCHIVE_URL)
      if (!response.ok || !response.body) {
        this.logger.error(`Download failed with HTTP ${response.status}`)
        this.exitCode = 1
        return
      }
      await pipeline(Readable.fromWeb(response.body as never), createWriteStream(archive))
    }

    if (this.refresh || !existsSync(extracted)) {
      this.logger.info('Extracting archive')
      await mkdir(extracted, { recursive: true })
      await run('tar', ['-xzf', archive, '-C', extracted], { maxBuffer: 1024 * 1024 })
    }

    const now = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    const stations: Record<string, unknown>[] = []
    let skippedNoData = 0
    let skippedFewYears = 0

    for (const file of (await readdir(extracted)).filter((name) => name.endsWith('.csv'))) {
      const [row] = parse(await readFile(join(extracted, file), 'utf8'), {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }) as Record<string, string>[]
      if (!row) continue

      const dates = {
        last_spring_conservative: toMonthDay(row[column('LST', 10)]),
        last_spring_average: toMonthDay(row[column('LST', 50)]),
        last_spring_optimistic: toMonthDay(row[column('LST', 90)]),
        first_fall_conservative: toMonthDay(row[column('FST', 10)]),
        first_fall_average: toMonthDay(row[column('FST', 50)]),
        first_fall_optimistic: toMonthDay(row[column('FST', 90)]),
      }
      if (Object.values(dates).some((value) => value === null)) {
        skippedNoData++
        continue
      }
      if (Number(row[`years_${column('LST', 50)}`]) < MIN_YEARS) {
        skippedFewYears++
        continue
      }

      // NAME looks like "ADDISON, AL US".
      stations.push({
        noaa_id: row.STATION.trim(),
        name: row.NAME.trim(),
        state: row.NAME.match(/,\s*([A-Z]{2})\s+US\s*$/)?.[1] ?? null,
        latitude: Number(row.LATITUDE),
        longitude: Number(row.LONGITUDE),
        elevation_m: Number(row.ELEVATION),
        ...dates,
        created_at: now,
        updated_at: now,
      })
    }

    for (let i = 0; i < stations.length; i += CHUNK_SIZE) {
      await db
        .knexQuery()
        .table('frost_stations')
        .insert(stations.slice(i, i + CHUNK_SIZE))
        .onConflict('noaa_id')
        .merge()
    }

    this.logger.success(
      `Imported ${stations.length} stations (skipped ${skippedNoData} without freeze dates, ${skippedFewYears} with under ${MIN_YEARS} years of data)`
    )
  }
}
