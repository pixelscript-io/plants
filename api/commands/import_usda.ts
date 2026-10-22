import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { parse } from 'csv-parse/sync'
import { DateTime } from 'luxon'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const SOURCE = 'usda_plants'
const LICENSE = 'US-Government-Public-Domain'
const DOWNLOAD_URL = 'https://plants.sc.egov.usda.gov/DocumentLibrary/Txt/plantlst.txt'
const CHUNK_SIZE = 500

type ChecklistRow = {
  Symbol: string
  'Synonym Symbol': string
  'Scientific Name with Author': string
  'Common Name': string
  Family: string
}

export default class ImportUsda extends BaseCommand {
  static commandName = 'import:usda'
  static description =
    'Stage the USDA PLANTS Complete Checklist (public domain) into raw_records, one record per accepted symbol'
  static options: CommandOptions = { startApp: true }

  @flags.string({ description: 'Path of the checklist file', default: 'tmp/imports/plantlst.txt' })
  declare file: string

  @flags.boolean({ description: 'Download the checklist again even if the file exists' })
  declare refresh: boolean

  async run() {
    const { default: db } = await import('@adonisjs/lucid/services/db')
    const path = this.app.makePath(this.file)

    if (this.refresh || !existsSync(path)) {
      this.logger.info(`Downloading ${DOWNLOAD_URL}`)
      const response = await fetch(DOWNLOAD_URL)
      if (!response.ok) {
        this.logger.error(`Download failed with HTTP ${response.status}`)
        this.exitCode = 1
        return
      }
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, Buffer.from(await response.arrayBuffer()))
    }

    const csv = await readFile(path, 'utf8')
    const rows = parse(csv, { columns: true, skip_empty_lines: true, bom: true }) as ChecklistRow[]

    // An accepted name has an empty "Synonym Symbol"; the rows after it that
    // share its "Symbol" are that name's synonyms.
    const accepted = new Map<string, Record<string, unknown>>()
    for (const row of rows) {
      const symbol = row.Symbol
      if (!row['Synonym Symbol']) {
        accepted.set(symbol, {
          symbol,
          scientificName: row['Scientific Name with Author'],
          commonName: row['Common Name'] || null,
          family: row.Family || null,
          synonyms: [],
        })
      } else {
        const record = accepted.get(symbol)
        if (record) {
          ;(record.synonyms as unknown[]).push({
            symbol: row['Synonym Symbol'],
            scientificName: row['Scientific Name with Author'],
          })
        }
      }
    }

    const now = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    const records = [...accepted.values()].map((payload) => ({
      source: SOURCE,
      source_id: payload.symbol as string,
      payload: JSON.stringify(payload),
      license: LICENSE,
      fetched_at: now,
      created_at: now,
      updated_at: now,
    }))

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      await db
        .knexQuery()
        .table('raw_records')
        .insert(records.slice(i, i + CHUNK_SIZE))
        .onConflict(['source', 'source_id'])
        .merge(['payload', 'license', 'fetched_at', 'updated_at'])
    }

    this.logger.success(
      `Staged ${records.length} accepted names (${rows.length - records.length} synonym rows folded in)`
    )
  }
}
