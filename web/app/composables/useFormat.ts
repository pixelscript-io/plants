const numberFormat = new Intl.NumberFormat('en-US')
const dateFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

export function useFormat() {
  const number = (value: number) => numberFormat.format(value)

  const date = (iso: string) => dateFormat.format(new Date(iso))

  /** "3 hours ago", "yesterday", or "just now". */
  const relative = (iso: string) => {
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000
    for (const [unit, size] of UNITS) {
      if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit)
    }
    return 'just now'
  }

  /** "12 Oct" for a YYYY-MM-DD day. */
  const shortDay = (day: string) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

  const percent = (part: number, whole: number) => (whole === 0 ? '0%' : `${((part / whole) * 100).toFixed(1)}%`)

  /** "half_hardy" -> "Half hardy". */
  const label = (value: string | null | undefined) =>
    value ? value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : ''

  /** "60–85 days", "5 days", or null when the range is empty. */
  const range = (value: { min: number | null; max: number | null } | null | undefined, unit = '') => {
    if (!value || value.min === null || value.max === null) return null
    const text = value.min === value.max ? `${value.min}` : `${value.min}–${value.max}`
    return unit ? `${text} ${unit}` : text
  }

  /**
   * Weeks relative to the last spring frost as words:
   * [-8, -6] -> "6–8 weeks before last frost", [1, 2] -> "1–2 weeks after last frost".
   */
  const weeks = (value: { min: number | null; max: number | null } | null | undefined) => {
    if (!value || value.min === null || value.max === null) return null
    const { min, max } = value
    const plural = (n: number) => (n === 1 ? 'week' : 'weeks')
    if (min === 0 && max === 0) return 'at the last frost'
    if (max <= 0) {
      const [near, far] = [-max, -min]
      return near === far ? `${far} ${plural(far)} before last frost` : `${near}–${far} weeks before last frost`
    }
    if (min >= 0) {
      return min === max ? `${max} ${plural(max)} after last frost` : `${min}–${max} weeks after last frost`
    }
    return `${-min} ${plural(-min)} before to ${max} ${plural(max)} after last frost`
  }

  /** "Mar 8 – Mar 22" for a window of YYYY-MM-DD dates. */
  const dateWindow = (value: { start: string; end: string } | null | undefined) =>
    value ? `${shortDay(value.start)} – ${shortDay(value.end)}` : null

  return { number, date, relative, shortDay, percent, label, range, weeks, dateWindow }
}
