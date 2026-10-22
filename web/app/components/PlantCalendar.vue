<template>
  <div class="grid gap-4">
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="load">
      <div class="grid gap-2">
        <Label for="zip">ZIP code</Label>
        <Input
          id="zip"
          v-model="zip"
          class="w-32"
          inputmode="numeric"
          maxlength="5"
          placeholder="02134"
          autocomplete="postal-code"
          :aria-invalid="Boolean(zipError)"
        />
      </div>

      <div class="grid gap-2">
        <Label for="risk">Frost risk</Label>
        <Select v-model="risk">
          <SelectTrigger id="risk" class="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="conservative">Cautious</SelectItem>
            <SelectItem value="average">Average</SelectItem>
            <SelectItem value="optimistic">Optimistic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" :disabled="loading">
        <Loader2Icon v-if="loading" class="animate-spin" />
        Show dates
      </Button>
    </form>
    <p v-if="zipError" class="text-destructive -mt-2 text-sm">{{ zipError }}</p>
    <p class="text-muted-foreground -mt-2 text-xs">
      Dates come from the nearest weather station's frost data. “Cautious” plants later in spring and expects an earlier fall frost.
    </p>

    <Alert v-if="error" variant="destructive">
      <TriangleAlertIcon />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <div v-else-if="loading && !result" class="grid gap-2">
      <Skeleton class="h-6 w-2/3" />
      <Skeleton class="h-32 w-full" />
    </div>

    <template v-if="result && plant">
      <div class="text-muted-foreground text-sm">
        Frost data from <span class="text-foreground font-medium">{{ result.station.name }}</span>
        ({{ result.station.distanceKm }} km away).
        Last spring frost <span class="text-foreground font-medium">{{ fmt(result.lastSpringFrost) }}</span>,
        first fall frost <span class="text-foreground font-medium">{{ fmt(result.firstFallFrost) }}</span>.
      </div>

      <Alert v-for="note in result.notes" :key="note">
        <InfoIcon />
        <AlertDescription>{{ note }}</AlertDescription>
      </Alert>

      <Card v-if="rows.length">
        <CardContent class="p-0">
          <Table>
            <TableBody>
              <TableRow v-for="row in rows" :key="row.label">
                <TableCell class="font-medium">{{ row.label }}</TableCell>
                <TableCell>{{ row.value }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert v-for="warning in plant.warnings" :key="warning" :variant="rows.length ? 'default' : undefined">
        <TriangleAlertIcon />
        <AlertDescription>{{ warning }}</AlertDescription>
      </Alert>
    </template>
  </div>
</template>

<script setup lang="ts">
import { InfoIcon, Loader2Icon, TriangleAlertIcon } from '@lucide/vue'
import type { CalendarResponse, DateWindow, PlantCalendar, Risk } from '~/types/api'

const props = defineProps<{ slug: string }>()

const { request } = useApi()

const ZIP_KEY = 'plants-zip'
const zip = ref('')
const risk = ref<Risk>('average')
const loading = ref(false)
const error = ref('')
const zipError = ref('')
const result = ref<CalendarResponse | null>(null)

const plant = computed<PlantCalendar | null>(() => result.value?.plants[0] ?? null)

// A date, with its year only when it falls outside the calendar's year
// (mild-winter locations can start seeds in the previous year).
function fmt(day: string) {
  const date = new Date(`${day}T00:00:00Z`)
  const sameYear = date.getUTCFullYear() === result.value?.year
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }), timeZone: 'UTC' })
}
const window = (value: DateWindow | null) => (value ? `${fmt(value.start)} – ${fmt(value.end)}` : null)

const rows = computed(() => {
  const p = plant.value
  if (!p) return []
  return [
    { label: 'Start seeds indoors', value: window(p.windows.sowIndoors) },
    { label: 'Sow outdoors', value: window(p.windows.directSow) },
    { label: 'Transplant outdoors', value: window(p.windows.transplant) },
    { label: 'First harvest', value: p.harvest ? `${fmt(p.harvest.earliest)} – ${fmt(p.harvest.latest)}` : null },
  ].filter((row): row is { label: string; value: string } => row.value !== null)
})

async function load() {
  zipError.value = ''
  error.value = ''
  if (!/^\d{5}$/.test(zip.value.trim())) {
    zipError.value = 'Enter a 5-digit US ZIP code.'
    // Do not leave dates for a previous ZIP on screen under an error.
    result.value = null
    return
  }

  loading.value = true
  try {
    result.value = await request<CalendarResponse>('/account/calendar', {
      query: { zip: zip.value.trim(), plants: props.slug, risk: risk.value },
    })
    try {
      localStorage.setItem(ZIP_KEY, zip.value.trim())
    } catch {
      /* storage unavailable: remembering the ZIP is only a convenience */
    }
  } catch (e) {
    result.value = null
    error.value = e instanceof ApiRequestError ? e.message : 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  try {
    zip.value = localStorage.getItem(ZIP_KEY) ?? ''
  } catch {
    /* ignore */
  }
  if (zip.value) load()
})

// Recalculate when the risk level changes, if there is a result to update.
watch(risk, () => result.value && load())
watch(() => props.slug, () => result.value && load())
</script>
