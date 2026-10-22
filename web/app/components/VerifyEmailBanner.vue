<template>
  <Alert v-if="user && !user.emailVerified" class="mb-4 md:mb-6" data-testid="verify-banner">
    <MailWarningIcon />
    <AlertTitle>Confirm your email address</AlertTitle>
    <AlertDescription>
      <p>
        We sent a confirmation link to <strong>{{ user.email }}</strong>. You need to confirm it before you can create API keys.
      </p>
      <div class="mt-2 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" :disabled="resending || cooldown > 0" @click="resend">
          <Loader2Icon v-if="resending" class="animate-spin" />
          {{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email' }}
        </Button>
        <span class="text-muted-foreground text-xs">Check your spam folder if it doesn't arrive.</span>
      </div>
    </AlertDescription>
  </Alert>
</template>

<script setup lang="ts">
import { Loader2Icon, MailWarningIcon } from '@lucide/vue'
import { useEventListener, useIntervalFn } from '@vueuse/core'
import { toast } from 'vue-sonner'

const { user, refreshUser } = useAuth()
const { request } = useApi()

const resending = ref(false)
const cooldown = ref(0)

// A short pause between resends; the API also enforces 3 an hour.
const { pause, resume } = useIntervalFn(
  () => {
    cooldown.value = Math.max(0, cooldown.value - 1)
    if (cooldown.value === 0) pause()
  },
  1000,
  { immediate: false }
)

async function resend() {
  resending.value = true
  try {
    await request('/account/resend-verification', { method: 'POST' })
    toast.success('We sent you a new confirmation link.')
    cooldown.value = 60
    resume()
  } catch (error) {
    toast.error(error instanceof ApiRequestError ? error.message : 'Could not send the email.')
  } finally {
    resending.value = false
  }
}

// The link is usually opened in another tab. When this tab regains focus, check
// again so the banner disappears without a manual reload.
if (import.meta.client) {
  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible' && user.value && !user.value.emailVerified) refreshUser()
  })
}
</script>
