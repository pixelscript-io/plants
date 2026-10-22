<template>
  <div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
    <div class="flex w-full max-w-sm flex-col gap-6">
      <NuxtLink to="/" class="flex items-center gap-2 self-center font-medium">
        <div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <LeafIcon class="size-4" />
        </div>
        Plants API
      </NuxtLink>
      <slot />
      <NuxtLink to="/status" class="text-muted-foreground hover:text-foreground self-center text-xs underline-offset-4 hover:underline">
        System status
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LeafIcon } from '@lucide/vue'
</script>
