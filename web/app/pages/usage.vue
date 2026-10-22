<template>
  <div class="grid gap-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Usage</h1>
        <p class="text-muted-foreground text-sm">Requests to the Plants API, counted per UTC day.</p>
      </div>

      <div v-if="keys && keys.length" class="flex flex-wrap items-center gap-2">
        <Select v-model="selected">
          <SelectTrigger class="w-48" aria-label="API key">
            <SelectValue placeholder="Choose a key" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All keys</SelectItem>
            <SelectItem v-for="key in keys" :key="key.id" :value="String(key.id)">{{ key.name }}</SelectItem>
          </SelectContent>
        </Select>

        <ToggleGroup v-model="days" type="single" variant="outline" aria-label="Time range">
          <ToggleGroupItem value="7">7 days</ToggleGroupItem>
          <ToggleGroupItem value="30">30 days</ToggleGroupItem>
          <ToggleGroupItem value="90">90 days</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>Could not load usage</AlertTitle>
      <AlertDescription>
        {{ error }}
        <button class="underline underline-offset-4" @click="refresh">Try again</button>
      </AlertDescription>
    </Alert>

    <Card v-else-if="keys && keys.length === 0">
      <CardContent class="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <div class="bg-muted flex size-12 items-center justify-center rounded-full">
          <ChartColumnIcon class="size-5" />
        </div>
        <div>
          <p class="font-medium">No usage to show yet</p>
          <p class="text-muted-foreground text-sm">Create an API key and make your first request.</p>
        </div>
        <Button as-child>
          <NuxtLink to="/keys">Go to API keys</NuxtLink>
        </Button>
      </CardContent>
    </Card>

    <template v-else>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Requests</CardDescription>
            <CardTitle class="text-3xl tabular-nums">
              <Skeleton v-if="!data" class="h-9 w-24" />
              <template v-else>{{ number(data.totals.requests) }}</template>
            </CardTitle>
          </CardHeader>
          <CardContent class="text-muted-foreground text-xs">Last {{ days }} days</CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Errors</CardDescription>
            <CardTitle class="text-3xl tabular-nums">
              <Skeleton v-if="!data" class="h-9 w-24" />
              <template v-else>{{ number(data.totals.errors) }}</template>
            </CardTitle>
          </CardHeader>
          <CardContent class="text-muted-foreground text-xs">
            <template v-if="data">{{ percent(data.totals.errors, data.totals.requests) }} of requests returned 4xx or 5xx</template>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Rate limited</CardDescription>
            <CardTitle class="text-3xl tabular-nums">
              <Skeleton v-if="!data" class="h-9 w-24" />
              <template v-else>{{ number(data.totals.rateLimited) }}</template>
            </CardTitle>
          </CardHeader>
          <CardContent class="text-muted-foreground text-xs">Rejected with 429 Too Many Requests</CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Today (UTC)</CardDescription>
            <CardTitle class="text-3xl tabular-nums">
              <Skeleton v-if="!data" class="h-9 w-24" />
              <template v-else>{{ number(today?.requests ?? 0) }}</template>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <template v-if="data && quota">
              <Progress :model-value="quotaPercent" class="h-1.5" />
              <p class="text-muted-foreground mt-2 text-xs">of {{ number(quota) }} daily limit</p>
            </template>
            <p v-else-if="data" class="text-muted-foreground text-xs">Select a key to see its daily limit</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests per day</CardTitle>
          <CardDescription>
            {{ selectedKey ? selectedKey.name : 'All keys' }}
            <template v-if="selectedKey"> · {{ selectedKey.limits.perMinute }} requests/minute burst limit</template>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton v-if="!data" class="h-[280px] w-full" />
          <template v-else>
            <UsageChart :series="data.series" />
            <div class="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm" style="background: oklch(0.62 0.17 150)" />Successful</span>
              <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm" style="background: oklch(0.75 0.16 70)" />Errors</span>
              <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm" style="background: oklch(0.6 0.22 27)" />Rate limited</span>
            </div>
            <p v-if="data.totals.requests + data.totals.rateLimited === 0" class="text-muted-foreground mt-4 text-sm">
              No requests yet. Make a call with your key and refresh this page.
            </p>
          </template>
        </CardContent>
      </Card>

      <Card v-if="data">
        <CardHeader>
          <CardTitle>Daily breakdown</CardTitle>
          <CardDescription>Most recent first.</CardDescription>
        </CardHeader>
        <CardContent class="max-h-96 overflow-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day (UTC)</TableHead>
                <TableHead class="text-right">Requests</TableHead>
                <TableHead class="text-right">Errors</TableHead>
                <TableHead class="text-right">Rate limited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="entry in recentFirst" :key="entry.day">
                <TableCell>{{ entry.day }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ number(entry.requests) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ number(entry.errors) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ number(entry.rateLimited) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ChartColumnIcon, TriangleAlertIcon } from '@lucide/vue'
import type { ApiKey, UsageCounts, UsageDay } from '~/types/api'

definePageMeta({ title: 'Usage' })
useHead({ title: 'Usage · Plants API' })

const route = useRoute()
const router = useRouter()
const { keys, load, usage, aggregateUsage } = useApiKeys()
const { number, percent } = useFormat()

const selected = ref(typeof route.query.key === 'string' ? route.query.key : 'all')
const days = ref(['7', '30', '90'].includes(String(route.query.days)) ? String(route.query.days) : '30')
const data = ref<{ totals: UsageCounts; series: UsageDay[] } | null>(null)
const error = ref('')

const selectedKey = computed<ApiKey | null>(() => keys.value?.find((key) => String(key.id) === selected.value) ?? null)
const today = computed(() => data.value?.series.at(-1))
const quota = computed(() => selectedKey.value?.limits.perDay ?? 0)
const quotaPercent = computed(() => (quota.value ? Math.min(100, ((today.value?.requests ?? 0) / quota.value) * 100) : 0))
const recentFirst = computed(() => [...(data.value?.series ?? [])].reverse())

let latest = 0
async function refresh() {
  const request = ++latest
  error.value = ''
  data.value = null
  try {
    const result = selectedKey.value
      ? await usage(selectedKey.value.id, Number(days.value))
      : await aggregateUsage(Number(days.value))
    // Ignore a slow response if the user has changed the selection since.
    if (request === latest) data.value = result
  } catch (e) {
    if (request === latest) error.value = e instanceof ApiRequestError ? e.message : 'Something went wrong.'
  }
}

onMounted(async () => {
  try {
    await load()
  } catch (e) {
    error.value = e instanceof ApiRequestError ? e.message : 'Something went wrong.'
    return
  }
  // An unknown or revoked key in the URL falls back to all keys.
  if (selected.value !== 'all' && !selectedKey.value) selected.value = 'all'
  if (keys.value?.length) await refresh()
})

watch([selected, days], () => {
  // An empty range is transient: the watcher below restores the default.
  if (!keys.value?.length || !days.value) return
  router.replace({ query: { key: selected.value === 'all' ? undefined : selected.value, days: days.value === '30' ? undefined : days.value } })
  refresh()
})
// ToggleGroup emits an empty value when the active item is clicked again.
watch(days, (value) => {
  if (!value) days.value = '30'
})
</script>
