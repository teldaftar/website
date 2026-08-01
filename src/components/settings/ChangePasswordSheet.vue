<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { normalizeError, mapErrorCode } from '@/api/errors'
import { notify } from '@/lib/toast'
import { t } from '@/i18n'
import ModalSheet from '@/components/ui/ModalSheet.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const open = defineModel<boolean>({ required: true })
const router = useRouter()
const auth = useAuthStore()

const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.currentPassword) errors.currentPassword = t('validation.required')
  if (form.newPassword.length < 8) errors.newPassword = t('validation.passwordMin')
  if (form.newPassword !== form.confirmPassword)
    errors.confirmPassword = t('validation.passwordMatch')
  return Object.keys(errors).length === 0
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await auth.changePassword({ ...form })
    // Backend revoked all sessions → force a clean re-login.
    notify.success(t('auth.passwordChanged'))
    open.value = false
    router.replace({ name: 'login' })
  } catch (err) {
    const e = normalizeError(err)
    const msg = mapErrorCode(e.code, e.details)
    if (e.code === 'CURRENT_PASSWORD_INVALID') errors.currentPassword = msg
    else if (e.code === 'PASSWORD_MISMATCH') errors.confirmPassword = msg
    notify.error(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <ModalSheet v-model="open" :title="t('auth.changePassword')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppInput
        v-model="form.currentPassword"
        type="password"
        :label="t('auth.currentPassword')"
        :error="errors.currentPassword"
        autocomplete="current-password"
      />
      <AppInput
        v-model="form.newPassword"
        type="password"
        :label="t('auth.newPassword')"
        :error="errors.newPassword"
        autocomplete="new-password"
      />
      <AppInput
        v-model="form.confirmPassword"
        type="password"
        :label="t('auth.confirmPassword')"
        :error="errors.confirmPassword"
        autocomplete="new-password"
      />
      <div class="flex gap-3 pt-1">
        <AppButton type="button" variant="secondary" block @click="open = false">
          {{ t('app.cancel') }}
        </AppButton>
        <AppButton type="submit" block :loading="submitting">{{ t('app.save') }}</AppButton>
      </div>
    </form>
  </ModalSheet>
</template>
