<template>
  <div class="grid gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">API keys</h1>
        <p class="text-muted-foreground text-sm">
          Send a key in the <code class="bg-muted rounded px-1 py-0.5 text-xs">X-API-Key</code> header to call the API.
        </p>
      </div>
      <Button :disabled="!canCreate" :title="canCreate ? undefined : 'Confirm your email address first'" @click="openCreate">
        <PlusIcon />
        Create API key
      </Button>
    </div>

    <Alert v-if="loadError" variant="destructive">
      <TriangleAlertIcon />
      <AlertTitle>Could not load your keys</AlertTitle>
      <AlertDescription>
        {{ loadError }}
        <button class="underline underline-offset-4" @click="reload">Try again</button>
      </AlertDescription>
    </Alert>

    <Card>
      <CardContent class="p-0">
        <div v-if="keys === null && !loadError" class="grid gap-3 p-6">
          <Skeleton v-for="n in 3" :key="n" class="h-10 w-full" />
        </div>

        <div v-else-if="keys && keys.length === 0" class="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <div class="bg-muted flex size-12 items-center justify-center rounded-full">
            <KeyRoundIcon class="size-5" />
          </div>
          <div>
            <p class="font-medium">No API keys yet</p>
            <p class="text-muted-foreground text-sm">Create a key to start calling the Plants API.</p>
          </div>
          <Button :disabled="!canCreate" @click="openCreate">
            <PlusIcon />
            Create your first key
          </Button>
          <p v-if="!canCreate" class="text-muted-foreground text-xs">Confirm your email address to create keys.</p>
        </div>

        <Table v-else-if="keys">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead class="hidden sm:table-cell">Plan</TableHead>
              <TableHead class="hidden xl:table-cell">Limits</TableHead>
              <TableHead class="hidden 2xl:table-cell">Created</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead class="w-0"><span class="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="key in keys" :key="key.id">
              <TableCell class="font-medium">{{ key.name }}</TableCell>
              <TableCell>
                <code class="text-muted-foreground text-xs">{{ key.prefix }}…</code>
              </TableCell>
              <TableCell class="hidden sm:table-cell">
                <Badge variant="secondary" class="capitalize">{{ key.tier }}</Badge>
              </TableCell>
              <TableCell class="text-muted-foreground hidden text-sm xl:table-cell">
                {{ number(key.limits.perMinute) }}/min · {{ number(key.limits.perDay) }}/day
              </TableCell>
              <TableCell class="text-muted-foreground hidden text-sm 2xl:table-cell">{{ date(key.createdAt) }}</TableCell>
              <TableCell class="text-muted-foreground text-sm">
                {{ key.lastUsedAt ? relative(key.lastUsedAt) : 'Never' }}
              </TableCell>
              <TableCell>
                <div class="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" as-child>
                    <NuxtLink :to="{ path: '/usage', query: { key: key.id } }" :aria-label="`View usage for ${key.name}`">
                      <ChartColumnIcon />
                      <span class="hidden lg:inline">Usage</span>
                    </NuxtLink>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive hover:text-destructive"
                    :aria-label="`Revoke ${key.name}`"
                    @click="keyToRevoke = key"
                  >
                    <Trash2Icon />
                    <span class="hidden lg:inline">Revoke</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <p class="text-muted-foreground text-sm">
      Keys are shown in full only once, when you create them. If you lose one, revoke it and create a new key.
    </p>

    <!-- Create -->
    <Dialog v-model:open="createOpen">
      <DialogContent class="sm:max-w-md" @interact-outside="(event) => createdKey && event.preventDefault()">
        <template v-if="!createdKey">
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>Give the key a name so you can tell your apps apart.</DialogDescription>
          </DialogHeader>
          <form id="create-key" class="grid gap-4" @submit.prevent="create">
            <Alert v-if="createError" variant="destructive">
              <TriangleAlertIcon />
              <AlertDescription>{{ createError }}</AlertDescription>
            </Alert>
            <div class="grid gap-2">
              <Label for="key-name">Name</Label>
              <Input id="key-name" v-model="name" maxlength="60" placeholder="My garden app" required autofocus />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" @click="createOpen = false">Cancel</Button>
            <Button type="submit" form="create-key" :disabled="creating || !name.trim()">
              <Loader2Icon v-if="creating" class="animate-spin" />
              Create key
            </Button>
          </DialogFooter>
        </template>

        <template v-else>
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
            <DialogDescription>Copy it now. For your security it will not be shown again.</DialogDescription>
          </DialogHeader>
          <div class="grid gap-3">
            <div class="bg-muted flex items-center gap-2 rounded-md border p-2">
              <code class="min-w-0 flex-1 break-all px-1 text-sm" data-testid="new-key">{{ createdKey }}</code>
              <Button size="icon" variant="outline" aria-label="Copy key" @click="copy(createdKey)">
                <CheckIcon v-if="copied" />
                <CopyIcon v-else />
              </Button>
            </div>
            <Alert>
              <InfoIcon />
              <AlertDescription>Store it somewhere safe, like an environment variable or a password manager.</AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button @click="createOpen = false">I've saved my key</Button>
          </DialogFooter>
        </template>
      </DialogContent>
    </Dialog>

    <!-- Revoke -->
    <AlertDialog :open="Boolean(keyToRevoke)" @update:open="(open) => !open && !revoking && (keyToRevoke = null)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke “{{ keyToRevoke?.name }}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Anything using this key will stop working immediately. This cannot be undone, but you can create a new key.
            Its usage history is kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <!-- A plain button, not AlertDialogAction: that one closes the dialog itself,
               before the request finishes and before we know whether it worked. -->
          <Button variant="destructive" :disabled="revoking" @click="revoke">
            <Loader2Icon v-if="revoking" class="animate-spin" />
            Revoke key
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import {
  ChartColumnIcon,
  CheckIcon,
  CopyIcon,
  InfoIcon,
  KeyRoundIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import type { ApiKey } from '~/types/api'

definePageMeta({ title: 'API keys' })
useHead({ title: 'API keys · Plants API' })

const { keys, load, create: createKey, revoke: revokeKey } = useApiKeys()
const { number, date, relative } = useFormat()
const { user } = useAuth()

// Keys are only for confirmed email addresses (the API enforces this too).
const canCreate = computed(() => Boolean(user.value?.emailVerified))

const loadError = ref('')

async function reload() {
  loadError.value = ''
  try {
    await load(true)
  } catch (error) {
    loadError.value = error instanceof ApiRequestError ? error.message : 'Something went wrong.'
  }
}
onMounted(reload)

// ---- Create ----
const createOpen = ref(false)
const name = ref('')
const creating = ref(false)
const createError = ref('')
const createdKey = ref('')
const copied = ref(false)

function openCreate() {
  name.value = ''
  createError.value = ''
  createdKey.value = ''
  copied.value = false
  createOpen.value = true
}

async function create() {
  createError.value = ''
  creating.value = true
  try {
    const created = await createKey(name.value.trim())
    createdKey.value = created.key
  } catch (error) {
    createError.value = error instanceof ApiRequestError ? error.message : 'Something went wrong.'
  } finally {
    creating.value = false
  }
}

async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = true
    toast.success('Key copied to clipboard')
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    toast.error('Could not copy. Select the key and copy it manually.')
  }
}

// Forget the key as soon as the dialog closes.
watch(createOpen, (open) => {
  if (!open) createdKey.value = ''
})

// ---- Revoke ----
const keyToRevoke = ref<ApiKey | null>(null)
const revoking = ref(false)

async function revoke() {
  if (!keyToRevoke.value) return
  revoking.value = true
  try {
    await revokeKey(keyToRevoke.value.id)
    toast.success(`Revoked “${keyToRevoke.value.name}”`)
    keyToRevoke.value = null
  } catch (error) {
    toast.error(error instanceof ApiRequestError ? error.message : 'Could not revoke the key.')
  } finally {
    revoking.value = false
  }
}
</script>
