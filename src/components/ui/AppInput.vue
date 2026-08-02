<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    label?: string
    type?: string
    placeholder?: string
    error?: string
    hint?: string
    disabled?: boolean
    inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'search'
    autocomplete?: string
  }>(),
  { type: 'text', disabled: false },
)

const model = defineModel<string | number>()
const id = useId()
const describedBy = computed(() =>
  props.error ? `${id}-err` : props.hint ? `${id}-hint` : undefined,
)

// Password fields get a built-in show/hide toggle.
const isPassword = computed(() => props.type === 'password')
const reveal = ref(false)
const inputType = computed(() => (isPassword.value && reveal.value ? 'text' : props.type))
</script>

<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="mb-1.5 block text-sm font-medium text-fg-muted">
      {{ label }}
    </label>
    <div class="relative flex items-center">
      <span v-if="$slots.prefix" class="pointer-events-none absolute left-3 text-fg-muted">
        <slot name="prefix" />
      </span>
      <input
        :id="id"
        v-model="model"
        :type="inputType"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-describedby="describedBy"
        :class="[
          'h-11 w-full rounded-xl border bg-surface px-3.5 text-[15px] text-fg outline-none',
          'placeholder:text-fg-muted/60 transition-colors',
          'focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60',
          error ? 'border-danger focus:border-danger focus:ring-danger/25' : 'border-border',
          $slots.prefix ? 'pl-9' : '',
          $slots.suffix || isPassword ? 'pr-10' : '',
        ]"
      />
      <span v-if="$slots.suffix" class="absolute right-3 text-fg-muted">
        <slot name="suffix" />
      </span>
      <button
        v-else-if="isPassword"
        type="button"
        tabindex="-1"
        class="absolute right-2 grid size-8 place-items-center rounded-lg text-fg-muted transition-colors hover:text-fg"
        :aria-label="reveal ? 'Parolni yashirish' : 'Parolni ko‘rsatish'"
        @click="reveal = !reveal"
      >
        <EyeOff v-if="reveal" class="size-5" />
        <Eye v-else class="size-5" />
      </button>
    </div>
    <p v-if="error" :id="`${id}-err`" class="mt-1 text-sm text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="mt-1 text-sm text-fg-muted">{{ hint }}</p>
  </div>
</template>
