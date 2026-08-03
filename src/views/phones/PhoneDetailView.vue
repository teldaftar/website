<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Smartphone, Pencil, Trash2, Tag, ShoppingCart, Undo2 } from 'lucide-vue-next'
import { usePhone, useDeletePhone } from '@/composables/usePhones'
import { usePhoneSale } from '@/composables/useSales'
import { formatMoney, formatMemory, formatDateTime, formatPhone, resolveImageUrl } from '@/lib/format'
import { phoneCondition, usedGrade, phoneStatus } from '@/lib/labels'
import { toUserMessage } from '@/api/errors'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import PageHeader from '@/components/shell/PageHeader.vue'
import PageContainer from '@/components/shell/PageContainer.vue'
import DataState from '@/components/ui/DataState.vue'
import SkeletonBlock from '@/components/ui/SkeletonBlock.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PhoneFormSheet from '@/components/phones/PhoneFormSheet.vue'
import SaleSheet from '@/components/sales/SaleSheet.vue'
import ReturnSheet from '@/components/sales/ReturnSheet.vue'
import DebtDetailCard from '@/components/debts/DebtDetailCard.vue'
import PayDebtSheet from '@/components/debts/PayDebtSheet.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))

const { data: phone, isLoading, isError, error, refetch } = usePhone(id)
const deletePhone = useDeletePhone()

// The sale this phone belongs to, so a sold phone can be returned from here.
const { data: phoneSale } = usePhoneSale(phone)
const returnableSale = computed(() => {
  const s = phoneSale.value
  if (!s || !phone.value) return null
  const hasReturnable = s.items.some(
    (it) => it.product.id === phone.value!.id && it.quantity - it.returnedQuantity > 0,
  )
  return hasReturnable ? s : null
})

const inStock = computed(() => phone.value?.status === 'IN_STOCK')
const memory = computed(() =>
  phone.value ? formatMemory(phone.value.ramGb, phone.value.storageGb) : '',
)
const supplierName = computed(() =>
  [phone.value?.supplierName, phone.value?.supplierSurname].filter(Boolean).join(' ').trim(),
)
const hasSupplier = computed(
  () => !!(supplierName.value || phone.value?.supplierPhone),
)

const showEdit = ref(false)
const showDelete = ref(false)
const showSale = ref(false)
const showReturn = ref(false)
const showPay = ref(false)

async function onDelete() {
  if (!phone.value) return
  try {
    await deletePhone.mutateAsync(phone.value.id)
    notify.success(t('app.delete'))
    router.replace({ name: 'phones' })
  } catch (err) {
    notify.error(toUserMessage(err))
  } finally {
    showDelete.value = false
  }
}

function sell() {
  if (!phone.value) return
  showSale.value = true
}
</script>

<template>
  <div>
    <PageHeader :title="phone?.name ?? t('phones.title')" back />
    <PageContainer>
      <DataState
        :loading="isLoading"
        :is-error="isError"
        :is-empty="false"
        :error-message="error ? toUserMessage(error) : undefined"
        @retry="refetch"
      >
        <template #skeleton>
          <div class="space-y-4">
            <SkeletonBlock class="h-52 rounded-2xl" />
            <SkeletonBlock class="h-40 rounded-2xl" />
          </div>
        </template>

        <div v-if="phone" class="space-y-4">
          <Card :padded="false" class="overflow-hidden">
            <div class="grid aspect-video w-full place-items-center bg-surface-2">
              <img
                v-if="resolveImageUrl(phone.imageUrl)"
                :src="resolveImageUrl(phone.imageUrl) ?? ''"
                alt=""
                class="size-full object-cover"
              />
              <Smartphone v-else class="size-16 text-fg-muted" />
            </div>
            <div class="p-4">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h2 class="text-xl font-bold text-fg">{{ phone.name }}</h2>
                  <p v-if="memory" class="text-sm text-fg-muted">{{ memory }}</p>
                </div>
                <Badge :tone="phoneStatus(phone.status).tone">
                  {{ phoneStatus(phone.status).label }}
                </Badge>
              </div>

              <!-- Sold: olingan + sotilgan + foyda side by side -->
              <div
                v-if="!inStock && phone.salePrice != null"
                class="mt-4 grid grid-cols-3 gap-3 text-sm"
              >
                <div class="rounded-xl bg-surface-2 p-3">
                  <p class="text-fg-muted">{{ t('phones.bought') }}</p>
                  <p class="mt-0.5 font-bold text-fg tnum">
                    {{ formatMoney(phone.purchasePrice) }}
                  </p>
                </div>
                <div class="rounded-xl bg-surface-2 p-3">
                  <p class="text-fg-muted">{{ t('phones.soldFor') }}</p>
                  <p class="mt-0.5 font-bold text-fg tnum">{{ formatMoney(phone.salePrice) }}</p>
                </div>
                <div class="rounded-xl bg-success-soft p-3">
                  <p class="text-success">{{ t('sales.profit') }}</p>
                  <p class="mt-0.5 font-bold text-success tnum">{{ formatMoney(phone.profit) }}</p>
                </div>
              </div>
              <!-- In stock: purchase price + optional list price -->
              <div v-else class="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-xl bg-surface-2 p-3">
                  <p class="text-fg-muted">{{ t('phones.purchasePrice') }}</p>
                  <p class="mt-0.5 font-bold text-fg tnum">
                    {{ formatMoney(phone.purchasePrice) }}
                  </p>
                </div>
                <div v-if="phone.listPrice" class="rounded-xl bg-surface-2 p-3">
                  <p class="text-fg-muted">{{ t('phones.listPrice') }}</p>
                  <p class="mt-0.5 font-bold text-fg tnum">{{ formatMoney(phone.listPrice) }}</p>
                </div>
              </div>

              <dl class="mt-4 space-y-2 text-sm">
                <div v-if="phone.imei" class="flex justify-between gap-2">
                  <dt class="text-fg-muted">{{ t('phones.imei') }}</dt>
                  <dd class="font-medium text-fg tnum">{{ phone.imei }}</dd>
                </div>
                <div v-if="phone.condition" class="flex justify-between gap-2">
                  <dt class="text-fg-muted">{{ t('phones.condition') }}</dt>
                  <dd>
                    <Badge :tone="phoneCondition(phone.condition).tone">
                      {{ phoneCondition(phone.condition).label }}
                    </Badge>
                  </dd>
                </div>
                <div v-if="phone.usedGrade" class="flex justify-between gap-2">
                  <dt class="text-fg-muted">{{ t('phones.usedGrade') }}</dt>
                  <dd>
                    <Badge :tone="usedGrade(phone.usedGrade).tone">
                      {{ usedGrade(phone.usedGrade).label }}
                    </Badge>
                  </dd>
                </div>
                <div v-if="phone.hasBox != null" class="flex justify-between gap-2">
                  <dt class="text-fg-muted">{{ t('phones.hasBox') }}</dt>
                  <dd>
                    <Badge :tone="phone.hasBox ? 'success' : 'neutral'">
                      {{ phone.hasBox ? t('phones.hasBoxYes') : t('phones.hasBoxNo') }}
                    </Badge>
                  </dd>
                </div>
                <div v-if="phone.hasCharger != null" class="flex justify-between gap-2">
                  <dt class="text-fg-muted">{{ t('phones.hasCharger') }}</dt>
                  <dd>
                    <Badge :tone="phone.hasCharger ? 'success' : 'neutral'">
                      {{ phone.hasCharger ? t('phones.hasChargerYes') : t('phones.hasChargerNo') }}
                    </Badge>
                  </dd>
                </div>
                <div v-if="phone.note" class="flex justify-between gap-2">
                  <dt class="text-fg-muted">{{ t('phones.note') }}</dt>
                  <dd class="max-w-[60%] text-right text-fg">{{ phone.note }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-fg-muted">{{ t('app.createdAt') }}</dt>
                  <dd class="text-fg-muted">{{ formatDateTime(phone.createdAt) }}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <!-- Supplier (who the phone was bought from) -->
          <div v-if="hasSupplier">
            <h3 class="mb-2 px-1 text-sm font-semibold text-fg-muted">{{ t('phones.supplier') }}</h3>
            <Card>
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p v-if="supplierName" class="font-semibold text-fg">{{ supplierName }}</p>
                  <p v-if="phone.supplierPhone" class="text-sm text-fg-muted tnum">
                    {{ formatPhone(phone.supplierPhone) }}
                  </p>
                </div>
                <a
                  v-if="phone.supplierPhone"
                  :href="`tel:${phone.supplierPhone}`"
                  class="shrink-0 text-sm font-medium text-primary"
                >
                  {{ t('app.call') }}
                </a>
              </div>
            </Card>
          </div>

          <!-- Debt block -->
          <div v-if="phone.debt">
            <h3 class="mb-2 px-1 text-sm font-semibold text-fg-muted">{{ t('nav.debts') }}</h3>
            <DebtDetailCard :debt="phone.debt" @pay="showPay = true" />
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-3">
            <AppButton v-if="inStock" size="lg" class="col-span-2" @click="sell">
              <template #icon><ShoppingCart class="size-5" /></template>
              {{ t('phones.sell') }}
            </AppButton>

            <AppButton variant="secondary" @click="showEdit = true">
              <template #icon><Pencil class="size-4" /></template>
              {{ t('app.edit') }}
            </AppButton>

            <AppButton
              variant="secondary"
              @click="router.push({ name: 'phone-label', params: { id: phone.id } })"
            >
              <template #icon><Tag class="size-4" /></template>
              {{ t('phones.printLabel') }}
            </AppButton>

            <AppButton
              v-if="returnableSale"
              variant="secondary"
              class="col-span-2"
              @click="showReturn = true"
            >
              <template #icon><Undo2 class="size-4" /></template>
              {{ t('returns.action') }}
            </AppButton>

            <AppButton
              v-if="inStock"
              variant="danger"
              class="col-span-2"
              @click="showDelete = true"
            >
              <template #icon><Trash2 class="size-4" /></template>
              {{ t('app.delete') }}
            </AppButton>
          </div>
        </div>
      </DataState>
    </PageContainer>

    <PhoneFormSheet v-if="phone" v-model="showEdit" :phone="phone" />
    <SaleSheet v-if="phone" v-model="showSale" :phone="phone" />
    <ReturnSheet v-if="returnableSale" v-model="showReturn" :sale="returnableSale" />
    <PayDebtSheet v-if="phone?.debt" v-model="showPay" :debt="phone.debt" @paid="refetch" />
    <ConfirmDialog
      v-model="showDelete"
      :title="t('phones.deleteConfirm')"
      danger
      :loading="deletePhone.isPending.value"
      @confirm="onDelete"
    />
  </div>
</template>
