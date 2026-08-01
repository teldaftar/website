<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const route = useRoute()
const auth = useAuthStore()

const schema = toTypedSchema(
  z.object({
    login: z.string().min(1, t('validation.required')),
    password: z.string().min(1, t('validation.required')),
  }),
)

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: schema,
})
const [login] = defineField('login')
const [password] = defineField('password')

const formError = ref('')

const onSubmit = handleSubmit(async (values) => {
  formError.value = ''
  try {
    await auth.login(values)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
    router.push(redirect ?? { name: 'dashboard' })
  } catch (err) {
    const e = normalizeError(err)
    // Generic message — never reveal which field was wrong.
    formError.value = mapErrorCode(e.code, e.details)
    notify.error(formError.value)
  }
})
</script>

<template>
  <AuthScaffold :title="t('auth.welcome')" :subtitle="t('auth.subtitle')">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppInput
        v-model="login"
        :label="t('auth.loginLabel')"
        :error="errors.login"
        autocomplete="username"
        placeholder="login"
      />
      <AppInput
        v-model="password"
        type="password"
        :label="t('auth.password')"
        :error="errors.password"
        autocomplete="current-password"
        placeholder="••••••••"
      />

      <p v-if="formError" class="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
        {{ formError }}
      </p>

      <AppButton type="submit" block size="lg" :loading="isSubmitting">
        {{ t('auth.signIn') }}
      </AppButton>
    </form>

    <p class="mt-5 text-center text-sm text-fg-muted">
      {{ t('auth.noAccount') }}
      <RouterLink :to="{ name: 'register' }" class="font-semibold text-primary hover:underline">
        {{ t('auth.signUp') }}
      </RouterLink>
    </p>
  </AuthScaffold>
</template>
