import HardinessZone from '#models/hardiness_zone'
import Plant from '#models/plant'
import ZipCode from '#models/zip_code'
import { nearestStation } from '#services/frost_service'
import type { ComponentId, HealthStatus } from '#services/status_components'
import { moonOn } from '#services/moon_service'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import limiter from '@adonisjs/limiter/services/main'

export interface CheckResult {
  id: ComponentId
  status: HealthStatus
  latencyMs: number
  message: string | null
}

const CHECK_TIMEOUT_MS = 5000

/**
 * A failure whose message is safe to show on the public status page. Any other
 * error (a database error, say) can contain table names or queries, so it is
 * logged on the server and shown only as "Check failed".
 */
class CheckFailure extends Error {}

/** A check passes by returning, and fails by throwing. */
type Check = { id: ComponentId; degradedAfterMs: number; run: () => Promise<void> }

const checks: Check[] = [
  {
    id: 'database',
    degradedAfterMs: 300,
    async run() {
      await db.rawQuery('select 1')
    },
  },
  {
    id: 'plants',
    degradedAfterMs: 500,
    async run() {
      const row = await Plant.visible().count('* as total').first()
      if (Number(row?.$extras.total ?? 0) === 0) throw new CheckFailure('No plants are available')
    },
  },
  {
    id: 'climate',
    degradedAfterMs: 800,
    async run() {
      // The same lookups the frost, calendar and hardiness endpoints make.
      const station = await nearestStation({ zip: null, latitude: 42.3588, longitude: -71.1296 })
      if (!station) throw new CheckFailure('Frost station lookup returned nothing')
      if (!(await ZipCode.find('02134'))) throw new CheckFailure('ZIP code data is missing')
      if (!(await HardinessZone.find('02134'))) throw new CheckFailure('Hardiness zone data is missing')
    },
  },
  {
    id: 'moon',
    degradedAfterMs: 200,
    async run() {
      const moon = moonOn(new Date())
      if (!(moon.illumination >= 0 && moon.illumination <= 100)) throw new CheckFailure('Moon calculation is out of range')
    },
  },
  {
    id: 'rate_limiter',
    degradedAfterMs: 300,
    async run() {
      // Reads the limiter's store (without consuming a request).
      await limiter.use({ requests: 10, duration: '1 minute' }).remaining('health_probe')
    },
  },
]

async function runCheck(check: Check): Promise<CheckResult> {
  const started = performance.now()
  try {
    let timer: NodeJS.Timeout | undefined
    await Promise.race([
      check.run(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new CheckFailure(`Timed out after ${CHECK_TIMEOUT_MS / 1000}s`)), CHECK_TIMEOUT_MS)
      }),
    ]).finally(() => clearTimeout(timer))

    const latencyMs = Math.round(performance.now() - started)
    const slow = latencyMs > check.degradedAfterMs
    return {
      id: check.id,
      status: slow ? 'degraded' : 'operational',
      latencyMs,
      message: slow ? `Responding slowly (${latencyMs} ms)` : null,
    }
  } catch (error) {
    if (!(error instanceof CheckFailure)) {
      logger.error({ err: error, check: check.id }, 'Health check failed')
    }
    return {
      id: check.id,
      status: 'down',
      latencyMs: Math.round(performance.now() - started),
      message: error instanceof CheckFailure ? error.message : 'Check failed',
    }
  }
}

/** Runs every readiness check at once. */
export const runChecks = () => Promise.all(checks.map(runCheck))
