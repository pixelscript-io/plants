import { provideSSRWidth } from '@vueuse/core'

// Avoids hydration mismatches in components that depend on viewport width.
export default defineNuxtPlugin((nuxtApp) => {
  provideSSRWidth(1024, nuxtApp.vueApp)
})
