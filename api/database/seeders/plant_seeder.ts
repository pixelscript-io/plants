import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Plant from '#models/plant'
import PlantName from '#models/plant_name'
import PlantSource from '#models/plant_source'
import RawRecord from '#models/raw_record'
import { CROSSCHECK_DATE, CROSSCHECK_DATE_BY_PLANT, SOURCES, crosschecks } from './data/crosschecks.js'
import { plants, type Range } from './data/plants.js'

type UsdaPayload = {
  symbol: string
  scientificName: string
  family: string | null
  synonyms: { symbol: string; scientificName: string }[]
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const tokens = (name: string) => name.replace(/×/g, '').trim().split(/\s+/)
const isAuthorToken = (token?: string) => !token || /^[A-Z(]/.test(token)

/** "Solanum lycopersicum L." -> "solanum lycopersicum"; genus records -> "rosa". */
function lookupKey(scientificName: string): string | null {
  const [genus, epithet] = tokens(scientificName)
  if (!genus) return null
  if (isAuthorToken(epithet)) return genus.toLowerCase()
  return `${genus} ${epithet}`.toLowerCase()
}

const hasInfraspecificRank = (scientificName: string) =>
  /\s(var\.|ssp\.|subsp\.|f\.|subvar\.)\s/.test(scientificName)

const min = (range?: Range) => range?.[0] ?? null
const max = (range?: Range) => range?.[1] ?? null

export default class PlantSeeder extends BaseSeeder {
  async run() {
    const records = await RawRecord.query().where('source', 'usda_plants')
    if (records.length === 0) {
      throw new Error('No USDA records staged. Run `node ace import:usda` first.')
    }

    // Index accepted names, preferring species-level over infraspecific records.
    const accepted = new Map<string, UsdaPayload>()
    const viaSynonym = new Map<string, UsdaPayload>()
    for (const record of records) {
      const payload = record.payload as unknown as UsdaPayload
      const key = lookupKey(payload.scientificName)
      if (key) {
        const existing = accepted.get(key)
        if (!existing || (hasInfraspecificRank(existing.scientificName) && !hasInfraspecificRank(payload.scientificName))) {
          accepted.set(key, payload)
        }
      }
      for (const synonym of payload.synonyms) {
        const synonymKey = lookupKey(synonym.scientificName)
        if (synonymKey && !viaSynonym.has(synonymKey)) viaSynonym.set(synonymKey, payload)
      }
    }

    const unmatched: string[] = []
    const synonymMatches: string[] = []
    const now = DateTime.now()

    for (const seed of plants) {
      const key = lookupKey(seed.sci)!
      let usda = accepted.get(key)
      if (!usda) {
        usda = viaSynonym.get(key)
        if (usda) synonymMatches.push(`${seed.name} (${seed.sci} -> ${usda.scientificName})`)
        else unmatched.push(`${seed.name} (${seed.sci})`)
      }

      const plant = await Plant.updateOrCreate(
        { slug: slugify(seed.name) },
        {
          commonName: seed.name,
          scientificName: seed.sci,
          genus: tokens(seed.sci)[0],
          family: usda?.family ?? null,
          usdaSymbol: usda?.symbol ?? null,
          plantType: seed.type,
          lifeCycle: seed.life,
          sun: seed.sun,
          waterNeeds: seed.water,
          wateringIntervalDays: seed.wi ?? null,
          soilPhMin: min(seed.ph),
          soilPhMax: max(seed.ph),
          hardinessZoneMin: min(seed.zones),
          hardinessZoneMax: max(seed.zones),
          frostTolerance: seed.frost ?? null,
          daysToGerminationMin: min(seed.germ),
          daysToGerminationMax: max(seed.germ),
          daysToHarvestMin: min(seed.harvest),
          daysToHarvestMax: max(seed.harvest),
          spacingCm: seed.spacing ?? null,
          heightCm: seed.height ?? null,
          sowIndoorsWeeksMin: min(seed.indoors),
          sowIndoorsWeeksMax: max(seed.indoors),
          directSowWeeksMin: min(seed.direct),
          directSowWeeksMax: max(seed.direct),
          transplantWeeksMin: min(seed.transplant),
          transplantWeeksMax: max(seed.transplant),
        }
      )

      await PlantName.query().where('plantId', plant.id).delete()
      const names = [seed.name, ...(seed.aka ?? [])]
      await PlantName.createMany(names.map((name) => ({ plantId: plant.id, name, language: 'en' })))

      await PlantSource.query()
        .where('plantId', plant.id)
        .whereIn('source', ['curated', 'usda_plants', 'extension_crosscheck'])
        .delete()
      await PlantSource.create({
        plantId: plant.id,
        field: '*',
        source: 'curated',
        license: 'Original',
        attribution:
          'Hand-curated from general horticultural knowledge. Values other than those listed as cross-checked have not been independently verified.',
        fetchedAt: now,
      })

      const checked = crosschecks[plant.slug]
      if (checked) {
        await PlantSource.create({
          plantId: plant.id,
          field: 'planting_and_harvest',
          source: 'extension_crosscheck',
          license: 'Original',
          attribution: `Planting windows and days to harvest cross-checked on ${CROSSCHECK_DATE_BY_PLANT[plant.slug] ?? CROSSCHECK_DATE} against: ${checked
            .map((key) => SOURCES[key])
            .join('; ')}. Values are our own curation, not copied.`,
          fetchedAt: now,
        })
      }
      if (usda) {
        await PlantSource.createMany(
          (['usda_symbol', 'family'] as const).map((field) => ({
            plantId: plant.id,
            field,
            source: 'usda_plants',
            sourceId: usda.symbol,
            license: 'US-Government-Public-Domain',
            fetchedAt: now,
          }))
        )
      }
    }

    console.log(`Seeded ${plants.length} plants; ${plants.length - unmatched.length} linked to a USDA symbol.`)
    if (synonymMatches.length) console.log(`Matched via USDA synonym:\n  ${synonymMatches.join('\n  ')}`)
    if (unmatched.length) console.log(`No USDA match:\n  ${unmatched.join('\n  ')}`)
  }
}
