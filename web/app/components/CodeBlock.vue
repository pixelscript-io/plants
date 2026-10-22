<template>
  <div class="bg-muted relative min-w-0 rounded-md border">
    <Button
      size="icon"
      variant="ghost"
      class="absolute right-1.5 top-1.5 size-7"
      aria-label="Copy to clipboard"
      @click="copy"
    >
      <CheckIcon v-if="copied" class="size-3.5" />
      <CopyIcon v-else class="size-3.5" />
    </Button>
    <pre class="overflow-x-auto p-4 pr-11 text-sm"><code>{{ code }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, CopyIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'

const props = defineProps<{ code: string }>()
const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    toast.error('Could not copy. Select the text and copy it manually.')
  }
}
</script>
