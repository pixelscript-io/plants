<template>
  <Card>
    <CardHeader class="text-center">
      <CardTitle class="text-xl">Welcome back</CardTitle>
      <CardDescription>Log in to manage your API keys and usage.</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="grid gap-6" @submit.prevent="submit">
        <Alert v-if="formError" variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{{ formError }}</AlertDescription>
        </Alert>

        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input id="email" v-model="email" type="email" autocomplete="email" placeholder="you@example.com" required />
        </div>

        <div class="grid gap-2">
          <div class="flex items-center justify-between">
            <Label for="password">Password</Label>
            <NuxtLink to="/forgot-password" class="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline">
              Forgot password?
            </NuxtLink>
          </div>
          <Input id="password" v-model="password" type="password" autocomplete="current-password" required />
        </div>

        <Button type="submit" class="w-full" :disabled="loading">
          <Loader2Icon v-if="loading" class="animate-spin" />
          {{ loading ? 'Logging in…' : 'Log in' }}
        </Button>

        <p class="text-muted-foreground text-center text-sm">
          Don't have an account?
          <NuxtLink to="/signup" class="text-foreground underline underline-offset-4">Sign up</NuxtLink>
        </p>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Loader2Icon, TriangleAlertIcon } from '@lucide/vue'

definePageMeta({ layout: 'auth', title: 'Log in' })
useHead({ title: 'Log in · Plants API' })

const route = useRoute()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const formError = ref('')

// Only follow redirects to pages inside this app.
const destination = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
})

async function submit() {
  formError.value = ''
  loading.value = true
  try {
    await login(email.value.trim(), password.value)
    await navigateTo(destination.value)
  } catch (error) {
    formError.value = error instanceof ApiRequestError ? error.message : 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>
