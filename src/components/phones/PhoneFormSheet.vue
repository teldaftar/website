<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { CreatePhonePayload, Phone, PhoneCondition, UsedGrade } from '@/api/types'
import { useCreatePhone, useUpdatePhone } from '@/composables/usePhones'
import { normalizeError, mapErrorCode } from '@/api/errors'
import { newIdempotencyKey } from '@/lib/idempotency'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import ImageUploader from '@/components/ui/ImageUploader.vue'
import Toggle from '@/components/ui/Toggle.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ phone?: Phone }>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ saved: [Phone] }>()

const router = useRouter()
const createPhone = useCreatePhone()
const updatePhone = useUpdatePhone()

const isEdit = () => !!props.phone

interface FormState {
  name: string
  imei: string
  purchasePrice: number | null
  listPrice: number | null
  condition: PhoneCondition | undefined
  usedGrade: UsedGrade | undefined
  hasBox: boolean
  hasCharger: boolean
  ramGb: string
  storageGb: string
  note: string
  imageUrl: string | null
  supplierName: string
  supplierSurname: string
  supplierPhone: string
}

const form = reactive<FormState>(blank())
const errors = reactive<Record<string, string>>({})

// One idempotency key per "add phone" intent — minted when the modal opens for a
// new phone and kept across retries so a re-submit never creates a duplicate.
const idempotencyKey = ref('')

function blank(): FormState {
  return {
    name: '',
    imei: '',
    purchasePrice: null,
    listPrice: null,
    condition: undefined,
    usedGrade: undefined,
    hasBox: false,
    hasCharger: false,
    ramGb: '',
    storageGb: '',
    note: '',
    imageUrl: null,
    supplierName: '',
    supplierSurname: '',
    supplierPhone: '',
  }
}

// Reset the form whenever it opens (fresh add, or hydrate the phone for edit).
watch(open, (v) => {
  if (!v) return
  Object.keys(errors).forEach((k) => delete errors[k])
  const p = props.phone
  if (p) {
    form.name = p.name
    form.imei = p.imei ?? ''
    form.purchasePrice = p.purchasePrice
    form.listPrice = p.listPrice ?? null
    form.condition = p.condition ?? undefined
    form.usedGrade = p.usedGrade ?? undefined
    form.hasBox = p.hasBox ?? false
    form.hasCharger = p.hasCharger ?? false
    form.ramGb = p.ramGb != null ? String(p.ramGb) : ''
    form.storageGb = p.storageGb != null ? String(p.storageGb) : ''
    form.note = p.note ?? ''
    form.imageUrl = p.imageUrl ?? null
    form.supplierName = p.supplierName ?? ''
    form.supplierSurname = p.supplierSurname ?? ''
    form.supplierPhone = p.supplierPhone ?? ''
  } else {
    Object.assign(form, blank())
    // Fresh add → fresh idempotency key for this new intent.
    idempotencyKey.value = newIdempotencyKey()
  }
})

const conditionOptions = [
  { label: t('phones.conditionNew'), value: 'NEW' as const },
  { label: t('phones.conditionUsed'), value: 'USED' as const },
]

const usedGradeOptions = [
  { label: t('phones.gradeGood'), value: 'GOOD' as const },
  { label: t('phones.gradeMedium'), value: 'MEDIUM' as const },
  { label: t('phones.gradeBad'), value: 'BAD' as const },
]

// usedGrade only applies to a USED phone — clear it when leaving USED.
watch(
  () => form.condition,
  (c) => {
    if (c !== 'USED') form.usedGrade = undefined
  },
)

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.name.trim()) errors.name = t('validation.required')
  // IMEI is optional free-form text now — no format rule.
  // Purchase price may be 0 (tekin — free intake); only null / negative is invalid.
  if (form.purchasePrice == null || form.purchasePrice < 0)
    errors.purchasePrice = t('validation.required')
  return Object.keys(errors).length === 0
}

const submitting = ref(false)

function toNum(v: string): number | undefined {
  const n = Number(v)
  return v.trim() !== '' && Number.isFinite(n) && n > 0 ? n : undefined
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const payload: CreatePhonePayload = {
      name: form.name.trim(),
      // Omit IMEI when empty (optional field).
      imei: form.imei.trim() || undefined,
      purchasePrice: form.purchasePrice as number,
      listPrice: form.listPrice,
      condition: form.condition || undefined,
      usedGrade: form.condition === 'USED' ? form.usedGrade || null : null,
      hasBox: form.hasBox,
      hasCharger: form.hasCharger,
      ramGb: toNum(form.ramGb) ?? null,
      storageGb: toNum(form.storageGb) ?? null,
      note: form.note || null,
      imageUrl: form.imageUrl,
      supplierName: form.supplierName.trim() || null,
      supplierSurname: form.supplierSurname.trim() || null,
      supplierPhone: form.supplierPhone.trim() || null,
    }

    const saved = props.phone
      ? await updatePhone.mutateAsync({ id: props.phone.id, payload })
      : // Same key on every retry of this intent → backend won't duplicate.
        await createPhone.mutateAsync({ ...payload, idempotencyKey: idempotencyKey.value })
    finish(saved, isEdit() ? t('settings.saved') : t('phones.added'))
  } catch (err) {
    handleError(err)
  } finally {
    submitting.value = false
  }
}

function finish(phone: Phone, message: string) {
  notify.success(message)
  emit('saved', phone)
  open.value = false
}

function handleError(err: unknown) {
  const e = normalizeError(err)
  const msg = mapErrorCode(e.code, e.details)
  if (e.code === 'IMEI_ALREADY_EXISTS') {
    errors.imei = msg
    const phoneId = e.details?.phoneId
    if (typeof phoneId === 'string') {
      notify.error(msg, t('phones.openExisting'))
      // Offer to jump to the existing phone.
      setTimeout(() => {
        open.value = false
        router.push({ name: 'phone-detail', params: { id: phoneId } })
      }, 800)
      return
    }
  }
  notify.error(msg)
}
</script>

<template>
  <ModalSheet v-model="open" :title="isEdit() ? t('phones.edit') : t('phones.add')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppInput v-model="form.name" :label="t('phones.name')" :error="errors.name" />
      <AppInput
        v-model="form.imei"
        :label="t('phones.imei')"
        :error="errors.imei"
        :hint="t('app.optional')"
      />
      <MoneyInput
        v-model="form.purchasePrice"
        :label="t('phones.purchasePrice')"
        :error="errors.purchasePrice"
        :hint="t('receipts.freeHint')"
      />
      <MoneyInput v-model="form.listPrice" :label="t('phones.listPrice')" />

      <div class="grid grid-cols-2 gap-3">
        <AppInput v-model="form.ramGb" :label="t('phones.ram')" inputmode="numeric" />
        <AppInput v-model="form.storageGb" :label="t('phones.storage')" inputmode="numeric" />
      </div>

      <AppSelect
        v-model="form.condition"
        :label="t('phones.condition')"
        :options="conditionOptions"
        :placeholder="t('app.all')"
      />

      <AppSelect
        v-if="form.condition === 'USED'"
        v-model="form.usedGrade"
        :label="t('phones.usedGrade')"
        :options="usedGradeOptions"
        :placeholder="t('app.all')"
      />

      <label
        class="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/40 px-4 py-3"
      >
        <span class="font-medium text-fg">{{
          form.hasBox ? t('phones.hasBoxYes') : t('phones.hasBoxNo')
        }}</span>
        <Toggle v-model="form.hasBox" />
      </label>

      <label
        class="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/40 px-4 py-3"
      >
        <span class="font-medium text-fg">{{
          form.hasCharger ? t('phones.hasChargerYes') : t('phones.hasChargerNo')
        }}</span>
        <Toggle v-model="form.hasCharger" />
      </label>

      <AppTextarea v-model="form.note" :label="t('phones.note')" :rows="2" />
      <ImageUploader v-model="form.imageUrl" :label="t('phones.image')" />

      <!-- Supplier (who the phone was bought from) — all optional -->
      <fieldset class="space-y-3 rounded-2xl border border-border bg-surface-2/40 p-4">
        <legend class="px-1 text-sm font-medium text-fg-muted">{{ t('phones.supplier') }}</legend>
        <div class="grid grid-cols-2 gap-3">
          <AppInput v-model="form.supplierName" :label="t('phones.supplierName')" />
          <AppInput v-model="form.supplierSurname" :label="t('phones.supplierSurname')" />
        </div>
        <AppInput
          v-model="form.supplierPhone"
          :label="t('phones.supplierPhone')"
          inputmode="tel"
          placeholder="998 90 123 45 67"
        />
      </fieldset>

      <div class="flex gap-3 pt-1">
        <AppButton type="button" variant="secondary" block @click="open = false">
          {{ t('app.cancel') }}
        </AppButton>
        <AppButton type="submit" block :loading="submitting">{{ t('app.save') }}</AppButton>
      </div>
    </form>
  </ModalSheet>
</template>
