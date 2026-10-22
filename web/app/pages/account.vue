<template>
  <div class="grid max-w-3xl gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Account</h1>
      <p class="text-muted-foreground text-sm">Your profile and API access.</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent class="flex items-center gap-4">
        <Avatar class="size-14">
          <AvatarFallback class="text-lg">{{ user?.initials ?? '?' }}</AvatarFallback>
        </Avatar>
        <dl class="grid gap-1 text-sm">
          <div>
            <dt class="text-muted-foreground inline">Name: </dt>
            <dd class="inline font-medium">{{ user?.fullName || 'Not set' }}</dd>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div>
              <dt class="text-muted-foreground inline">Email: </dt>
              <dd class="inline font-medium">{{ user?.email }}</dd>
            </div>
            <Badge v-if="user?.emailVerified" variant="secondary" class="gap-1"><CircleCheckIcon class="size-3" />Confirmed</Badge>
            <Badge v-else variant="outline" class="gap-1"><MailWarningIcon class="size-3" />Not confirmed</Badge>
          </div>
          <div v-if="user">
            <dt class="text-muted-foreground inline">Member since: </dt>
            <dd class="inline font-medium">{{ date(user.createdAt) }}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>API access</CardTitle>
        <CardDescription>The limits that apply to each of your keys.</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="keys === null" class="grid gap-2">
          <Skeleton class="h-5 w-48" />
          <Skeleton class="h-5 w-64" />
        </div>
        <p v-else-if="keys.length === 0" class="text-muted-foreground text-sm">
          You don't have any API keys yet. <NuxtLink to="/keys" class="text-foreground underline underline-offset-4">Create one</NuxtLink>
          to see your limits.
        </p>
        <div v-else class="grid gap-3 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground">Plan:</span>
            <Badge variant="secondary" class="capitalize">{{ plan.tier }}</Badge>
          </div>
          <div><span class="text-muted-foreground">Burst limit:</span> {{ number(plan.limits.perMinute) }} requests per minute, per key</div>
          <div><span class="text-muted-foreground">Daily limit:</span> {{ number(plan.limits.perDay) }} requests per UTC day, per key</div>
          <div>
            <span class="text-muted-foreground">Active keys:</span> {{ keys.length }}
            <NuxtLink to="/keys" class="ml-2 underline underline-offset-4">Manage</NuxtLink>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Session</CardTitle>
        <CardDescription>Log out of the dashboard on this device. Your API keys keep working.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" @click="logout">
          <LogOutIcon />
          Log out
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { CircleCheckIcon, LogOutIcon, MailWarningIcon } from '@lucide/vue'

definePageMeta({ title: 'Account' })
useHead({ title: 'Account · Plants API' })

const { user, logout } = useAuth()
const { keys, load } = useApiKeys()
const { date, number } = useFormat()

// The best plan among the user's keys is the one that describes their account.
const plan = computed(() => {
  const list = keys.value ?? []
  return list.find((key) => key.tier !== 'free') ?? list[0]!
})

onMounted(() => load().catch(() => undefined))
</script>
