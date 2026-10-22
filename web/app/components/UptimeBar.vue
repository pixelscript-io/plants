<template>
  <div>
    <div class="flex h-8 items-stretch gap-[2px]" role="img" :aria-label="summary">
      <div
        v-for="day in days"
        :key="day.day"
        class="min-w-0 flex-1 rounded-[2px]"
        :style="{ background: STATUS_COLORS[day.status] }"
        :title="title(day)"
      />
    </div>
    <div class="text-muted-foreground mt-1 flex justify-between text-xs">
      <span>{{ days.length }} days ago</span>
      <span>Today</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusDay } from '~/types/api'

const props = defineProps<{ days: StatusDay[] }>()
const { shortDay } = useFormat()

const title = (day: StatusDay) =>
  day.status === 'no_data'
    ? `${shortDay(day.day)}: no data`
    : `${shortDay(day.day)}: ${DAY_LABELS[day.status]}, ${day.uptime}% uptime (${day.checks} checks)`

const summary = computed(() => {
  const outage = props.days.filter((d) => d.status === 'outage').length
  const degraded = props.days.filter((d) => d.status === 'degraded').length
  return `Uptime over the last ${props.days.length} days: ${outage} days with an outage, ${degraded} days with issues.`
})
</script>
