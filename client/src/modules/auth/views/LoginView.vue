<template>
  <div class="min-h-screen bg-gradient-to-br from-[var(--color-brand-950)] to-[var(--color-brand-800)] flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex w-14 h-14 bg-[var(--color-accent-500)] rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
          <span class="text-white font-bold text-2xl">N</span>
        </div>
        <h1 class="text-2xl font-bold text-white">Bienvenido a NexoB2B</h1>
        <p class="text-white/50 mt-1 text-sm">Ingresa a tu portal administrativo</p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="label" for="email">Correo electrónico</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input"
              :class="{ error: errors.email }"
              placeholder="admin@empresa.com"
              autocomplete="email"
              required
            />
            <p v-if="errors.email" class="text-[var(--color-danger-500)] text-xs mt-1">{{ errors.email }}</p>
          </div>

          <div>
            <label class="label" for="password">Contraseña</label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                class="input pr-10"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]"
                @click="showPass = !showPass"
              >
                <Icon :icon="showPass ? 'mdi:eye-off' : 'mdi:eye'" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <p v-if="apiError" class="text-sm text-[var(--color-danger-500)] bg-[var(--color-danger-100)] rounded-lg px-3 py-2.5">
            {{ apiError }}
          </p>

          <button
            type="submit"
            class="btn btn-primary w-full justify-center btn-lg"
            :disabled="auth.loading"
          >
            <Icon v-if="auth.loading" icon="mdi:loading" class="w-5 h-5 animate-spin" />
            <span>{{ auth.loading ? 'Ingresando...' : 'Ingresar' }}</span>
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-[var(--color-brand-100)] text-center">
          <p class="text-sm text-[var(--color-brand-500)]">
            ¿Nuevo en NexoB2B?
            <RouterLink to="/register" class="text-[var(--color-accent-500)] font-medium hover:underline ml-1">
              Registra tu empresa
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const showPass = ref(false)
const apiError = ref('')
const errors = reactive({ email: '' })

const form = reactive({ email: '', password: '' })

async function handleLogin() {
  apiError.value = ''
  try {
    await auth.login(form.email, form.password)
  } catch (err: any) {
    apiError.value = err?.response?.data?.error ?? 'Error al iniciar sesión. Verifica tus credenciales.'
  }
}
</script>
