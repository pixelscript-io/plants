import Heartbeat from '#models/heartbeat'
import HeartbeatDaily from '#models/heartbeat_daily'
import Incident from '#models/incident'
import { COMPONENTS, type HealthStatus } from '#services/status_components'
import { DateTime } from 'luxon'

export type OverallStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'unknown'
export type DayStatus = 'operational' | 'degraded' | 'outage' | 'no_data'

export const HISTORY_DAYS = 90
const LATENCY_HOURS = 24
const LATENCY_BUCKET_MINUTES = 30
const RECENT_INCIDENT_DAYS = 30
/** No heartbeat for this long means the monitor itself has stopped. */
export const STALE_AFTER_MS = 3 * 60 * 1000
const CACHE_MS = 15_000

/** A day counts as an outage after a few failed probes, not a single blip. */
function dayStatus(counts: { checks: number; degraded: number; down: number }): DayStatus {
  if (counts.checks === 0) return 'no_data'
  if (counts.down >= 3) return 'outage'
  if (counts.down >= 1 || counts.degraded >= 3) return 'degraded'
  return 'operational'
}

const iso = (value: DateTime | null) => (value ? value.toUTC().toISO() : null)

async function build() {
  const now = DateTime.utc()

  // ---- Latest heartbeat per component ----
  const latest = new Map<string, Heartbeat>()
  for (const component of COMPONENTS) {
    const row = await Heartbeat.query().where('component', component.id).orderBy('id', 'desc').first()
    if (row) latest.set(component.id, row)
  }
  const newest = [...latest.values()].reduce<DateTime | null>(
    (best, row) => (!best || row.checkedAt > best ? row.checkedAt : best),
    null
  )
  const stale = !newest || now.toMillis() - newest.toMillis() > STALE_AFTER_MS

  // ---- Daily history ----
  const from = now.minus({ days: HISTORY_DAYS - 1 }).toFormat('yyyy-MM-dd')
  const daily = await HeartbeatDaily.query().where('day', '>=', from).orderBy('day')
  const dailyByComponent = new Map<string, Map<string, HeartbeatDaily>>()
  for (const row of daily) {
    if (!dailyByComponent.has(row.component)) dailyByComponent.set(row.component, new Map())
    dailyByComponent.get(row.component)!.set(row.day, row)
  }
  const days = Array.from({ length: HISTORY_DAYS }, (_, index) =>
    now.minus({ days: HISTORY_DAYS - 1 - index }).toFormat('yyyy-MM-dd')
  )

  // ---- Recent latency, averaged into buckets ----
  const since = now.minus({ hours: LATENCY_HOURS })
  const recent = await Heartbeat.query()
    .where('checkedAt', '>=', since.toFormat('yyyy-MM-dd HH:mm:ss'))
    .whereNot('status', 'down')
    .whereNotNull('latencyMs')
    .orderBy('checkedAt')
  const bucketMs = LATENCY_BUCKET_MINUTES * 60 * 1000
  const buckets = new Map<string, Map<number, { sum: number; count: number }>>()
  for (const row of recent) {
    const start = Math.floor(row.checkedAt.toMillis() / bucketMs) * bucketMs
    const byBucket = buckets.get(row.component) ?? new Map()
    const bucket = byBucket.get(start) ?? { sum: 0, count: 0 }
    bucket.sum += row.latencyMs!
    bucket.count++
    byBucket.set(start, bucket)
    buckets.set(row.component, byBucket)
  }

  // ---- Components ----
  const components = COMPONENTS.map((component) => {
    const heartbeat = latest.get(component.id)
    const rows = dailyByComponent.get(component.id) ?? new Map<string, HeartbeatDaily>()

    let checks = 0
    let down = 0
    const history = days.map((day) => {
      const row = rows.get(day)
      checks += row?.checks ?? 0
      down += row?.down ?? 0
      return {
        day,
        status: dayStatus(row ?? { checks: 0, degraded: 0, down: 0 }),
        checks: row?.checks ?? 0,
        uptime: row && row.checks > 0 ? round(((row.checks - row.down) / row.checks) * 100) : null,
      }
    })

    return {
      id: component.id,
      name: component.name,
      description: component.description,
      status: (heartbeat?.status ?? 'unknown') as HealthStatus | 'unknown',
      latencyMs: heartbeat?.latencyMs ?? null,
      message: heartbeat?.message ?? null,
      checkedAt: iso(heartbeat?.checkedAt ?? null),
      uptime90d: checks > 0 ? round(((checks - down) / checks) * 100) : null,
      days: history,
      latency: [...(buckets.get(component.id) ?? new Map()).entries()]
        .sort(([a], [b]) => a - b)
        .map(([start, { sum, count }]) => ({
          at: DateTime.fromMillis(start, { zone: 'utc' }).toISO()!,
          ms: Math.round(sum / count),
        })),
    }
  })

  // ---- Overall ----
  let status: OverallStatus = 'operational'
  if (stale) status = 'unknown'
  else if (components.find((c) => c.id === 'api')?.status === 'down') status = 'major_outage'
  else if (components.some((c) => c.status === 'down')) status = 'partial_outage'
  else if (components.some((c) => c.status === 'degraded')) status = 'degraded'

  // ---- Incidents ----
  const toIncident = (incident: Incident) => ({
    id: incident.id,
    component: incident.component,
    componentName: COMPONENTS.find((c) => c.id === incident.component)?.name ?? incident.component,
    severity: incident.severity as 'degraded' | 'down',
    title: incident.title,
    message: incident.message,
    startedAt: iso(incident.startedAt),
    resolvedAt: iso(incident.resolvedAt),
    durationMinutes: Math.max(
      0,
      Math.round(((incident.resolvedAt ?? now).toMillis() - incident.startedAt.toMillis()) / 60000)
    ),
  })
  const active = await Incident.query().whereNull('resolvedAt').orderBy('startedAt', 'desc')
  const resolved = await Incident.query()
    .whereNotNull('resolvedAt')
    .where('startedAt', '>=', now.minus({ days: RECENT_INCIDENT_DAYS }).toFormat('yyyy-MM-dd HH:mm:ss'))
    .orderBy('startedAt', 'desc')
    .limit(20)

  return {
    status,
    updatedAt: now.toISO()!,
    monitoring: { lastHeartbeatAt: iso(newest), stale },
    components,
    incidents: { active: active.map(toIncident), recent: resolved.map(toIncident) },
  }
}

const round = (value: number) => Math.round(value * 100) / 100

let cached: { at: number; value: Awaited<ReturnType<typeof build>> } | null = null

/** The status snapshot, cached briefly so a busy status page is cheap to serve. */
export async function getStatus() {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value
  const value = await build()
  cached = { at: Date.now(), value }
  return value
}

/** For tests: drop the cached snapshot. */
export const clearStatusCache = () => {
  cached = null
}
