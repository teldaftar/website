<script setup lang="ts">
import { ref } from 'vue'
import { ImagePlus, Loader2, X } from 'lucide-vue-next'
import { uploadImage } from '@/api/uploads'
import { resolveImageUrl } from '@/lib/format'
import { toUserMessage } from '@/api/errors'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'

defineProps<{ label?: string }>()

/** Stores the uploaded image URL (relative path returned by the backend). */
const model = defineModel<string | null>()

const input = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const progress = ref(0)

function pick() {
  input.value?.click()
}

async function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  progress.value = 0
  try {
    const res = await uploadImage(file, (p) => (progress.value = p))
    model.value = res.url
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    uploading.value = false
    if (input.value) input.value.value = ''
  }
}

function remove() {
  model.value = null
}
</script>

<template>
  <div class="w-full">
    <span v-if="label" class="eyebrow mb-2 block">{{ label }}</span>

    <input ref="input" type="file" accept="image/*" class="hidden" @change="onChange" />

    <!-- Preview -->
    <div v-if="model" class="relative w-full overflow-hidden rounded-xl border border-border">
      <img :src="resolveImageUrl(model) ?? ''" alt="" class="h-44 w-full object-cover" />
      <button
        type="button"
        class="absolute top-2 right-2 grid size-8 place-items-center rounded-lg bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80"
        :aria-label="t('upload.remove')"
        @click="remove"
      >
        <X class="size-4" />
      </button>
      <button
        type="button"
        class="absolute right-2 bottom-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/80"
        @click="pick"
      >
        {{ t('upload.change') }}
      </button>
    </div>

    <!-- Empty dropzone -->
    <button
      v-else
      type="button"
      :disabled="uploading"
      class="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-fg-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
      @click="pick"
    >
      <template v-if="uploading">
        <Loader2 class="size-6 animate-spin" />
        <span class="text-sm">{{ t('upload.uploading') }} {{ progress }}%</span>
      </template>
      <template v-else>
        <ImagePlus class="size-6" />
        <span class="text-sm font-medium">{{ t('upload.choose') }}</span>
      </template>
    </button>
  </div>
</template>
