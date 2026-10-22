import type { ComponentStatus, DayStatus, OverallStatus } from '~/types/api'

// One palette for dots, bars and the banner, so they always agree.
export const STATUS_COLORS = {
  operational: 'oklch(0.62 0.17 150)',
  degraded: 'oklch(0.75 0.16 70)',
  down: 'oklch(0.6 0.22 27)',
  outage: 'oklch(0.6 0.22 27)',
  partial_outage: 'oklch(0.68 0.19 45)',
  major_outage: 'oklch(0.6 0.22 27)',
  unknown: 'oklch(0.65 0 0)',
  no_data: 'oklch(0.65 0 0 / 35%)',
} as const

export const OVERALL_LABELS: Record<OverallStatus, { title: string; detail: string }> = {
  operational: { title: 'All systems operational', detail: 'Everything is working normally.' },
  degraded: { title: 'Degraded performance', detail: 'Some systems are responding slowly.' },
  partial_outage: { title: 'Partial outage', detail: 'Some systems are not working.' },
  major_outage: { title: 'Major outage', detail: 'The API is not responding.' },
  unknown: { title: 'Status unavailable', detail: 'Monitoring is not reporting right now, so we cannot confirm the current state.' },
}

export const COMPONENT_LABELS: Record<ComponentStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  unknown: 'Unknown',
}

export const DAY_LABELS: Record<DayStatus, string> = {
  operational: 'No issues',
  degraded: 'Some issues',
  outage: 'Outage',
  no_data: 'No data',
}

/** "under a minute", "25 min", "1 h 20 min". */
export function formatDuration(minutes: number) {
  if (minutes < 1) return 'under a minute'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}
