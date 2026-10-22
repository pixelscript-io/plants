import type { ApiKey, ApiKeyUsage, CreatedApiKey, UsageCounts, UsageDay } from '~/types/api'

/** The signed-in user's API keys, shared between pages so they load once. */
export function useApiKeys() {
  const { request } = useApi()
  const keys = useState<ApiKey[] | null>('api-keys', () => null)

  async function load(force = false) {
    if (keys.value && !force) return keys.value
    keys.value = await request<ApiKey[]>('/account/api-keys')
    return keys.value
  }

  async function create(name: string) {
    const created = await request<CreatedApiKey>('/account/api-keys', { method: 'POST', body: { name } })
    await load(true)
    return created
  }

  async function revoke(id: number) {
    await request(`/account/api-keys/${id}`, { method: 'DELETE' })
    keys.value = (keys.value ?? []).filter((key) => key.id !== id)
  }

  const usage = (id: number, days: number) =>
    request<ApiKeyUsage>(`/account/api-keys/${id}/usage`, { query: { days } })

  /** Usage summed across all active keys. Every key returns the same days. */
  async function aggregateUsage(days: number): Promise<{ days: number; totals: UsageCounts; series: UsageDay[] }> {
    const list = await load()
    const results = await Promise.all((list ?? []).map((key) => usage(key.id, days)))

    const byDay = new Map<string, UsageDay>()
    for (const result of results) {
      for (const entry of result.series) {
        const sum = byDay.get(entry.day) ?? { day: entry.day, requests: 0, errors: 0, rateLimited: 0 }
        sum.requests += entry.requests
        sum.errors += entry.errors
        sum.rateLimited += entry.rateLimited
        byDay.set(entry.day, sum)
      }
    }
    const series = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day))
    const totals = series.reduce(
      (total, entry) => ({
        requests: total.requests + entry.requests,
        errors: total.errors + entry.errors,
        rateLimited: total.rateLimited + entry.rateLimited,
      }),
      { requests: 0, errors: 0, rateLimited: 0 }
    )
    return { days, totals, series }
  }

  return { keys, load, create, revoke, usage, aggregateUsage }
}
