<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { t } from '@/i18n'

const props = withDefaults(defineProps<{ totalPages: number; disabled?: boolean }>(), {
  disabled: false,
})
/** Current page, 1-based. */
const page = defineModel<number>({ required: true })

/** Page numbers to show, with `null` for a gap: 1 … 4 5 6 … 12. */
const pages = computed<(number | null)[]>(() => {
  const total = props.totalPages
  const cur = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, cur - 1, cur, cur + 1].filter((p) => p >= 1 && p <= total))
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | null)[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push(null)
    out.push(p)
  })
  return out
})

function go(p: number) {
  if (props.disabled || p < 1 || p > props.totalPages || p === page.value) return
  page.value = p
}
</script>

<template>
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-1" aria-label="Pagination">
    <button
      type="button"
      class="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-40 disabled:hover:bg-transparent"
      :disabled="disabled || page <= 1"
      :aria-label="t('debtBook.prevPage')"
      @click="go(page - 1)"
    >
      <ChevronLeft class="size-4" />
    </button>

    <template v-for="(p, i) in pages" :key="p ?? `gap-${i}`">
      <span v-if="p === null" class="px-1 text-sm text-fg-muted">…</span>
      <button
        v-else
        type="button"
        class="h-9 min-w-9 rounded-lg px-2 text-sm font-semibold tnum transition-colors"
        :class="
          p === page
            ? 'bg-primary text-primary-fg shadow-card'
            : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
        "
        :aria-current="p === page ? 'page' : undefined"
        :disabled="disabled"
        @click="go(p)"
      >
        {{ p }}
      </button>
    </template>

    <button
      type="button"
      class="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-40 disabled:hover:bg-transparent"
      :disabled="disabled || page >= totalPages"
      :aria-label="t('debtBook.nextPage')"
      @click="go(page + 1)"
    >
      <ChevronRight class="size-4" />
    </button>
  </nav>
</template>
