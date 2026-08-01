<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'
import { t } from '@/i18n'
import { normalizeError, mapErrorCode } from '@/api/errors'
import { notify } from '@/lib/toast'
import AuthScaffold from '@/components/auth/AuthScaffold.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const auth = useAuthStore()

const schema = toTypedSchema(
  z
    .object({
      shopName: z.string().min(1, t('validation.required')),
      fullName: z.string().min(1, t('validation.required')),
      login: z
        .string()
        .min(3, t('validation.min', { n: 3 }))
        .max(32, t('validation.max', { n: 32 }))
        .regex(/^[a-zA-Z0-9._-]+$/, t('validation.loginPattern')),
      password: z.string().min(8, t('validation.passwordMin')),
      confirmPassword: z.string().min(1, t('validation.required')),
      inviteCode: z.string().optional(),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t('validation.passwordMatch'),
      path: ['confirmPassword'],
    }),
)

const { defineField, handleSubmit, errors, isSubmitting, setFieldError } = useForm({
  validationSchema: schema,
})
const [shopName] = defineField('shopName')
const [fullName] = defineField('fullName')
const [login] = defineField('login')
const [password] = defineField('password')
const [confirmPassword] = defineField('confirmPassword')
const [inviteCode] = defineField('inviteCode')

// Show the invite field once the server says it's required (kept visible after).
const showInvite = ref(false)

const onSubmit = handleSubmit(async (values) => {
  try {
    await auth.register(values)
    notify.success(t('auth.welcome'))
    router.push({ name: 'dashboard' })
  } catch (err) {
    const e = normalizeError(err)
    const msg = mapErrorCode(e.code, e.details)
    // Surface server codes on the most relevant field.
    switch (e.code) {
      case 'LOGIN_ALREADY_TAKEN':
        setFieldError('login', msg)
        break
      case 'PASSWORD_MISMATCH':
        setFieldError('confirmPassword', msg)
        break
      case 'INVITE_CODE_REQUIRED':
      case 'INVITE_CODE_INVALID':
        showInvite.value = true
        setFieldError('inviteCode', msg)
        break
    }
    notify.error(msg)
  }
})
</script>

<template>
  <AuthScaffold :title="t('auth.register')" :subtitle="t('auth.subtitle')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppInput v-model="shopName" :label="t('auth.shopName')" :error="errors.shopName" />
      <AppInput v-model="fullName" :label="t('auth.fullName')" :error="errors.fullName" />
      <AppInput
        v-model="login"
        :label="t('auth.loginLabel')"
        :error="errors.login"
        autocomplete="username"
        :hint="t('validation.loginPattern')"
      />
      <AppInput
        v-model="password"
        type="password"
        :label="t('auth.password')"
        :error="errors.password"
        autocomplete="new-password"
      />
      <AppInput
        v-model="confirmPassword"
        type="password"
        :label="t('auth.confirmPassword')"
        :error="errors.confirmPassword"
        autocomplete="new-password"
      />

      <button
        v-if="!showInvite"
        type="button"
        class="text-sm text-fg-muted hover:text-fg"
        @click="showInvite = true"
      >
        {{ t('auth.inviteCode') }} ({{ t('app.optional') }})
      </button>
      <AppInput
        v-else
        v-model="inviteCode"
        :label="t('auth.inviteCode')"
        :error="errors.inviteCode"
      />

      <AppButton type="submit" block size="lg" :loading="isSubmitting">
        {{ t('auth.signUp') }}
      </AppButton>
    </form>

    <p class="mt-5 text-center text-sm text-fg-muted">
      {{ t('auth.haveAccount') }}
      <RouterLink :to="{ name: 'login' }" class="font-semibold text-primary hover:underline">
        {{ t('auth.signIn') }}
      </RouterLink>
    </p>
  </AuthScaffold>
</template>
