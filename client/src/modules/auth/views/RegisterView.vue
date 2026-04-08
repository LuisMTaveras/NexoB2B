<template>
  <div class="min-h-screen bg-gradient-to-br from-[var(--color-brand-950)] to-[var(--color-brand-800)] flex items-center justify-center p-4">
    <div class="w-full max-w-lg">
      <div class="text-center mb-8">
        <div class="inline-flex w-14 h-14 bg-[var(--color-accent-500)] rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
          <span class="text-white font-bold text-2xl">N</span>
        </div>
        <h1 class="text-2xl font-bold text-white">Registra tu empresa</h1>
        <p class="text-white/50 mt-1 text-sm">Comienza tu prueba de NexoB2B gratis</p>
      </div>

      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <form @submit.prevent="handleRegister" class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label" for="firstName">Nombre</label>
              <input id="firstName" v-model="form.firstName" type="text" class="input" placeholder="Juan" required />
            </div>
            <div>
              <label class="label" for="lastName">Apellido</label>
              <input id="lastName" v-model="form.lastName" type="text" class="input" placeholder="Pérez" required />
            </div>
          </div>

          <div>
            <label class="label" for="companyName">Nombre de la empresa</label>
            <input
              id="companyName"
              v-model="form.companyName"
              type="text"
              class="input"
              placeholder="Distribuidora ABC SRL"
              @input="autoSlug"
              required
            />
          </div>

          <div>
            <label class="label" for="companySlug">
              Identificador único
              <span class="text-[var(--color-brand-400)] font-normal ml-1">nexob2b.com/{{ form.companySlug || 'tu-empresa' }}</span>
            </label>
            <input
              id="companySlug"
              v-model="form.companySlug"
              type="text"
              class="input"
              :class="{ error: errors.companySlug }"
              placeholder="distribuidora-abc"
              pattern="^[a-z0-9-]+$"
              required
            />
            <p v-if="errors.companySlug" class="text-[var(--color-danger-500)] text-xs mt-1">{{ errors.companySlug }}</p>
          </div>

          <div>
            <label class="label" for="regEmail">Correo electrónico</label>
            <input id="regEmail" v-model="form.email" type="email" class="input" placeholder="juan@empresa.com" required />
          </div>

          <div>
            <label class="label" for="regPassword">Contraseña</label>
            <div class="relative">
              <input
                id="regPassword"
                v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                class="input pr-10"
                placeholder="Mínimo 8 caracteres"
                required
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-400)]" @click="showPass = !showPass">
                <Icon :icon="showPass ? 'mdi:eye-off' : 'mdi:eye'" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <p v-if="apiError" class="text-sm text-[var(--color-danger-500)] bg-[var(--color-danger-100)] rounded-lg px-3 py-2.5">
            {{ apiError }}
          </p>

          <button type="submit" class="btn btn-primary w-full justify-center btn-lg" :disabled="auth.loading">
            <Icon v-if="auth.loading" icon="mdi:loading" class="w-5 h-5 animate-spin" />
            <span>{{ auth.loading ? 'Creando cuenta...' : 'Crear cuenta' }}</span>
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-[var(--color-brand-100)] text-center">
          <p class="text-sm text-[var(--color-brand-500)]">
            ¿Ya tienes cuenta?
            <RouterLink to="/login" class="text-[var(--color-accent-500)] font-medium hover:underline ml-1">Inicia sesión</RouterLink>
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
const errors = reactive({ companySlug: '' })

const form = reactive({
  firstName: '', lastName: '', companyName: '', companySlug: '', email: '', password: '',
})

function autoSlug() {
  form.companySlug = form.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function handleRegister() {
  apiError.value = ''
  errors.companySlug = ''
  if (!/^[a-z0-9-]+$/.test(form.companySlug)) {
    errors.companySlug = 'Solo letras minúsculas, números y guiones'
    return
  }
  try {
    await auth.register(form)
  } catch (err: any) {
    apiError.value = err?.response?.data?.error ?? 'Error al crear la cuenta'
  }
}
</script>
