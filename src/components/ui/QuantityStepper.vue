<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ min?: number; max?: number; label?: string }>(), {
  min: 1,
})
const model = defineModel<number>({ required: true })

function clamp(v: number): number {
  const lo = props.min
  const hi = props.max ?? Number.MAX_SAFE_INTEGER
  return Math.min(hi, Math.max(lo, v))
}
function dec() {
  model.value = clamp(model.value - 1)
}
function inc() {
  model.value = clamp(model.value + 1)
}
function onInput(e: Event) {
  const n = Number((e.target as HTMLInputElement).value.replace(/\D/g, ''))
  model.value = clamp(Number.isFinite(n) ? n : props.min)
}
</script>

<template>
  <div class="w-full">
    <span v-if="label" class="eyebrow mb-2 block">{{ label }}</span>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-fg transition-colors hover:bg-surface-2 disabled:opacity-40"
        :disabled="model <= min"
        @click="dec"
      >
        <Minus class="size-5" />
      </button>
      <input
        :value="model"
        inputmode="numeric"
        class="h-11 w-full rounded-xl border border-border bg-surface text-center text-lg font-bold text-fg tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
        @input="onInput"
      />
      <button
        type="button"
        class="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-fg transition-colors hover:bg-surface-2 disabled:opacity-40"
        :disabled="max != null && model >= max"
        @click="inc"
      >
        <Plus class="size-5" />
      </button>
    </div>
    <p v-if="$slots.hint" class="mt-1 text-xs text-fg-muted"><slot name="hint" /></p>
  </div>
</template>
