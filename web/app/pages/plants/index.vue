<template>
  <div class="grid gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Plant explorer</h1>
      <p class="text-muted-foreground text-sm">
        Search the Plants API dataset: growing needs, companions, soil amendments and planting calendars.
      </p>
    </div>

    <div class="grid gap-3">
      <div class="relative">
        <SearchIcon class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input v-model="filters.q" class="pl-9" type="search" placeholder="Search by common, alternate or scientific name" aria-label="Search plants" />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Select v-model="filters.type">
          <SelectTrigger class="w-36" aria-label="Type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem v-for="option in TYPES" :key="option" :value="option">{{ label(option) }}</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="filters.sun">
          <SelectTrigger class="w-36" aria-label="Sun"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any sun</SelectItem>
            <SelectItem value="full">Full sun</SelectItem>
            <SelectItem value="partial">Partial shade</SelectItem>
            <SelectItem value="shade">Shade</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="filters.water">
          <SelectTrigger class="w-36" aria-label="Water needs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any water</SelectItem>
            <SelectItem value="low">Low water</SelectItem>
            <SelectItem value="medium">Medium water</SelectItem>
            <SelectItem value="high">High water</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="filters.lifeCycle">
          <SelectTrigger class="w-36" aria-label="Life cycle"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any life cycle</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
            <SelectItem value="biennial">Biennial</SelectItem>
            <SelectItem value="perennial">Perennial</SelectItem>
          </SelectContent>
        </Select>

        <Button v-if="hasFilters" variant="ghost" size="sm" @click="clearFilters">
          <XIcon />
          Clear
        </Button>
      </div>
    </div>

    <Alert v-if="error" variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>Could not load plants</AlertTitle>
      <AlertDescription>
        {{ error }}
        <button class="underline underline-offset-4" @click="load">Try again</button>
      </AlertDescription>
    </Alert>

    <div v-else-if="plants === null" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Skeleton v-for="n in 6" :key="n" class="h-32 w-full" />
    </div>

    <Card v-else-if="plants.length === 0">
      <CardContent class="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <div class="bg-muted flex size-12 items-center justify-center rounded-full">
          <SproutIcon class="size-5" />
        </div>
        <div>
          <p class="font-medium">No plants match your search</p>
          <p class="text-muted-foreground text-sm">Try a different name or remove a filter.</p>
        </div>
        <Button variant="outline" @click="clearFilters">Clear search</Button>
      </CardContent>
    </Card>

    <template v-else>
      <p class="text-muted-foreground text-sm" aria-live="polite">
        {{ number(meta?.total ?? 0) }} {{ meta?.total === 1 ? 'plant' : 'plants' }}
      </p>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" :class="{ 'opacity-60': loading }">
        <NuxtLink v-for="plant in plants" :key="plant.id" :to="`/plants/${plant.slug}`" class="group focus-visible:outline-none">
          <Card class="group-hover:border-foreground/30 group-focus-visible:ring-ring h-full transition group-focus-visible:ring-2">
            <CardHeader class="pb-3">
              <CardTitle class="text-base">{{ plant.commonName }}</CardTitle>
              <CardDescription class="italic">{{ plant.scientificName }}</CardDescription>
            </CardHeader>
            <CardContent class="flex flex-wrap gap-1.5">
              <Badge v-if="plant.plantType" variant="secondary">{{ label(plant.plantType) }}</Badge>
              <Badge v-if="plant.lifeCycle" variant="outline">{{ label(plant.lifeCycle) }}</Badge>
              <Badge v-if="plant.sun" variant="outline" class="gap-1"><SunIcon class="size-3" />{{ label(plant.sun) }}</Badge>
              <Badge v-if="plant.waterNeeds" variant="outline" class="gap-1"><DropletsIcon class="size-3" />{{ label(plant.waterNeeds) }}</Badge>
            </CardContent>
          </Card>
        </NuxtLink>
      </div>

      <div v-if="meta && meta.lastPage > 1" class="flex items-center justify-between">
        <Button variant="outline" size="sm" :disabled="page <= 1 || loading" @click="page--">
          <ChevronLeftIcon />
          Previous
        </Button>
        <span class="text-muted-foreground text-sm">Page {{ meta.currentPage }} of {{ meta.lastPage }}</span>
        <Button variant="outline" size="sm" :disabled="page >= meta.lastPage || loading" @click="page++">
          Next
          <ChevronRightIcon />
        </Button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, DropletsIcon, SearchIcon, SproutIcon, SunIcon, TriangleAlertIcon, XIcon } from '@lucide/vue'
import { watchDebounced } from '@vueuse/core'
import type { PageMetadata, PlantSummary } from '~/types/api'

definePageMeta({ title: 'Plant explorer' })
useHead({ title: 'Plant explorer · Plants API' })

const TYPES = ['vegetable', 'herb', 'fruit', 'flower', 'shrub', 'tree']
const PER_PAGE = 24

const route = useRoute()
const router = useRouter()
const { requestPage } = useApi()
const { number, label } = useFormat()

// Filters live in the URL so a search can be shared or reloaded.
const fromQuery = (key: string) => (typeof route.query[key] === 'string' ? (route.query[key] as string) : undefined)
const filters = reactive({
  q: fromQuery('q') ?? '',
  type: fromQuery('type') ?? 'all',
  sun: fromQuery('sun') ?? 'all',
  water: fromQuery('water') ?? 'all',
  lifeCycle: fromQuery('lifeCycle') ?? 'all',
})
const page = ref(Math.max(1, Number(fromQuery('page')) || 1))

const plants = ref<PlantSummary[] | null>(null)
const meta = ref<PageMetadata | null>(null)
const loading = ref(false)
const error = ref('')

const hasFilters = computed(() => filters.q !== '' || [filters.type, filters.sun, filters.water, filters.lifeCycle].some((v) => v !== 'all'))

let latest = 0
async function load() {
  const request = ++latest
  loading.value = true
  error.value = ''

  const query: Record<string, string | number> = { perPage: PER_PAGE, page: page.value }
  const q = filters.q.trim()
  if (q) query.q = q
  for (const key of ['type', 'sun', 'water', 'lifeCycle'] as const) {
    if (filters[key] !== 'all') query[key] = filters[key]
  }

  // Reflect the search in the address bar without adding history entries.
  const { perPage: _perPage, ...visible } = query
  router.replace({ query: { ...visible, page: page.value > 1 ? page.value : undefined } })

  try {
    const result = await requestPage<PlantSummary>('/account/plants', { query })
    // Ignore a slow response if the user has typed something newer.
    if (request !== latest) return
    plants.value = result.data
    meta.value = result.metadata
  } catch (e) {
    if (request === latest) error.value = e instanceof ApiRequestError ? e.message : 'Something went wrong.'
  } finally {
    if (request === latest) loading.value = false
  }
}

// Any change to the search or a filter starts again from the first page.
function restart() {
  if (page.value === 1) load()
  else page.value = 1 // the page watcher loads
}

watchDebounced(() => filters.q, restart, { debounce: 300 })
watch(() => [filters.type, filters.sun, filters.water, filters.lifeCycle], restart)
watch(page, load)
onMounted(load)

function clearFilters() {
  filters.q = ''
  filters.type = filters.sun = filters.water = filters.lifeCycle = 'all'
}
</script>
