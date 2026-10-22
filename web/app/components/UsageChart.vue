<template>
  <ChartContainer :config="chartConfig" class="aspect-auto h-[280px] w-full">
    <VisXYContainer :data="rows" :margin="{ left: 8, right: 8, top: 8 }" :y-domain="[0, undefined]">
      <VisStackedBar
        :x="(_: Row, index: number) => index"
        :y="[(d: Row) => d.success, (d: Row) => d.errors, (d: Row) => d.rateLimited]"
        :color="['var(--color-success)', 'var(--color-errors)', 'var(--color-rateLimited)']"
        :bar-padding="0.25"
        :rounded-corners="2"
      />
      <VisAxis
        type="x"
        :tick-values="tickIndexes"
        :tick-format="(index: number) => rows[index]?.label ?? ''"
        :tick-line="false"
        :domain-line="false"
        :grid-line="false"
      />
      <VisAxis
        type="y"
        :num-ticks="4"
        :tick-format="(value: number) => (Number.isInteger(value) ? number(value) : '')"
        :tick-line="false"
        :domain-line="false"
      />
      <ChartTooltip />
      <ChartCrosshair
        :template="componentToString(chartConfig, ChartTooltipContent, { labelFormatter })"
        :color="['var(--color-success)', 'var(--color-errors)', 'var(--color-rateLimited)']"
      />
    </VisXYContainer>
  </ChartContainer>
</template>

<script setup lang="ts">
import { VisAxis, VisStackedBar, VisXYContainer } from '@unovis/vue'
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
  type ChartConfig,
} from '@/components/ui/chart'
import type { UsageDay } from '~/types/api'

interface Row {
  label: string
  day: string
  success: number
  errors: number
  rateLimited: number
}

const props = defineProps<{ series: UsageDay[] }>()
const { number, shortDay } = useFormat()

const chartConfig = {
  success: { label: 'Successful', color: 'oklch(0.62 0.17 150)' },
  errors: { label: 'Errors', color: 'oklch(0.75 0.16 70)' },
  rateLimited: { label: 'Rate limited', color: 'oklch(0.6 0.22 27)' },
} satisfies ChartConfig

// `requests` already includes errors, so successful = requests - errors.
const rows = computed<Row[]>(() =>
  props.series.map((entry) => ({
    day: entry.day,
    label: shortDay(entry.day),
    success: entry.requests - entry.errors,
    errors: entry.errors,
    rateLimited: entry.rateLimited,
  }))
)

// Label about seven days, so a 90-day chart stays readable.
const tickIndexes = computed(() => {
  const step = Math.max(1, Math.ceil(rows.value.length / 7))
  return rows.value.map((_, index) => index).filter((index) => index % step === 0 || index === rows.value.length - 1)
})

const labelFormatter = (index: number | Date) => rows.value[Number(index)]?.label ?? ''
</script>
