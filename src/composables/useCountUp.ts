import { ref, watch, type Ref } from 'vue'

/**
 * Animate a number toward `source` with an ease-out ramp. Honors
 * prefers-reduced-motion by snapping straight to the target value.
 * Returns a reactive number to render.
 */
export function useCountUp(source: Ref<number>, durationMs = 700): Ref<number> {
  const output = ref(source.value)
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let raf = 0
  let startTs = 0
  let from = source.value

  function step(ts: number) {
    if (!startTs) startTs = ts
    const p = Math.min(1, (ts - startTs) / durationMs)
    const eased = 1 - Math.pow(1 - p, 3)
    output.value = from + (source.value - from) * eased
    if (p < 1) raf = requestAnimationFrame(step)
  }

  watch(
    source,
    (next) => {
      cancelAnimationFrame(raf)
      if (reduced) {
        output.value = next
        return
      }
      from = output.value
      startTs = 0
      raf = requestAnimationFrame(step)
    },
    { immediate: false },
  )

  return output
}
