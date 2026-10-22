<template>
  <ChartContainer :config="chartConfig" class="aspect-auto h-[220px] w-full">
    <VisXYContainer :data="points" :margin="{ left: 8, right: 8, top: 8 }" :y-domain="[0, undefined]">
      <VisArea :x="(d: Point) => d.t" :y="(d: Point) => d.ms" color="var(--color-ms)" :opacity="0.15" />
      <VisLine :x="(d: Point) => d.t" :y="(d: Point) => d.ms" color="var(--color-ms)" />
      <VisAxis
        type="x"
        :num-ticks="6"
        :tick-format="(t: number) => clock(t)"
        :tick-line="false"
        :domain-line="false"
        :grid-line="false"
      />
      <VisAxis
        type="y"
        :num-ticks="4"
        :tick-format="(v: number) => `${v} ms`"
        :tick-line="false"
        :domain-line="false"
      />
      <ChartTooltip />
      <ChartCrosshair
        :template="componentToString(chartConfig, ChartTooltipContent, { labelFormatter: (t: number | Date) => clock(Number(t)) })"
        color="var(--color-ms)"
      />
    </VisXYContainer>
  </ChartContainer>
</template>

<script setup lang="ts">
import { VisArea, VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
  type ChartConfig,
} from '@/components/ui/chart'

interface Point {
  t: number
  ms: number
}

const props = defineProps<{ latency: { at: string; ms: number }[] }>()

const chartConfig = { ms: { label: 'Response time (ms)', color: 'oklch(0.62 0.17 150)' } } satisfies ChartConfig

const points = computed<Point[]>(() => props.latency.map((p) => ({ t: new Date(p.at).getTime(), ms: p.ms })))

// Local time, since "when did it get slow" is a question about the viewer's day.
const clock = (t: number) => new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
</script>
