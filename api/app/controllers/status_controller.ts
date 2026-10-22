import { getStatus } from '#services/status_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class StatusController {
  /** Public status: current state, 90-day uptime, 24-hour latency and incidents. */
  async show({ response, serialize }: HttpContext) {
    const status = await getStatus()
    // Matches the service's own cache so a CDN can absorb a busy status page.
    response.header('Cache-Control', 'public, max-age=15')
    return serialize(status)
  }
}
