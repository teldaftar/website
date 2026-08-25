<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Check, Plus, Headphones, Phone } from 'lucide-vue-next'
import type { Accessory, AccessoryKind, AccessoryListQuery, NewAccessoryInput } from '@/api/types'
import { useAccessoriesList } from '@/composables/useAccessories'
import { toUserMessage } from '@/api/errors'
import { resolveImageUrl } from '@/lib/format'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import Segmented from '@/components/ui/Segmented.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import DataState from '@/components/ui/DataState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import AppButton from '@/components/ui/AppButton.vue'
import NewAccessorySheet from './NewAccessorySheet.vue'

/** Accessory ids already in the receipt table — shown as added / disabled. */
const props = defineProps<{ addedIds: string[] }>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ add: [{ existing: Accessory[]; created: NewAccessoryInput[] }] }>()

const addedSet = computed(() => new Set(props.addedIds))

// One receipt can mix both families — the tab picks the kind of the existing-item
// list and of anything created here. Selections from the other tab are kept.
const kind = ref<AccessoryKind>('ACCESSORY')
const kindOptions = [
  { label: t('receipts.tabAccessories'), value: 'ACCESSORY' as const },
  { label: t('receipts.tabKeypad'), value: 'KEYPAD_PHONE' as const },
]

const search = ref('')
const query = computed<AccessoryListQuery>(() => ({
  kind: kind.value === 'KEYPAD_PHONE' ? 'KEYPAD_PHONE' : undefined,
  search: search.value.trim() || undefined,
}))
const {
  items,
  isLoading,
  isError,
  error,
  refetch,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useAccessoriesList(query)

// Selection state (reset every time the sheet opens).
const selected = reactive(new Map<string, Accessory>())
let newSeq = 1
const pendingNew = ref<{ id: number; input: NewAccessoryInput; selected: boolean }[]>([])
const showCreate = ref(false)

watch(open, (v) => {
  if (!v) return
  selected.clear()
  pendingNew.value = []
  search.value = ''
  kind.value = 'ACCESSORY'
})

const selectedCount = computed(
  () => selected.size + pendingNew.value.filter((p) => p.selected).length,
)

function toggleExisting(acc: Accessory) {
  if (addedSet.value.has(acc.id)) return
  if (selected.has(acc.id)) selected.delete(acc.id)
  else selected.set(acc.id, acc)
}

function onCreate(input: NewAccessoryInput) {
  pendingNew.value.unshift({ id: newSeq++, input, selected: true })
}

function submit() {
  if (selectedCount.value === 0) return
  emit('add', {
    existing: [...selected.values()],
    created: pendingNew.value.filter((p) => p.selected).map((p) => p.input),
  })
  open.value = false
}
</script>

<template>
  <ModalSheet v-model="open" :title="t('receipts.pickTitle')">
    <div class="space-y-3">
      <Segmented v-model="kind" :options="kindOptions" />
      <SearchBar v-model="search" />

      <AppButton variant="secondary" block @click="showCreate = true">
        <template #icon><Plus class="size-4" /></template>
        {{ t('receipts.createNew') }}
      </AppButton>

      <!-- Newly created (pending) accessories -->
      <button
        v-for="p in pendingNew"
        :key="`new-${p.id}`"
        type="button"
        class="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors"
        :class="
          p.selected ? 'border-primary bg-primary-soft/40' : 'border-border hover:bg-surface-2'
        "
        @click="p.selected = !p.selected"
      >
        <span
          class="grid size-5 shrink-0 place-items-center rounded-md border"
          :class="p.selected ? 'border-primary bg-primary text-primary-fg' : 'border-border'"
        >
          <Check v-if="p.selected" class="size-3.5" :stroke-width="3" />
        </span>
        <span
          class="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2"
        >
          <img
            v-if="resolveImageUrl(p.input.imageUrl)"
            :src="resolveImageUrl(p.input.imageUrl) ?? ''"
            alt=""
            class="size-full object-cover"
          />
          <component
            :is="p.input.kind === 'KEYPAD_PHONE' ? Phone : Headphones"
            v-else
            class="size-4 text-fg-muted"
          />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate font-medium text-fg">{{ p.input.name }}</span>
          <span class="text-xs text-primary">{{ t('receipts.lineNew') }}</span>
        </span>
      </button>

      <!-- Existing accessories -->
      <DataState
        :loading="isLoading"
        :is-error="isError"
        :is-empty="items.length === 0"
        :error-message="error ? toUserMessage(error) : undefined"
        @retry="refetch"
      >
        <template #skeleton>
          <div class="space-y-2">
            <SkeletonBlock v-for="i in 5" :key="i" class="h-14 rounded-xl" />
          </div>
        </template>

        <template #empty>
          <EmptyState
            :icon="kind === 'KEYPAD_PHONE' ? Phone : Headphones"
            :title="t('receipts.noResults')"
          />
        </template>

        <div class="space-y-2">
          <button
            v-for="acc in items"
            :key="acc.id"
            type="button"
            :disabled="addedSet.has(acc.id)"
            class="flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors disabled:opacity-55"
            :class="
              selected.has(acc.id)
                ? 'border-primary bg-primary-soft/40'
                : 'border-border enabled:hover:bg-surface-2'
            "
            @click="toggleExisting(acc)"
          >
            <span
              class="grid size-5 shrink-0 place-items-center rounded-md border"
              :class="
                selected.has(acc.id) || addedSet.has(acc.id)
                  ? 'border-primary bg-primary text-primary-fg'
                  : 'border-border'
              "
            >
              <Check
                v-if="selected.has(acc.id) || addedSet.has(acc.id)"
                class="size-3.5"
                :stroke-width="3"
              />
            </span>
            <span
              class="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2"
            >
              <img
                v-if="resolveImageUrl(acc.imageUrl)"
                :src="resolveImageUrl(acc.imageUrl) ?? ''"
                alt=""
                class="size-full object-cover"
              />
              <component
                :is="kind === 'KEYPAD_PHONE' ? Phone : Headphones"
                v-else
                class="size-4 text-fg-muted"
              />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate font-medium text-fg">{{ acc.name }}</span>
              <span class="text-xs text-fg-muted">
                <template v-if="addedSet.has(acc.id)">{{ t('receipts.added') }}</template>
                <template v-else>{{ t('receipts.quantityInStock', { n: acc.quantity }) }}</template>
              </span>
            </span>
          </button>

          <AppButton
            v-if="hasNextPage"
            variant="ghost"
            block
            :loading="isFetchingNextPage"
            @click="fetchNextPage()"
          >
            {{ t('receipts.loadMore') }}
          </AppButton>
        </div>
      </DataState>
    </div>

    <!-- Sticky add bar -->
    <div
      class="sticky bottom-0 -mx-5 -mb-6 mt-3 border-t border-border bg-surface px-5 py-3 lg:-mb-5"
    >
      <AppButton block :disabled="selectedCount === 0" @click="submit">
        {{ t('receipts.addSelected') }}
        <span v-if="selectedCount > 0">({{ selectedCount }})</span>
      </AppButton>
    </div>
  </ModalSheet>

  <NewAccessorySheet v-model="showCreate" :kind="kind" @create="onCreate" />
</template>
