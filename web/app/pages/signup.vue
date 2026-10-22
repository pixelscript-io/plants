<template>
  <Card>
    <CardHeader class="text-center">
      <CardTitle class="text-xl">Create your account</CardTitle>
      <CardDescription>Get an API key and start building with plant data.</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="grid gap-6" novalidate @submit.prevent="submit">
        <Alert v-if="formError" variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{{ formError }}</AlertDescription>
        </Alert>

        <div class="grid gap-2">
          <Label for="fullName">Name <span class="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="fullName" v-model="fullName" autocomplete="name" placeholder="Ada Lovelace" />
        </div>

        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input id="email" v-model="email" type="email" autocomplete="email" placeholder="you@example.com" :aria-invalid="Boolean(errors.email)" />
          <p v-if="errors.email" class="text-destructive text-sm">{{ errors.email }}</p>
        </div>

        <div class="grid gap-2">
          <Label for="password">Password</Label>
          <Input id="password" v-model="password" type="password" autocomplete="new-password" :aria-invalid="Boolean(errors.password)" />
          <p v-if="errors.password" class="text-destructive text-sm">{{ errors.password }}</p>
          <p v-else class="text-muted-foreground text-sm">8 to 32 characters.</p>
        </div>

        <div class="grid gap-2">
          <Label for="passwordConfirmation">Confirm password</Label>
          <Input id="passwordConfirmation" v-model="passwordConfirmation" type="password" autocomplete="new-password" :aria-invalid="Boolean(errors.passwordConfirmation)" />
          <p v-if="errors.passwordConfirmation" class="text-destructive text-sm">{{ errors.passwordConfirmation }}</p>
        </div>

        <Button type="submit" class="w-full" :disabled="loading">
          <Loader2Icon v-if="loading" class="animate-spin" />
          {{ loading ? 'Creating account…' : 'Create account' }}
        </Button>

        <p class="text-muted-foreground text-center text-sm">
          Already have an account?
          <NuxtLink to="/login" class="text-foreground underline underline-offset-4">Log in</NuxtLink>
        </p>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Loader2Icon, TriangleAlertIcon } from '@lucide/vue'

definePageMeta({ layout: 'auth', title: 'Sign up' })
useHead({ title: 'Sign up · Plants API' })

const { signup } = useAuth()

const fullName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const formError = ref('')
const errors = reactive<Record<string, string>>({})

/** Mirrors the API's rules so most mistakes are caught before a request. */
function validate() {
  for (const key of Object.keys(errors)) delete errors[key]
  if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) errors.email = 'Enter a valid email address.'
  if (password.value.length < 8 || password.value.length > 32) errors.password = 'Use 8 to 32 characters.'
  if (passwordConfirmation.value !== password.value) errors.passwordConfirmation = 'Passwords do not match.'
  return Object.keys(errors).length === 0
}

async function submit() {
  formError.value = ''
  if (!validate()) return

  loading.value = true
  try {
    await signup({
      fullName: fullName.value,
      email: email.value.trim(),
      password: password.value,
      passwordConfirmation: passwordConfirmation.value,
    })
    await navigateTo('/')
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 422 && error.errors.some((e) => e.field)) {
      // Show the server's message under the field it belongs to.
      for (const item of error.errors) if (item.field) errors[item.field] = item.message
    } else {
      formError.value = error instanceof ApiRequestError ? error.message : 'Something went wrong.'
    }
  } finally {
    loading.value = false
  }
}
</script>
