<template>
  <div class="grid gap-6">
    <!-- Overall status -->
    <Card>
      <CardContent class="flex flex-wrap items-center justify-between gap-4 py-6">
        <div v-if="!snapshot && !unreachable" class="grid w-full gap-2">
          <Skeleton class="h-7 w-64" />
          <Skeleton class="h-4 w-80" />
        </div>
        <div v-else class="flex items-center gap-3">
          <span class="size-4 shrink-0 rounded-full" :style="{ background: STATUS_COLORS[overall.key] }" />
          <div>
            <h1 class="text-xl font-semibold tracking-tight" data-testid="overall-title">{{ overall.title }}</h1>
            <p class="text-muted-foreground text-sm">{{ overall.detail }}</p>
          </div>
        </div>
        <div v-if="snapshot || unreachable" class="text-muted-foreground flex items-center gap-2 text-xs">
          <span v-if="fetchedAt">Updated {{ relative(new Date(fetchedAt).toISOString()) }}</span>
          <Button variant="ghost" size="icon" class="size-7" aria-label="Refresh status" :disabled="loading" @click="refresh">
            <RefreshCwIcon class="size-3.5" :class="{ 'animate-spin': loading }" />
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- The status service itself cannot be reached -->
    <Alert v-if="unreachable && snapshot" variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>We can't reach the Plants API right now</AlertTitle>
      <AlertDescription>
        The information below is the last report we received ({{ relative(snapshot.updatedAt) }}) and may be out of date.
      </AlertDescription>
    </Alert>

    <!-- Monitoring stopped -->
    <Alert v-else-if="snapshot?.monitoring.stale">
      <TriangleAlertIcon />
      <AlertTitle>Monitoring is delayed</AlertTitle>
      <AlertDescription>
        <template v-if="snapshot.monitoring.lastHeartbeatAt">
          The last health check was {{ relative(snapshot.monitoring.lastHeartbeatAt) }}. The statuses below may be out of date.
        </template>
        <template v-else>No health checks have been recorded yet.</template>
      </AlertDescription>
    </Alert>

    <!-- Active incidents -->
    <section v-if="snapshot?.incidents.active.length" class="grid gap-3">
      <h2 class="text-lg font-semibold">Active incidents</h2>
      <Alert v-for="incident in snapshot.incidents.active" :key="incident.id" :variant="incident.severity === 'down' ? 'destructive' : 'default'">
        <TriangleAlertIcon />
        <AlertTitle>{{ incident.title }}</AlertTitle>
        <AlertDescription>
          <p>
            Started {{ relative(incident.startedAt) }}
            <template v-if="incident.message"> · {{ incident.message }}</template>
          </p>
        </AlertDescription>
      </Alert>
    </section>

    <!-- Components -->
    <section class="grid gap-3">
      <h2 class="text-lg font-semibold">Components</h2>
      <Card>
        <CardContent class="divide-y p-0">
          <div v-if="!snapshot" class="grid gap-4 p-6">
            <Skeleton v-for="n in 4" :key="n" class="h-16 w-full" />
          </div>
          <div v-for="component in snapshot?.components" :key="component.id" class="grid gap-3 p-4 sm:p-6" :data-component="component.id">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 class="font-medium">{{ component.name }}</h3>
                <p class="text-muted-foreground text-sm">{{ component.description }}</p>
              </div>
              <div class="flex items-center gap-2 text-sm" :title="component.message ?? undefined">
                <span class="size-2.5 rounded-full" :style="{ background: STATUS_COLORS[component.status] }" />
                <span class="font-medium">{{ COMPONENT_LABELS[component.status] }}</span>
              </div>
            </div>

            <UptimeBar :days="component.days" />

            <div class="text-muted-foreground flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs">
              <span>
                <template v-if="component.uptime90d !== null">{{ component.uptime90d }}% uptime over 90 days</template>
                <template v-else>No uptime data yet</template>
              </span>
              <span v-if="component.latencyMs !== null && component.status !== 'down'">Response time {{ component.latencyMs }} ms</span>
            </div>
            <p v-if="component.message && component.status !== 'operational'" class="text-muted-foreground text-xs">
              {{ component.message }}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>

    <!-- Response time -->
    <section v-if="snapshot" class="grid gap-3">
      <Card>
        <CardHeader class="flex flex-row flex-wrap items-start justify-between gap-2">
          <div class="grid gap-1.5">
            <CardTitle>Response time</CardTitle>
            <CardDescription>Average per 30 minutes over the last 24 hours.</CardDescription>
          </div>
          <Select v-model="latencyComponent">
            <SelectTrigger class="w-48" aria-label="Component"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="component in snapshot.components" :key="component.id" :value="component.id">
                {{ component.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <LatencyChart v-if="latencyPoints.length > 1" :latency="latencyPoints" />
          <p v-else class="text-muted-foreground py-10 text-center text-sm">Not enough data yet. Check back in a little while.</p>
        </CardContent>
      </Card>
    </section>

    <!-- Past incidents -->
    <section v-if="snapshot" class="grid gap-3">
      <h2 class="text-lg font-semibold">Past incidents</h2>
      <Card>
        <CardContent class="divide-y p-0">
          <p v-if="snapshot.incidents.recent.length === 0" class="text-muted-foreground px-6 py-8 text-center text-sm">
            No incidents in the last 30 days.
          </p>
          <div v-for="incident in snapshot.incidents.recent" :key="incident.id" class="grid gap-1 p-4 sm:p-6">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-medium">{{ incident.title }}</h3>
              <Badge variant="secondary">Resolved</Badge>
            </div>
            <p class="text-muted-foreground text-sm">
              {{ date(incident.startedAt) }} · lasted {{ formatDuration(incident.durationMinutes) }}
              <template v-if="incident.message"> · {{ incident.message }}</template>
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { RefreshCwIcon, TriangleAlertIcon } from '@lucide/vue'
import { useIntervalFn } from '@vueuse/core'
import type { OverallStatus, StatusSnapshot } from '~/types/api'

definePageMeta({ layout: 'status', title: 'Status' })
useHead({ title: 'Status · Plants API' })

const { relative, date } = useFormat()

const snapshot = ref<StatusSnapshot | null>(null)
const unreachable = ref(false)
const loading = ref(false)
const fetchedAt = ref<number | null>(null)
const latencyComponent = ref('api')

async function refresh() {
  loading.value = true
  try {
    // Through the dashboard's own server, so the browser only ever talks to one origin.
    const response = await $fetch<{ data: StatusSnapshot }>('/api/proxy/status', { timeout: 10000 })
    snapshot.value = response.data
    unreachable.value = false
    fetchedAt.value = Date.now()
  } catch {
    // Keep showing the last good snapshot, but say we could not refresh it.
    unreachable.value = true
    fetchedAt.value = snapshot.value ? fetchedAt.value : Date.now()
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
useIntervalFn(refresh, 30_000)

// The text "Updated 5 seconds ago" needs to tick even when nothing is fetched.
const tick = ref(0)
useIntervalFn(() => tick.value++, 10_000)

const overall = computed<{ key: OverallStatus | 'major_outage'; title: string; detail: string }>(() => {
  void tick.value
  if (unreachable.value) {
    return {
      key: 'major_outage',
      title: "Can't reach the API",
      detail: 'The status service could not be contacted. The API may be down, or your connection may be unavailable.',
    }
  }
  const key = snapshot.value?.status ?? 'unknown'
  return { key, ...OVERALL_LABELS[key] }
})

const latencyPoints = computed(() => snapshot.value?.components.find((c) => c.id === latencyComponent.value)?.latency ?? [])
</script>
