<template>
  <div class="grid gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Welcome{{ firstName ? `, ${firstName}` : '' }}</h1>
      <p class="text-muted-foreground text-sm">Here is how your Plants API keys are doing.</p>
    </div>

    <Alert v-if="error" variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>Could not load your dashboard</AlertTitle>
      <AlertDescription>
        {{ error }}
        <button class="underline underline-offset-4" @click="refresh">Try again</button>
      </AlertDescription>
    </Alert>

    <!-- First-run: no keys -->
    <Card v-else-if="keys && keys.length === 0">
      <CardHeader>
        <CardTitle>Get started in three steps</CardTitle>
        <CardDescription>Plant data, companions, frost dates and a planting calendar, over one simple API.</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-6">
        <ol class="grid gap-3 text-sm">
          <li class="flex gap-3">
            <span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs">1</span>
            <span><strong>Create an API key.</strong> Name it after the app you're building.</span>
          </li>
          <li class="flex gap-3">
            <span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs">2</span>
            <span><strong>Send it in the <code class="bg-muted rounded px-1 text-xs">X-API-Key</code> header</strong> with any request.</span>
          </li>
          <li class="flex gap-3">
            <span class="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs">3</span>
            <span><strong>Watch usage here</strong> as your app grows.</span>
          </li>
        </ol>
        <div class="flex flex-wrap gap-2">
          <Button as-child>
            <NuxtLink to="/keys"><PlusIcon />Create your first key</NuxtLink>
          </Button>
          <Button variant="outline" as-child>
            <a :href="docsUrl" target="_blank" rel="noopener"><BookOpenIcon />Read the API reference</a>
          </Button>
        </div>
      </CardContent>
    </Card>

    <template v-else>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Active keys</CardDescription>
            <CardTitle class="text-3xl tabular-nums">
              <Skeleton v-if="!keys" class="h-9 w-12" />
              <template v-else>{{ keys.length }}</template>
            </CardTitle>
          </CardHeader>
          <CardContent class="text-muted-foreground text-xs">
            <NuxtLink to="/keys" class="underline underline-offset-4">Manage keys</NuxtLink>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Requests today (UTC)</CardDescription>
            <CardTitle class="text-3xl tabular-nums">
              <Skeleton v-if="!summary" class="h-9 w-20" />
              <template v-else>{{ number(today?.requests ?? 0) }}</template>
            </CardTitle>
          </CardHeader>
          <CardContent class="text-muted-foreground text-xs">Across all keys</CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Requests, last 30 days</CardDescription>
            <CardTitle class="text-3xl tabular-nums">
              <Skeleton v-if="!summary" class="h-9 w-20" />
              <template v-else>{{ number(summary.totals.requests) }}</template>
            </CardTitle>
          </CardHeader>
          <CardContent class="text-muted-foreground text-xs">
            <template v-if="summary">{{ percent(summary.totals.errors, summary.totals.requests) }} errors</template>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2">
            <CardDescription>Rate limited, last 30 days</CardDescription>
            <CardTitle class="text-3xl tabular-nums">
              <Skeleton v-if="!summary" class="h-9 w-20" />
              <template v-else>{{ number(summary.totals.rateLimited) }}</template>
            </CardTitle>
          </CardHeader>
          <CardContent class="text-muted-foreground text-xs">Requests rejected with 429</CardContent>
        </Card>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <Card class="lg:col-span-2">
          <CardHeader class="flex flex-row items-start justify-between gap-2">
            <div class="grid gap-1.5">
              <CardTitle>Requests per day</CardTitle>
              <CardDescription>Last 30 days, all keys</CardDescription>
            </div>
            <Button variant="outline" size="sm" as-child>
              <NuxtLink to="/usage">View usage</NuxtLink>
            </Button>
          </CardHeader>
          <CardContent>
            <Skeleton v-if="!summary" class="h-[280px] w-full" />
            <UsageChart v-else :series="summary.series" />
          </CardContent>
        </Card>

        <Card class="min-w-0">
          <CardHeader>
            <CardTitle>Make your first request</CardTitle>
            <CardDescription>Replace the placeholder with your full key.</CardDescription>
          </CardHeader>
          <CardContent class="grid min-w-0 gap-4">
            <CodeBlock :code="snippet" />
            <div class="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" as-child>
                <a :href="docsUrl" target="_blank" rel="noopener"><BookOpenIcon />API reference</a>
              </Button>
              <Button variant="outline" size="sm" as-child>
                <NuxtLink to="/keys"><KeyRoundIcon />Keys</NuxtLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { BookOpenIcon, KeyRoundIcon, PlusIcon, TriangleAlertIcon } from '@lucide/vue'
import type { UsageCounts, UsageDay } from '~/types/api'

definePageMeta({ title: 'Overview' })
useHead({ title: 'Overview · Plants API' })

const { user } = useAuth()
const { keys, load, aggregateUsage } = useApiKeys()
const { number, percent } = useFormat()
const config = useRuntimeConfig()
const docsUrl = config.public.docsUrl

const summary = ref<{ totals: UsageCounts; series: UsageDay[] } | null>(null)
const error = ref('')

const firstName = computed(() => user.value?.fullName?.split(' ')[0] ?? '')
const today = computed(() => summary.value?.series.at(-1))

const snippet = computed(
  () => `curl -H "X-API-Key: ${keys.value?.[0]?.prefix ?? 'pk_live_'}…" \\\n  "${config.public.apiBase}/plants?q=tomato"`
)

async function refresh() {
  error.value = ''
  summary.value = null
  try {
    await load(true)
    if (keys.value?.length) summary.value = await aggregateUsage(30)
  } catch (e) {
    error.value = e instanceof ApiRequestError ? e.message : 'Something went wrong.'
  }
}
onMounted(refresh)
</script>
