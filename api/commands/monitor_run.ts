import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import env from '#start/env'
import { COMPONENT_IDS, type ComponentId, type HealthStatus } from '#services/status_components'
import type { Probe } from '#services/heartbeat_service'

/** The API itself is "degraded" if a trivial request takes longer than this. */
const API_DEGRADED_AFTER_MS = 1500

export default class MonitorRun extends BaseCommand {
  static commandName = 'monitor:run'
  static description =
    'Probe the API over HTTP and record heartbeats for the status page. Runs until stopped.'
  static options: CommandOptions = { startApp: true, staysAlive: true }

  @flags.string({ description: 'Base URL of the API to probe (default: this app\'s HOST and PORT)' })
  declare url: string

  @flags.number({ description: 'Seconds between probes', default: 60 })
  declare interval: number

  @flags.number({ description: 'Milliseconds before a request counts as failed', default: 10000 })
  declare timeout: number

  @flags.boolean({ description: 'Probe once and exit' })
  declare once: boolean

  async run() {
    const { pruneHeartbeats, recordProbes } = await import('#services/heartbeat_service')
    const baseUrl = (this.url ?? `http://${env.get('HOST')}:${env.get('PORT')}`).replace(/\/$/, '')
    this.logger.info(`Monitoring ${baseUrl} every ${this.interval}s`)

    let stopping = false
    const stop = () => {
      stopping = true
    }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)

    let cycles = 0
    while (!stopping) {
      const started = Date.now()
      try {
        const probes = await this.probe(baseUrl)
        await recordProbes(probes)
        this.logger.info(probes.map((probe) => `${probe.id}=${probe.status}`).join(' '))

        // Prune old raw heartbeats about once an hour.
        if (cycles % Math.max(1, Math.round(3600 / this.interval)) === 0) await pruneHeartbeats()
      } catch (error) {
        // For example the database is unreachable: log it and try again next cycle.
        this.logger.error(`Could not record heartbeats: ${error instanceof Error ? error.message : error}`)
      }
      cycles++

      if (this.once) break
      const wait = Math.max(0, this.interval * 1000 - (Date.now() - started))
      // Wake up early when asked to stop.
      for (let waited = 0; waited < wait && !stopping; waited += 500) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(500, wait - waited)))
      }
    }
    this.logger.info('Monitor stopped')
    // staysAlive keeps the process open after run() returns, so end it explicitly.
    await this.terminate()
  }

  /**
   * One round of probes. The API component is judged by a trivial liveness
   * request; the others by the API's own readiness checks. If the API cannot
   * be reached at all, every component is down from a user's point of view.
   */
  private async probe(baseUrl: string): Promise<Probe[]> {
    const allDown = (message: string): Probe[] =>
      COMPONENT_IDS.map((id) => ({ id, status: 'down', latencyMs: null, message }))

    const started = performance.now()
    let live: Response
    try {
      live = await fetch(`${baseUrl}/api/v1/health`, { signal: AbortSignal.timeout(this.timeout) })
    } catch (error) {
      return allDown(`API unreachable: ${describe(error)}`)
    }
    const apiLatency = Math.round(performance.now() - started)
    if (!live.ok) return allDown(`API returned HTTP ${live.status}`)

    const probes: Probe[] = [
      {
        id: 'api',
        status: apiLatency > API_DEGRADED_AFTER_MS ? 'degraded' : 'operational',
        latencyMs: apiLatency,
        message: apiLatency > API_DEGRADED_AFTER_MS ? `Responding slowly (${apiLatency} ms)` : null,
      },
    ]

    // Readiness answers 503 when a component is down but still carries the details.
    const reported = new Map<ComponentId, Probe>()
    let failure = ''
    try {
      const ready = await fetch(`${baseUrl}/api/v1/health/ready`, { signal: AbortSignal.timeout(this.timeout) })
      // A proxy error page is not JSON; report the status, not a parse error.
      const body = (await ready.json().catch(() => null)) as {
        checks?: { id: ComponentId; status: HealthStatus; latencyMs: number; message: string | null }[]
      } | null
      if (!Array.isArray(body?.checks)) failure = `Readiness check returned HTTP ${ready.status} without details`
      for (const check of body?.checks ?? []) {
        reported.set(check.id, { id: check.id, status: check.status, latencyMs: check.latencyMs, message: check.message })
      }
    } catch (error) {
      failure = `Readiness check failed: ${describe(error)}`
    }

    for (const id of COMPONENT_IDS) {
      if (id === 'api') continue
      probes.push(reported.get(id) ?? { id, status: 'down', latencyMs: null, message: failure || 'No result reported' })
    }
    return probes
  }
}

function describe(error: unknown) {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError') return 'timed out'
    // fetch wraps the real reason (for example ECONNREFUSED) in `cause`.
    const cause = (error as { cause?: { code?: string; message?: string } }).cause
    return cause?.code ?? cause?.message ?? error.message
  }
  return String(error)
}
