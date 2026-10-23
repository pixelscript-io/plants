import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import { KEPT_CHARACTERISTICS } from '#services/usda_characteristics'

const PROFILE_URL = 'https://plantsservices.sc.egov.usda.gov/api/PlantProfile?symbol='
const CHARACTERISTICS_URL = 'https://plantsservices.sc.egov.usda.gov/api/PlantCharacteristics/'
const WORKERS = 5
const PAUSE_MS = 300
const BATCH = 100
const INFRASPECIFIC = /\s(var\.|ssp\.|subsp\.|f\.|subvar\.)\s/

type Accepted = { symbol: string; scientificName: string; commonName: string; family: string }
type Profile = {
  Id: number
  HasCharacteristics: boolean
  Durations: string[] | null
  GrowthHabits: string[] | null
  NativeStatuses: { Region: string; Type: string }[] | null
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** GET as JSON, retrying a few times when USDA is slow or busy. Null when the symbol is unknown. */
async function getJson<T>(url: string): Promise<T | null> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url)
      if (response.status === 404) return null
      if (response.ok) return (await response.json()) as T
    } catch {
      // network error: retry
    }
    await sleep(1000 * attempt)
  }
  throw new Error(`USDA did not answer ${url}`)
}

export default class ImportUsdaCatalog extends BaseCommand {
  static commandName = 'import:usda-catalog'
  static description =
    'Probe every USDA species with a common name once and keep those with growing characteristics (public domain) in catalog_species. Resumable.'
  static options: CommandOptions = { startApp: true }

  @flags.number({ description: 'Probe at most this many new species (to try it out)' })
  declare limit: number

  async run() {
    const { default: db } = await import('@adonisjs/lucid/services/db')
    const { default: RawRecord } = await import('#models/raw_record')

    const done = new Set(
      (await db.knexQuery().table('catalog_species').select('usda_symbol')).map(
        (row: { usda_symbol: string }) => row.usda_symbol
      )
    )
    const curated = new Set(
      (await db.knexQuery().table('plants').select('usda_symbol').whereNotNull('usda_symbol')).map(
        (row: { usda_symbol: string }) => row.usda_symbol
      )
    )

    const records = await RawRecord.query().where('source', 'usda_plants')
    let todo = records
      .map((record) => record.payload as unknown as Accepted)
      .filter(
        (accepted) =>
          accepted.commonName &&
          !INFRASPECIFIC.test(accepted.scientificName) &&
          !done.has(accepted.symbol) &&
          !curated.has(accepted.symbol)
      )
    if (this.limit) todo = todo.slice(0, this.limit)
    this.logger.info(`${todo.length} species to probe (${done.size} already done)`)

    let probed = 0
    let kept = 0
    let failed = 0
    let pending: Record<string, unknown>[] = []
    const flush = async () => {
      if (pending.length === 0) return
      const rows = pending
      pending = []
      await db.knexQuery().table('catalog_species').insert(rows).onConflict('usda_symbol').ignore()
    }

    const queue = [...todo]
    const worker = async () => {
      for (let accepted = queue.shift(); accepted; accepted = queue.shift()) {
        const now = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
        try {
          const profile = await getJson<Profile>(`${PROFILE_URL}${encodeURIComponent(accepted.symbol)}`)
          let characteristics: Record<string, string> | null = null
          if (profile?.HasCharacteristics) {
            await sleep(PAUSE_MS)
            const rows = await getJson<
              { PlantCharacteristicName: string; PlantCharacteristicValue: string; CultivarName: string | null; SynonymName: string | null }[]
            >(`${CHARACTERISTICS_URL}${profile.Id}`)
            const found: Record<string, string> = {}
            for (const row of rows ?? []) {
              if (row.CultivarName || row.SynonymName) continue
              if ((KEPT_CHARACTERISTICS as readonly string[]).includes(row.PlantCharacteristicName)) {
                found[row.PlantCharacteristicName] = row.PlantCharacteristicValue
              }
            }
            if (Object.keys(found).length) characteristics = found
          }

          const types = [
            ...new Set(
              (profile?.NativeStatuses ?? []).filter((s) => s.Region === 'L48').map((s) => s.Type)
            ),
          ].sort()
          pending.push({
            usda_symbol: accepted.symbol,
            usda_id: profile?.Id ?? null,
            scientific_name: accepted.scientificName,
            common_name: accepted.commonName || null,
            family: accepted.family || null,
            durations: profile?.Durations?.length ? JSON.stringify(profile.Durations) : null,
            growth_habits: profile?.GrowthHabits?.length ? JSON.stringify(profile.GrowthHabits) : null,
            native_status_contiguous: types.length ? types.join(', ') : null,
            characteristics: characteristics ? JSON.stringify(characteristics) : null,
            has_characteristics: characteristics !== null,
            created_at: now,
            updated_at: now,
          })
          if (characteristics) kept++
        } catch (error) {
          // Not recorded, so the next run tries this species again.
          failed++
          this.logger.warning(`${accepted.symbol}: ${(error as Error).message}`)
        }
        probed++
        if (pending.length >= BATCH) await flush()
        if (probed % 500 === 0) this.logger.info(`${probed} probed, ${kept} with characteristics, ${failed} failed`)
        await sleep(PAUSE_MS)
      }
    }
    await Promise.all(Array.from({ length: WORKERS }, worker))
    await flush()

    this.logger.success(`Probed ${probed}: ${kept} with characteristics, ${failed} failed (run again to retry)`)
    if (failed > probed / 2) this.exitCode = 1
  }
}
