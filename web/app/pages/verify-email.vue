<template>
  <Card>
    <CardHeader class="text-center">
      <div class="bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
        <Loader2Icon v-if="state === 'verifying'" class="size-5 animate-spin" />
        <CircleCheckIcon v-else-if="state === 'verified'" class="size-5" />
        <LinkIcon v-else class="size-5" />
      </div>
      <CardTitle class="text-xl" data-testid="verify-title">
        <template v-if="state === 'verifying'">Confirming your email…</template>
        <template v-else-if="state === 'verified'">Email confirmed</template>
        <template v-else>This link doesn't work</template>
      </CardTitle>
      <CardDescription v-if="state === 'verified'">
        Thanks! Your email address is confirmed, so you can now create API keys.
      </CardDescription>
      <CardDescription v-else-if="state === 'failed'" data-testid="verify-error">{{ failure }}</CardDescription>
    </CardHeader>

    <CardContent v-if="state !== 'verifying'" class="grid gap-3">
      <Button v-if="state === 'verified'" as-child>
        <NuxtLink :to="user ? '/keys' : '/login'">{{ user ? 'Create an API key' : 'Log in' }}</NuxtLink>
      </Button>

      <template v-else>
        <Button v-if="user" :disabled="resending" @click="resend">
          <Loader2Icon v-if="resending" class="animate-spin" />
          Send me a new link
        </Button>
        <p v-else class="text-muted-foreground text-center text-sm">
          Log in and we can send you a new confirmation link.
        </p>
        <Button variant="ghost" as-child>
          <NuxtLink :to="user ? '/' : '/login'">{{ user ? 'Go to the dashboard' : 'Log in' }}</NuxtLink>
        </Button>
      </template>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { CircleCheckIcon, LinkIcon, Loader2Icon } from '@lucide/vue'
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'auth', title: 'Confirm email' })
useHead({ title: 'Confirm your email · Plants API', meta: [{ name: 'referrer', content: 'no-referrer' }] })

const route = useRoute()
const router = useRouter()
const { user, refreshUser } = useAuth()
const { request } = useApi()

// Read the token, then take it out of the address bar.
const token = typeof route.query.token === 'string' ? route.query.token : ''
if (import.meta.client) router.replace({ query: {} })

const state = ref<'verifying' | 'verified' | 'failed'>('verifying')
const failure = ref('')
const resending = ref(false)

onMounted(async () => {
  if (!token) {
    failure.value = 'The confirmation link is missing or incomplete.'
    state.value = 'failed'
    return
  }
  try {
    await $fetch('/api/auth/verify-email', { method: 'POST', body: { token } })
    state.value = 'verified'
    // If this browser is signed in, update it so the "confirm your email" banner goes away.
    if (user.value) await refreshUser()
  } catch (e) {
    failure.value = toRequestError(e).message
    state.value = 'failed'
  }
})

async function resend() {
  resending.value = true
  try {
    await request('/account/resend-verification', { method: 'POST' })
    toast.success('We sent you a new confirmation link.')
  } catch (e) {
    toast.error(e instanceof ApiRequestError ? e.message : 'Could not send the email.')
  } finally {
    resending.value = false
  }
}
</script>
