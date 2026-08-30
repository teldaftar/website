<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    loading?: boolean
    disabled?: boolean
    block?: boolean
    /** Square icon-only button (still keeps a 44px tap target at md). */
    iconOnly?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    loading: false,
    disabled: false,
    block: false,
    iconOnly: false,
  },
)

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover active:scale-[.985] shadow-card',
  secondary: 'bg-surface text-fg border border-border-strong hover:bg-surface-2 active:scale-[.985]',
  ghost: 'bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg active:scale-[.985]',
  danger: 'bg-danger text-white hover:brightness-110 active:scale-[.985] shadow-card',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 text-sm gap-1.5 rounded-lg',
  md: 'h-11 text-[15px] gap-2 rounded-lg',
  lg: 'h-12 text-[15px] gap-2 rounded-xl',
}

const padding = computed(() => {
  if (props.iconOnly) return props.size === 'sm' ? 'w-9' : props.size === 'lg' ? 'w-13' : 'w-11'
  return props.size === 'sm' ? 'px-3' : props.size === 'lg' ? 'px-6' : 'px-5'
})

const classes = computed(() => [
  'inline-flex items-center justify-center font-semibold tracking-[-0.01em] select-none',
  'transition-[background-color,transform,filter] duration-150 ease-out',
  'disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-ring',
  variants[props.variant],
  sizes[props.size],
  padding.value,
  props.block ? 'w-full' : '',
])
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :class="classes" :aria-busy="loading">
    <Loader2 v-if="loading" class="size-4 animate-spin" />
    <slot v-else name="icon" />
    <slot />
  </button>
</template>
