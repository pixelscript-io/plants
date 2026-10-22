<template>
  <div class="bg-muted flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
    <p class="text-muted-foreground text-sm font-medium">{{ error?.statusCode ?? 500 }}</p>
    <h1 class="text-2xl font-semibold tracking-tight">
      {{ error?.statusCode === 404 ? 'Page not found' : 'Something went wrong' }}
    </h1>
    <p class="text-muted-foreground max-w-sm text-sm">
      {{ error?.statusCode === 404 ? "We couldn't find the page you were looking for." : 'An unexpected error occurred. Please try again.' }}
    </p>
    <Button @click="clearError({ redirect: '/' })">Back to dashboard</Button>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>
