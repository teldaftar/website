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
  primary:
    'bg-primary text-primary-fg hover:bg-primary-hover active:scale-[.98] shadow-sm shadow-primary/20',
  secondary: 'bg-surface-2 text-fg hover:bg-border/60 active:scale-[.98] border border-border',
  ghost: 'bg-transparent text-fg hover:bg-surface-2 active:scale-[.98]',
  danger: 'bg-danger text-white hover:brightness-110 active:scale-[.98] shadow-sm shadow-danger/20',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 text-sm gap-1.5 rounded-lg',
  md: 'h-11 text-[15px] gap-2 rounded-xl',
  lg: 'h-13 text-base gap-2 rounded-xl',
}

const padding = computed(() => {
  if (props.iconOnly) return props.size === 'sm' ? 'w-9' : props.size === 'lg' ? 'w-13' : 'w-11'
  return props.size === 'sm' ? 'px-3' : props.size === 'lg' ? 'px-6' : 'px-5'
})

const classes = computed(() => [
  'inline-flex items-center justify-center font-medium select-none',
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
