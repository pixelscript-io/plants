import { runChecks } from '#services/health_checks'
import { worstStatus } from '#services/status_components'
import type { HttpContext } from '@adonisjs/core/http'

export default class HealthController {
  /**
   * Liveness: the process is up and answering. Cheap and unthrottled, so load
   * balancers and the monitor can call it often. It checks nothing else.
   */
  live({ response }: HttpContext) {
    return response.ok({ status: 'ok', time: new Date().toISOString(), uptimeSeconds: Math.round(process.uptime()) })
  }

  /**
   * Readiness: the API can actually do its job. Runs the component checks and
   * answers 503 if any is down, so orchestrators stop sending traffic.
   */
  async ready({ response }: HttpContext) {
    const checks = await runChecks()
    const status = worstStatus(checks.map((check) => check.status))
    response.status(status === 'down' ? 503 : 200)
    return { status, time: new Date().toISOString(), checks }
  }
}
