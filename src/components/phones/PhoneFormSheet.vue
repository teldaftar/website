<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { CreatePhonePayload, Phone, PhoneCondition } from '@/api/types'
import { useCreatePhone, useUpdatePhone } from '@/composables/usePhones'
import { normalizeError, mapErrorCode } from '@/api/errors'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import MoneyInput from '@/components/ui/MoneyInput.vue'
import ImageUploader from '@/components/ui/ImageUploader.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{ phone?: Phone }>()
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ saved: [Phone] }>()

const router = useRouter()
const createPhone = useCreatePhone()
const updatePhone = useUpdatePhone()

const isEdit = () => !!props.phone
const isSold = () => props.phone?.status === 'SOLD'

interface FormState {
  name: string
  imei: string
  purchasePrice: number | null
  listPrice: number | null
  condition: PhoneCondition | undefined
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

function blank(): FormState {
  return {
    name: '',
    imei: '',
    purchasePrice: null,
    listPrice: null,
    condition: undefined,
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
    form.ramGb = p.ramGb != null ? String(p.ramGb) : ''
    form.storageGb = p.storageGb != null ? String(p.storageGb) : ''
    form.note = p.note ?? ''
    form.imageUrl = p.imageUrl ?? null
    form.supplierName = p.supplierName ?? ''
    form.supplierSurname = p.supplierSurname ?? ''
    form.supplierPhone = p.supplierPhone ?? ''
  } else {
    Object.assign(form, blank())
  }
})

const conditionOptions = [
  { label: t('phones.conditionNew'), value: 'NEW' as const },
  { label: t('phones.conditionMedium'), value: 'MEDIUM' as const },
  { label: t('phones.conditionUsed'), value: 'USED' as const },
]

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  // On a sold phone only note/image are editable, so skip the locked fields.
  if (!isSold()) {
    if (!form.name.trim()) errors.name = t('validation.required')
    // IMEI is optional free-form text now — no format rule.
    if (form.purchasePrice == null || form.purchasePrice <= 0)
      errors.purchasePrice = t('validation.required')
  }
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
    if (isSold() && props.phone) {
      // Sold: only note + image may change.
      const updated = await updatePhone.mutateAsync({
        id: props.phone.id,
        payload: { note: form.note || null, imageUrl: form.imageUrl },
      })
      finish(updated, t('settings.saved'))
      return
    }

    const payload: CreatePhonePayload = {
      name: form.name.trim(),
      // Omit IMEI when empty (optional field).
      imei: form.imei.trim() || undefined,
      purchasePrice: form.purchasePrice as number,
      listPrice: form.listPrice,
      condition: form.condition || undefined,
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
      : await createPhone.mutateAsync(payload)
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
      <p v-if="isSold()" class="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
        {{ t('phones.soldEditNote') }}
      </p>

      <AppInput
        v-model="form.name"
        :label="t('phones.name')"
        :error="errors.name"
        :disabled="isSold()"
      />
      <AppInput
        v-model="form.imei"
        :label="t('phones.imei')"
        :error="errors.imei"
        :hint="t('app.optional')"
        :disabled="isSold()"
      />
      <MoneyInput
        v-model="form.purchasePrice"
        :label="t('phones.purchasePrice')"
        :error="errors.purchasePrice"
        :disabled="isSold()"
      />
      <MoneyInput v-model="form.listPrice" :label="t('phones.listPrice')" :disabled="isSold()" />

      <div class="grid grid-cols-2 gap-3">
        <AppInput
          v-model="form.ramGb"
          :label="t('phones.ram')"
          inputmode="numeric"
          :disabled="isSold()"
        />
        <AppInput
          v-model="form.storageGb"
          :label="t('phones.storage')"
          inputmode="numeric"
          :disabled="isSold()"
        />
      </div>

      <AppSelect
        v-model="form.condition"
        :label="t('phones.condition')"
        :options="conditionOptions"
        :placeholder="t('app.all')"
        :disabled="isSold()"
      />

      <AppTextarea v-model="form.note" :label="t('phones.note')" :rows="2" />
      <ImageUploader v-model="form.imageUrl" :label="t('phones.image')" />

      <!-- Supplier (who the phone was bought from) — all optional -->
      <fieldset class="space-y-3 rounded-2xl border border-border bg-surface-2/40 p-4">
        <legend class="px-1 text-sm font-medium text-fg-muted">{{ t('phones.supplier') }}</legend>
        <div class="grid grid-cols-2 gap-3">
          <AppInput
            v-model="form.supplierName"
            :label="t('phones.supplierName')"
            :disabled="isSold()"
          />
          <AppInput
            v-model="form.supplierSurname"
            :label="t('phones.supplierSurname')"
            :disabled="isSold()"
          />
        </div>
        <AppInput
          v-model="form.supplierPhone"
          :label="t('phones.supplierPhone')"
          inputmode="tel"
          placeholder="998 90 123 45 67"
          :disabled="isSold()"
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
