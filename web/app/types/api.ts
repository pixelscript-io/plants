// Shapes returned by the Plants API (see its /openapi.json).

export interface User {
  id: number
  fullName: string | null
  email: string
  createdAt: string
  updatedAt: string | null
  initials: string
  /** Whether the email address is confirmed. Unconfirmed accounts cannot create API keys. */
  emailVerified: boolean
}

export interface ApiKey {
  id: number
  name: string
  /** First characters of the key, to tell keys apart. */
  prefix: string
  tier: 'free' | 'pro'
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
  limits: { perMinute: number; perDay: number }
}

export interface UsageCounts {
  requests: number
  errors: number
  rateLimited: number
}

export interface UsageDay extends UsageCounts {
  /** UTC day, YYYY-MM-DD. */
  day: string
}

export interface ApiKeyUsage {
  apiKey: ApiKey
  days: number
  totals: UsageCounts
  series: UsageDay[]
}

export interface AuthResponse {
  user: User
  token: string
}

export interface CreatedApiKey {
  apiKey: ApiKey
  /** The full key. Returned once and never again. */
  key: string
}

export interface ApiErrorItem {
  message: string
  field?: string
  rule?: string
}

// ---- Plants ----

export type PlantType = 'vegetable' | 'herb' | 'fruit' | 'flower' | 'shrub' | 'tree'
export type LifeCycle = 'annual' | 'biennial' | 'perennial'
export type Sun = 'full' | 'partial' | 'shade'
export type WaterNeeds = 'low' | 'medium' | 'high'
export type FrostTolerance = 'tender' | 'half_hardy' | 'hardy'

export interface PlantSummary {
  id: number
  slug: string
  commonName: string
  scientificName: string | null
  family: string | null
  plantType: PlantType | null
  lifeCycle: LifeCycle | null
  imageUrl: string | null
  sun: Sun | null
  waterNeeds: WaterNeeds | null
  frostTolerance: FrostTolerance | null
}

export interface PageMetadata {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export interface Range {
  min: number | null
  max: number | null
}

export interface CompanionPlant {
  slug: string
  commonName: string
  reason: string | null
}

export interface PlantDetail {
  id: number
  slug: string
  commonName: string
  scientificName: string | null
  family: string | null
  genus: string | null
  plantType: PlantType | null
  lifeCycle: LifeCycle | null
  description: string | null
  imageUrl: string | null
  usdaSymbol: string | null
  names: { name: string; language: string }[]
  care: {
    sun: Sun | null
    waterNeeds: WaterNeeds | null
    wateringIntervalDays: number | null
    soilPh: Range | null
    soilTypes: string[] | null
    hardinessZones: Range | null
    frostTolerance: FrostTolerance | null
  }
  growth: {
    daysToGermination: Range | null
    daysToHarvest: Range | null
    spacingCm: number | null
    heightCm: number | null
  }
  /** Weeks relative to the average last spring frost; negative is before. */
  planting: {
    sowIndoorsWeeks: Range | null
    directSowWeeks: Range | null
    transplantWeeks: Range | null
  }
  companions: {
    beneficial: CompanionPlant[]
    antagonistic: CompanionPlant[]
    culinary: CompanionPlant[]
  }
  amendments: { slug: string; name: string; effect: string | null }[]
  sources: { source: string; license: string; attribution: string | null }[]
}

export type Risk = 'conservative' | 'average' | 'optimistic'

export interface DateWindow {
  start: string
  end: string
}

export interface PlantCalendar {
  slug: string
  commonName: string
  frostTolerance: FrostTolerance | null
  windows: { sowIndoors: DateWindow | null; directSow: DateWindow | null; transplant: DateWindow | null }
  harvest: { earliest: string; latest: string } | null
  warnings: string[]
}

export interface CalendarResponse {
  location: { zip: string | null; latitude: number; longitude: number }
  station: { id: string; name: string; state: string | null; distanceKm: number }
  year: number
  risk: Risk
  lastSpringFrost: string
  firstFallFrost: string
  mildWinter: boolean
  notes: string[]
  plants: PlantCalendar[]
}

// ---- Status ----

export type OverallStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'unknown'
export type ComponentStatus = 'operational' | 'degraded' | 'down' | 'unknown'
export type DayStatus = 'operational' | 'degraded' | 'outage' | 'no_data'

export interface StatusDay {
  day: string
  status: DayStatus
  checks: number
  uptime: number | null
}

export interface StatusComponent {
  id: string
  name: string
  description: string
  status: ComponentStatus
  latencyMs: number | null
  message: string | null
  checkedAt: string | null
  uptime90d: number | null
  days: StatusDay[]
  latency: { at: string; ms: number }[]
}

export interface StatusIncident {
  id: number
  component: string
  componentName: string
  severity: 'degraded' | 'down'
  title: string
  message: string | null
  startedAt: string
  resolvedAt: string | null
  durationMinutes: number
}

export interface StatusSnapshot {
  status: OverallStatus
  updatedAt: string
  monitoring: { lastHeartbeatAt: string | null; stale: boolean }
  components: StatusComponent[]
  incidents: { active: StatusIncident[]; recent: StatusIncident[] }
}
