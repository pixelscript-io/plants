<template>
  <!-- No token in the link -->
  <Card v-if="state === 'invalid'">
    <CardHeader class="text-center">
      <div class="bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
        <LinkIcon class="size-5" />
      </div>
      <CardTitle class="text-xl">This link doesn't work</CardTitle>
      <CardDescription data-testid="invalid-message">
        {{ invalidReason }}
      </CardDescription>
    </CardHeader>
    <CardContent class="grid gap-3">
      <Button as-child><NuxtLink to="/forgot-password">Request a new link</NuxtLink></Button>
      <Button variant="ghost" as-child><NuxtLink to="/login">Back to log in</NuxtLink></Button>
    </CardContent>
  </Card>

  <!-- Done -->
  <Card v-else-if="state === 'done'">
    <CardHeader class="text-center">
      <div class="bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
        <CircleCheckIcon class="size-5" />
      </div>
      <CardTitle class="text-xl">Password updated</CardTitle>
      <CardDescription data-testid="done-message">
        Your password has been changed and you've been signed out on all devices. Log in with your new password.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button class="w-full" as-child><NuxtLink to="/login">Log in</NuxtLink></Button>
    </CardContent>
  </Card>

  <!-- The form -->
  <Card v-else>
    <CardHeader class="text-center">
      <CardTitle class="text-xl">Choose a new password</CardTitle>
      <CardDescription>You'll be signed out everywhere and asked to log in again.</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="grid gap-6" novalidate @submit.prevent="submit">
        <Alert v-if="formError" variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{{ formError }}</AlertDescription>
        </Alert>

        <div class="grid gap-2">
          <Label for="password">New password</Label>
          <Input id="password" v-model="password" type="password" autocomplete="new-password" autofocus :aria-invalid="Boolean(errors.password)" />
          <p v-if="errors.password" class="text-destructive text-sm">{{ errors.password }}</p>
          <p v-else class="text-muted-foreground text-sm">8 to 32 characters.</p>
        </div>

        <div class="grid gap-2">
          <Label for="passwordConfirmation">Confirm new password</Label>
          <Input id="passwordConfirmation" v-model="passwordConfirmation" type="password" autocomplete="new-password" :aria-invalid="Boolean(errors.passwordConfirmation)" />
          <p v-if="errors.passwordConfirmation" class="text-destructive text-sm">{{ errors.passwordConfirmation }}</p>
        </div>

        <Button type="submit" class="w-full" :disabled="loading">
          <Loader2Icon v-if="loading" class="animate-spin" />
          {{ loading ? 'Saving…' : 'Change password' }}
        </Button>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { CircleCheckIcon, LinkIcon, Loader2Icon, TriangleAlertIcon } from '@lucide/vue'

definePageMeta({ layout: 'auth', title: 'Choose a new password' })
useHead({ title: 'Choose a new password · Plants API', meta: [{ name: 'referrer', content: 'no-referrer' }] })

const route = useRoute()
const router = useRouter()
const { clearSession } = useAuth()

// The token is kept in memory and removed from the address bar straight away, so
// it does not linger in browser history or get copied along with the URL.
const token = typeof route.query.token === 'string' ? route.query.token : ''
if (import.meta.client) router.replace({ query: {} })

const state = ref<'form' | 'done' | 'invalid'>(token ? 'form' : 'invalid')
const invalidReason = ref('The reset link is missing or incomplete. Request a new one.')

const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const formError = ref('')
const errors = reactive<Record<string, string>>({})

function validate() {
  for (const key of Object.keys(errors)) delete errors[key]
  if (password.value.length < 8 || password.value.length > 32) errors.password = 'Use 8 to 32 characters.'
  if (passwordConfirmation.value !== password.value) errors.passwordConfirmation = 'Passwords do not match.'
  return Object.keys(errors).length === 0
}

async function submit() {
  formError.value = ''
  if (!validate()) return

  loading.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password: password.value, passwordConfirmation: passwordConfirmation.value },
    })
    // The server ended every session on the account, including this browser's.
    clearSession()
    state.value = 'done'
  } catch (e) {
    const failure = toRequestError(e)
    if (failure.status === 400) {
      // Expired, already used, or replaced by a newer link.
      invalidReason.value = failure.message
      state.value = 'invalid'
    } else if (failure.status === 422) {
      for (const item of failure.errors) if (item.field) errors[item.field] = item.message
      if (!failure.errors.some((item) => item.field)) formError.value = failure.message
    } else {
      formError.value = failure.message
    }
  } finally {
    loading.value = false
  }
}
</script>
