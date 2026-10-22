import Heartbeat from '#models/heartbeat'
import Incident from '#models/incident'
import { COMPONENT_IDS, componentName, worstStatus, type ComponentId, type HealthStatus } from '#services/status_components'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export interface Probe {
  id: ComponentId
  status: HealthStatus
  latencyMs: number | null
  message: string | null
}

/** Probes in a row that must fail before an incident opens, or pass before it closes. */
export const OPEN_AFTER = 2
export const CLOSE_AFTER = 2

/** How long raw heartbeats are kept. Daily rollups are kept indefinitely. */
export const RAW_RETENTION_HOURS = 48

const dayKey = (at: DateTime) => at.toUTC().toFormat('yyyy-MM-dd')

/** Stores one probe and updates that day's counters in a single upsert. */
async function store(probe: Probe, at: DateTime) {
  await Heartbeat.create({
    component: probe.id,
    status: probe.status,
    latencyMs: probe.latencyMs,
    message: probe.message,
    checkedAt: at,
  })

  // Latency of a failed probe says nothing about normal performance.
  const counted = probe.status !== 'down' && probe.latencyMs !== null
  await db.rawQuery(
    `insert into heartbeat_daily
       (component, day, checks, operational, degraded, down, latency_sum_ms, latency_samples)
     values (?, ?, 1, ?, ?, ?, ?, ?)
     on conflict (component, day) do update set
       checks = heartbeat_daily.checks + 1,
       operational = heartbeat_daily.operational + excluded.operational,
       degraded = heartbeat_daily.degraded + excluded.degraded,
       down = heartbeat_daily.down + excluded.down,
       latency_sum_ms = heartbeat_daily.latency_sum_ms + excluded.latency_sum_ms,
       latency_samples = heartbeat_daily.latency_samples + excluded.latency_samples`,
    [
      probe.id,
      dayKey(at),
      probe.status === 'operational' ? 1 : 0,
      probe.status === 'degraded' ? 1 : 0,
      probe.status === 'down' ? 1 : 0,
      counted ? probe.latencyMs : 0,
      counted ? 1 : 0,
    ]
  )
}

/**
 * Opens an incident after OPEN_AFTER bad probes in a row, raises its severity
 * if things get worse, and resolves it after CLOSE_AFTER good probes.
 */
async function updateIncident(component: ComponentId) {
  const recent = await Heartbeat.query()
    .where('component', component)
    .orderBy('checkedAt', 'desc')
    .orderBy('id', 'desc')
    .limit(Math.max(OPEN_AFTER, CLOSE_AFTER))
  const open = await Incident.query().where('component', component).whereNull('resolvedAt').first()

  const latest = (count: number) => recent.slice(0, count)
  const name = componentName(component)

  if (!open) {
    const window = latest(OPEN_AFTER)
    if (window.length === OPEN_AFTER && window.every((h) => h.status !== 'operational')) {
      const severity = worstStatus(window.map((h) => h.status as HealthStatus)) as 'degraded' | 'down'
      await Incident.create({
        component,
        severity,
        title: severity === 'down' ? `${name} is down` : `${name} is degraded`,
        message: window[0].message,
        // The first bad probe is when the problem started.
        startedAt: window[window.length - 1].checkedAt,
      })
    }
    return
  }

  const window = latest(CLOSE_AFTER)
  if (window.length === CLOSE_AFTER && window.every((h) => h.status === 'operational')) {
    open.resolvedAt = window[window.length - 1].checkedAt
    await open.save()
    return
  }

  // Escalate a degraded incident that has become a full outage.
  if (open.severity === 'degraded' && recent[0]?.status === 'down') {
    open.severity = 'down'
    open.title = `${name} is down`
    open.message = recent[0].message
    await open.save()
  }
}

/** Records one round of probes. Safe to call repeatedly. */
export async function recordProbes(probes: Probe[], at = DateTime.utc()) {
  // When the API itself is down, every component is unreachable too. Their
  // heartbeats still count toward uptime, but one "API is down" incident tells
  // the story; six identical ones would be noise.
  const apiDown = probes.some((probe) => probe.id === 'api' && probe.status === 'down')

  for (const probe of probes) {
    if (!COMPONENT_IDS.includes(probe.id)) continue
    await store(probe, at)
    if (probe.id !== 'api' && apiDown && probe.status === 'down') continue
    await updateIncident(probe.id)
  }
}

/** Deletes raw heartbeats past retention. Daily rollups are untouched. */
export async function pruneHeartbeats(now = DateTime.utc()) {
  const cutoff = now.minus({ hours: RAW_RETENTION_HOURS })
  return Heartbeat.query().where('checkedAt', '<', cutoff.toFormat('yyyy-MM-dd HH:mm:ss')).delete()
}
