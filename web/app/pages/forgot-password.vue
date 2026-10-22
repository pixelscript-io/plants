<template>
  <Card v-if="sent">
    <CardHeader class="text-center">
      <div class="bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
        <MailCheckIcon class="size-5" />
      </div>
      <CardTitle class="text-xl">Check your email</CardTitle>
      <CardDescription data-testid="sent-message">{{ message }}</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-4 text-center text-sm">
      <p class="text-muted-foreground">The link works for 1 hour. If nothing arrives, check your spam folder.</p>
      <Button variant="outline" as-child>
        <NuxtLink to="/login">Back to log in</NuxtLink>
      </Button>
    </CardContent>
  </Card>

  <Card v-else>
    <CardHeader class="text-center">
      <CardTitle class="text-xl">Forgot your password?</CardTitle>
      <CardDescription>Enter your email address and we'll send you a link to choose a new one.</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="grid gap-6" @submit.prevent="submit">
        <Alert v-if="error" variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input id="email" v-model="email" type="email" autocomplete="email" placeholder="you@example.com" required autofocus />
        </div>

        <Button type="submit" class="w-full" :disabled="loading">
          <Loader2Icon v-if="loading" class="animate-spin" />
          {{ loading ? 'Sending…' : 'Send reset link' }}
        </Button>

        <p class="text-muted-foreground text-center text-sm">
          Remembered it?
          <NuxtLink to="/login" class="text-foreground underline underline-offset-4">Log in</NuxtLink>
        </p>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Loader2Icon, MailCheckIcon, TriangleAlertIcon } from '@lucide/vue'

definePageMeta({ layout: 'auth', title: 'Reset password' })
useHead({ title: 'Reset your password · Plants API' })

const email = ref('')
const loading = ref(false)
const error = ref('')
const sent = ref(false)
const message = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const response = await $fetch<{ data: { message: string } }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value.trim() },
    })
    // The same message appears whether or not an account exists.
    message.value = response.data.message
    sent.value = true
  } catch (e) {
    error.value = toRequestError(e).message
  } finally {
    loading.value = false
  }
}
</script>
