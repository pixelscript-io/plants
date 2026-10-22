<template>
  <Button variant="ghost" size="icon" aria-label="Toggle dark mode" @click="isDark = !isDark">
    <SunIcon v-if="isDark" class="size-4" />
    <MoonIcon v-else class="size-4" />
  </Button>
</template>

<script setup lang="ts">
import { MoonIcon, SunIcon } from '@lucide/vue'
import { useDark } from '@vueuse/core'

// Adds or removes the `dark` class on <html>, and remembers the choice.
const isDark = useDark({ storageKey: 'plants-theme' })
</script>
