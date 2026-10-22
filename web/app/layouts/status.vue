<template>
  <div class="bg-muted/40 min-h-svh">
    <header class="bg-background border-b">
      <div class="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
        <NuxtLink to="/status" class="flex items-center gap-2 font-medium">
          <div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <LeafIcon class="size-4" />
          </div>
          Plants API status
        </NuxtLink>
        <div class="flex items-center gap-1">
          <Button variant="ghost" size="sm" as-child>
            <a :href="docsUrl" target="_blank" rel="noopener">API reference</a>
          </Button>
          <Button variant="outline" size="sm" as-child>
            <NuxtLink to="/">{{ isLoggedIn ? 'Dashboard' : 'Log in' }}</NuxtLink>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
    <main class="mx-auto w-full max-w-4xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { LeafIcon } from '@lucide/vue'

const { isLoggedIn } = useAuth()
const docsUrl = useRuntimeConfig().public.docsUrl
</script>
