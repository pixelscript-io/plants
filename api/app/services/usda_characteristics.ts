/** The USDA PLANTS characteristics we keep, by USDA's own label. */
export const KEPT_CHARACTERISTICS = [
  'Shade Tolerance',
  'Drought Tolerance',
  'Moisture Use',
  'Fertility Requirement',
  'pH, Minimum',
  'pH, Maximum',
  'Precipitation, Minimum',
  'Precipitation, Maximum',
  'Temperature, Minimum (°F)',
  'Frost Free Days, Minimum',
  'Flower Color',
  'Bloom Period',
  'Growth Rate',
  'Height, Mature (feet)',
  'Toxicity',
  'Nitrogen Fixation',
  'Lifespan',
] as const

export type RawCharacteristics = Partial<Record<(typeof KEPT_CHARACTERISTICS)[number], string>>

const number = (value: string | undefined) => {
  const parsed = value === undefined || value.trim() === '' ? Number.NaN : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const range = (min: number | null, max: number | null) =>
  min === null && max === null ? null : { min, max }

/** Turns the stored USDA labels and strings into named, typed values. */
export function parseCharacteristics(raw: RawCharacteristics | null) {
  if (!raw) return null
  return {
    shadeTolerance: raw['Shade Tolerance'] ?? null,
    droughtTolerance: raw['Drought Tolerance'] ?? null,
    moistureUse: raw['Moisture Use'] ?? null,
    fertilityRequirement: raw['Fertility Requirement'] ?? null,
    soilPh: range(number(raw['pH, Minimum']), number(raw['pH, Maximum'])),
    annualPrecipitationIn: range(number(raw['Precipitation, Minimum']), number(raw['Precipitation, Maximum'])),
    minimumTemperatureF: number(raw['Temperature, Minimum (°F)']),
    minimumFrostFreeDays: number(raw['Frost Free Days, Minimum']),
    flowerColor: raw['Flower Color'] ?? null,
    bloomPeriod: raw['Bloom Period'] ?? null,
    growthRate: raw['Growth Rate'] ?? null,
    matureHeightFt: number(raw['Height, Mature (feet)']),
    toxicity: raw['Toxicity'] ?? null,
    nitrogenFixation: raw['Nitrogen Fixation'] ?? null,
    lifespan: raw['Lifespan'] ?? null,
  }
}

const NATIVE_STATUS: Record<string, 'native' | 'introduced' | 'native_and_introduced'> = {
  Native: 'native',
  Introduced: 'introduced',
  'Introduced, Native': 'native_and_introduced',
}

/** Native status in the lower 48 states as stored ("Native", "Introduced", "Introduced, Native"), as an API value. */
export const nativeStatusValue = (stored: string | null) => (stored ? (NATIVE_STATUS[stored] ?? null) : null)
