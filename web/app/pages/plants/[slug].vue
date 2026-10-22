<template>
  <div class="grid gap-6">
    <div>
      <Button variant="ghost" size="sm" class="-ml-2" @click="goBack">
        <ArrowLeftIcon />
        All plants
      </Button>
    </div>

    <div v-if="loading" class="grid gap-4">
      <Skeleton class="h-24 w-full" />
      <Skeleton class="h-64 w-full" />
    </div>

    <Card v-else-if="notFound">
      <CardContent class="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <div class="bg-muted flex size-12 items-center justify-center rounded-full">
          <SproutIcon class="size-5" />
        </div>
        <div>
          <p class="font-medium">Plant not found</p>
          <p class="text-muted-foreground text-sm">There is no plant with that address.</p>
        </div>
        <Button as-child><NuxtLink to="/plants">Browse all plants</NuxtLink></Button>
      </CardContent>
    </Card>

    <Alert v-else-if="error" variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>Could not load this plant</AlertTitle>
      <AlertDescription>
        {{ error }}
        <button class="underline underline-offset-4" @click="load">Try again</button>
      </AlertDescription>
    </Alert>

    <template v-else-if="plant">
      <!-- Header -->
      <div class="grid gap-3">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">{{ plant.commonName }}</h1>
          <p v-if="plant.scientificName" class="text-muted-foreground italic">{{ plant.scientificName }}</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <Badge v-if="plant.plantType" variant="secondary">{{ label(plant.plantType) }}</Badge>
          <Badge v-if="plant.lifeCycle" variant="outline">{{ label(plant.lifeCycle) }}</Badge>
          <Badge v-if="plant.care.frostTolerance" variant="outline" class="gap-1">
            <SnowflakeIcon class="size-3" />{{ label(plant.care.frostTolerance) }}
          </Badge>
          <Badge v-if="plant.family" variant="outline">{{ plant.family }}</Badge>
        </div>
        <p v-if="otherNames.length" class="text-muted-foreground text-sm">
          Also known as {{ otherNames.join(', ') }}.
        </p>
        <p v-if="plant.description" class="max-w-prose text-sm">{{ plant.description }}</p>
      </div>

      <Tabs v-model="tab" class="grid gap-4">
        <TabsList class="h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="companions">Companions</TabsTrigger>
          <TabsTrigger value="amendments">Soil amendments</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <!-- Overview -->
        <TabsContent value="overview" class="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Growing conditions</CardTitle></CardHeader>
            <CardContent>
              <dl class="grid gap-3 text-sm">
                <div v-for="fact in careFacts" :key="fact.label" class="flex justify-between gap-4">
                  <dt class="text-muted-foreground">{{ fact.label }}</dt>
                  <dd class="text-right font-medium">{{ fact.value }}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Growth</CardTitle></CardHeader>
            <CardContent>
              <dl class="grid gap-3 text-sm">
                <div v-for="fact in growthFacts" :key="fact.label" class="flex justify-between gap-4">
                  <dt class="text-muted-foreground">{{ fact.label }}</dt>
                  <dd class="text-right font-medium">{{ fact.value }}</dd>
                </div>
                <p v-if="growthFacts.length === 0" class="text-muted-foreground">No growth data recorded.</p>
              </dl>
            </CardContent>
          </Card>

          <Card class="md:col-span-2">
            <CardHeader>
              <CardTitle>Planting windows</CardTitle>
              <CardDescription>Relative to the average last spring frost.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl v-if="plantingFacts.length" class="grid gap-3 text-sm">
                <div v-for="fact in plantingFacts" :key="fact.label" class="flex justify-between gap-4">
                  <dt class="text-muted-foreground">{{ fact.label }}</dt>
                  <dd class="text-right font-medium">{{ fact.value }}</dd>
                </div>
              </dl>
              <p v-else class="text-muted-foreground text-sm">
                No spring planting windows are recorded for this plant. Some plants, such as garlic, bulbs and
                biennial flowers, are planted in late summer or fall.
              </p>
              <Button v-if="plantingFacts.length" variant="outline" size="sm" class="mt-4" @click="tab = 'calendar'">
                <CalendarDaysIcon />
                See dates for your ZIP code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Companions -->
        <TabsContent value="companions" class="grid gap-4">
          <div class="grid gap-4 lg:grid-cols-3">
            <Card v-for="group in companionGroups" :key="group.key">
              <CardHeader>
                <CardTitle class="flex items-center gap-2 text-base">
                  <component :is="group.icon" class="size-4" />
                  {{ group.title }}
                </CardTitle>
                <CardDescription>{{ group.description }}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul v-if="group.items.length" class="grid gap-4">
                  <li v-for="item in group.items" :key="item.slug">
                    <NuxtLink :to="`/plants/${item.slug}`" class="font-medium underline-offset-4 hover:underline">
                      {{ item.commonName }}
                    </NuxtLink>
                    <p v-if="item.reason" class="text-muted-foreground mt-0.5 text-sm">{{ item.reason }}</p>
                  </li>
                </ul>
                <p v-else class="text-muted-foreground text-sm">None recorded.</p>
              </CardContent>
            </Card>
          </div>
          <p class="text-muted-foreground text-xs">
            Evidence for companion planting varies. Each note says whether an effect is documented or traditional advice.
          </p>
        </TabsContent>

        <!-- Amendments -->
        <TabsContent value="amendments" class="grid gap-4">
          <div v-if="plant.amendments.length" class="grid gap-4 md:grid-cols-2">
            <Card v-for="amendment in plant.amendments" :key="amendment.slug">
              <CardHeader>
                <CardTitle class="text-base">{{ amendment.name }}</CardTitle>
              </CardHeader>
              <CardContent class="text-sm">{{ amendment.effect }}</CardContent>
            </Card>
          </div>
          <Card v-else>
            <CardContent class="text-muted-foreground px-6 py-10 text-center text-sm">
              No soil amendments are recorded for this plant.
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Calendar -->
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Planting calendar</CardTitle>
              <CardDescription>Dates for your location, calculated from local frost data.</CardDescription>
            </CardHeader>
            <CardContent>
              <PlantCalendar :slug="plant.slug" />
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Sources -->
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Where this data comes from</CardTitle>
              <CardDescription>Provenance and license for this plant's record.</CardDescription>
            </CardHeader>
            <CardContent class="grid gap-4 text-sm">
              <div v-for="source in plant.sources" :key="source.source + source.license">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium">{{ sourceName(source.source) }}</span>
                  <Badge variant="outline">{{ source.license }}</Badge>
                </div>
                <p v-if="source.attribution" class="text-muted-foreground mt-1">{{ source.attribution }}</p>
              </div>
              <p v-if="plant.usdaSymbol" class="text-muted-foreground">
                USDA PLANTS symbol:
                <a :href="`https://plants.usda.gov/plant-profile/${plant.usdaSymbol}`" target="_blank" rel="noopener" class="text-foreground underline underline-offset-4">
                  {{ plant.usdaSymbol }}
                </a>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  BanIcon,
  CalendarDaysIcon,
  ChefHatIcon,
  SnowflakeIcon,
  SproutIcon,
  ThumbsUpIcon,
  TriangleAlertIcon,
} from '@lucide/vue'
import type { PlantDetail } from '~/types/api'

definePageMeta({ title: 'Plant' })

const route = useRoute()
const router = useRouter()
const { request } = useApi()
const { label, range, weeks } = useFormat()

const slug = computed(() => String(route.params.slug))
const plant = ref<PlantDetail | null>(null)
const loading = ref(true)
const notFound = ref(false)
const error = ref('')

const TABS = ['overview', 'companions', 'amendments', 'calendar', 'sources']
const tab = ref(TABS.includes(String(route.query.tab)) ? String(route.query.tab) : 'overview')
watch(tab, (value) => router.replace({ query: { ...route.query, tab: value === 'overview' ? undefined : value } }))

async function load() {
  loading.value = true
  notFound.value = false
  error.value = ''
  try {
    plant.value = await request<PlantDetail>(`/account/plants/${slug.value}`)
    useHead({ title: `${plant.value.commonName} · Plants API` })
  } catch (e) {
    plant.value = null
    if (e instanceof ApiRequestError && e.status === 404) notFound.value = true
    else error.value = e instanceof ApiRequestError ? e.message : 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
// Following a companion link keeps this page mounted with a new slug.
watch(slug, () => {
  tab.value = 'overview'
  load()
})

// Back to the search results (with their filters) when we came from there.
function goBack() {
  if (window.history.state?.back) router.back()
  else navigateTo('/plants')
}

const otherNames = computed(() =>
  (plant.value?.names ?? []).map((n) => n.name).filter((name) => name !== plant.value?.commonName)
)

type Fact = { label: string; value: string }
const compact = (facts: { label: string; value: string | null | undefined }[]): Fact[] =>
  facts.filter((fact): fact is Fact => Boolean(fact.value))

const careFacts = computed(() => {
  const care = plant.value?.care
  if (!care) return []
  const zones = range(care.hardinessZones)
  return compact([
    { label: 'Sun', value: care.sun === 'partial' ? 'Partial shade' : label(care.sun) },
    {
      label: 'Water',
      value: care.waterNeeds
        ? `${label(care.waterNeeds)}${care.wateringIntervalDays ? `, about every ${care.wateringIntervalDays} days` : ''}`
        : null,
    },
    { label: 'Soil pH', value: range(care.soilPh) },
    { label: 'Hardiness zones', value: zones ? `Zones ${zones}` : plant.value?.lifeCycle === 'annual' ? 'Grown as an annual' : null },
    { label: 'Frost tolerance', value: label(care.frostTolerance) },
  ])
})

const growthFacts = computed(() => {
  const growth = plant.value?.growth
  if (!growth) return []
  return compact([
    { label: 'Germination', value: range(growth.daysToGermination, 'days') },
    { label: 'Days to harvest', value: range(growth.daysToHarvest, 'days') },
    { label: 'Spacing', value: growth.spacingCm ? `${growth.spacingCm} cm` : null },
    { label: 'Height', value: growth.heightCm ? `${growth.heightCm} cm` : null },
  ])
})

const plantingFacts = computed(() => {
  const planting = plant.value?.planting
  if (!planting) return []
  return compact([
    { label: 'Start seeds indoors', value: weeks(planting.sowIndoorsWeeks) },
    { label: 'Sow outdoors', value: weeks(planting.directSowWeeks) },
    { label: 'Transplant outdoors', value: weeks(planting.transplantWeeks) },
  ])
})

const companionGroups = computed(() => {
  const companions = plant.value?.companions
  return [
    { key: 'beneficial', title: 'Grows well with', description: 'Good neighbours in the garden.', icon: ThumbsUpIcon, items: companions?.beneficial ?? [] },
    { key: 'antagonistic', title: 'Keep apart from', description: 'Plants that do badly together.', icon: BanIcon, items: companions?.antagonistic ?? [] },
    { key: 'culinary', title: 'Cooks well with', description: 'Used together in the kitchen.', icon: ChefHatIcon, items: companions?.culinary ?? [] },
  ]
})

const SOURCE_NAMES: Record<string, string> = {
  curated: 'Curated by Plants API',
  usda_plants: 'USDA PLANTS Database',
  extension_crosscheck: 'University extension cross-check',
}
const sourceName = (source: string) => SOURCE_NAMES[source] ?? source
</script>
