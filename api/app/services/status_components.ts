/**
 * The components shown on the status page.
 *
 * `api` is measured by the monitor over HTTP from outside the API process; the
 * rest are reported by the API's own readiness checks.
 */
export const COMPONENTS = [
  { id: 'api', name: 'API', description: 'Public HTTP endpoints' },
  { id: 'database', name: 'Database', description: 'Accounts, API keys and usage tracking' },
  { id: 'plants', name: 'Plant data', description: 'Plant search, details, companions and amendments' },
  { id: 'climate', name: 'Frost & hardiness data', description: 'Frost dates, planting calendar and hardiness zones' },
  { id: 'moon', name: 'Moon phases', description: 'Moon phase calculations' },
  { id: 'rate_limiter', name: 'Rate limiting', description: 'Per-key request limits and quotas' },
] as const

export type ComponentId = (typeof COMPONENTS)[number]['id']

export type HealthStatus = 'operational' | 'degraded' | 'down'

export const COMPONENT_IDS = COMPONENTS.map((component) => component.id) as ComponentId[]

export const componentName = (id: string) => COMPONENTS.find((component) => component.id === id)?.name ?? id

/** Worst status wins: down, then degraded, then operational. */
export function worstStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.includes('down')) return 'down'
  if (statuses.includes('degraded')) return 'degraded'
  return 'operational'
}
