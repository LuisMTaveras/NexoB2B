<template>
  <div class="min-h-screen bg-[var(--color-brand-50)]/50 flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo / Header -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-black text-[var(--color-brand-900)] flex items-center justify-center gap-2">
           <Icon icon="mdi:nexus" class="text-[var(--color-accent-600)]" />
           NexoB2B Collaboration
        </h1>
        <p class="text-xs font-bold text-[var(--color-brand-400)] uppercase tracking-widest mt-2">Activación de Cuenta</p>
      </div>

      <div class="card overflow-hidden shadow-2xl animate-in fade-in duration-500">
        <!-- Status: Loading -->
        <div v-if="loading" class="p-12 text-center space-y-4">
          <Icon icon="mdi:loading" class="w-10 h-10 animate-spin text-[var(--color-brand-200)] mx-auto" />
          <p class="text-sm font-bold text-[var(--color-brand-400)]">Validando invitación...</p>
        </div>

        <!-- Status: Error -->
        <div v-else-if="error" class="p-12 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-500">
            <Icon icon="mdi:alert-decagram" class="w-10 h-10" />
          </div>
          <h2 class="text-xl font-bold text-[var(--color-brand-900)]">Enlace No Válido</h2>
          <p class="text-sm text-[var(--color-brand-500)]">{{ error }}</p>
          <div class="pt-4">
             <router-link to="/login" class="btn btn-secondary w-full">Ir al Login</router-link>
          </div>
        </div>

        <!-- Status: Success / Finalized -->
        <div v-else-if="success" class="p-12 text-center space-y-6">
           <div class="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
             <Icon icon="mdi:checkbox-marked-circle-outline" class="w-12 h-12" />
           </div>
           <div>
             <h2 class="text-2xl font-black text-[var(--color-brand-900)]">¡Acceso Configurado!</h2>
             <p class="text-sm text-[var(--color-brand-500)] mt-2">Tu contraseña ha sido establecida correctamente. Ya puedes acceder al portal B2B.</p>
           </div>
           <router-link to="/login" class="btn btn-primary w-full py-4 text-base font-bold shadow-lg shadow-indigo-100">Iniciar Sesión</router-link>
        </div>

        <!-- Status: Form -->
        <div v-else class="p-8">
          <div class="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 relative">
            <div class="absolute -top-3 -right-3 w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-1">
               <img v-if="userData?.company?.logo" :src="userData.company.logo" class="w-full h-full object-contain" />
               <Icon v-else icon="mdi:office-building" class="text-slate-300" />
            </div>
            <h2 class="text-xl font-black text-[var(--color-brand-900)] font-display">Bienvenido, {{ userData?.firstName }}</h2>
            <p class="text-xs text-[var(--color-brand-500)] mt-2 leading-relaxed">
              <strong>{{ userData?.company?.name }}</strong> te invita a su portal oficial B2B. 
              Configura tu acceso para el correo <strong>{{ userData?.email }}</strong>.
            </p>
          </div>

          <form @submit.prevent="submitPassword" class="space-y-6">
            <div>
              <label class="label">Nueva Contraseña</label>
              <div class="relative">
                <Icon icon="mdi:lock-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-300)]" />
                <input v-model="password" type="password" class="input pl-10" placeholder="Mínimo 8 caracteres" required minlength="8" />
              </div>
            </div>

            <div>
              <label class="label">Confirmar Contraseña</label>
              <div class="relative">
                <Icon icon="mdi:lock-check-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-300)]" />
                <input v-model="confirmPassword" type="password" class="input pl-10" placeholder="Repite la contraseña" required />
              </div>
            </div>

            <div v-if="formError" class="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100">
              {{ formError }}
            </div>

            <button type="submit" class="btn btn-primary w-full py-4 font-bold shadow-lg shadow-indigo-100" :disabled="submitting">
              <Icon v-if="submitting" icon="mdi:loading" class="animate-spin" />
              {{ submitting ? 'Procesando...' : 'Activar Cuenta' }}
            </button>
          </form>

          <p class="text-[10px] text-center text-[var(--color-brand-300)] mt-8 uppercase font-bold tracking-widest">
            Seguridad garantizada por NexoB2B
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import api from '@/services/api'

const route = useRoute()
const token = route.query.token as string

const loading = ref(true)
const error = ref('')
const userData = ref<any>(null)
const success = ref(false)

const password = ref('')
const confirmPassword = ref('')
const formError = ref('')
const submitting = ref(false)

async function validate() {
  if (!token) {
    error.value = 'El token de invitación es requerido.'
    loading.value = false
    return
  }

  try {
    const res = await api.get(`/customers/setup-password/validate/${token}`)
    userData.value = res.data.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'No se pudo validar la invitación.'
  } finally {
    loading.value = false
  }
}

async function submitPassword() {
  if (password.value !== confirmPassword.value) {
    formError.value = 'Las contraseñas no coinciden.'
    return
  }

  formError.value = ''
  submitting.value = true

  try {
    await api.post('/customers/setup-password', {
      token,
      password: password.value
    })
    success.value = true
  } catch (err: any) {
    formError.value = err.response?.data?.error || 'Error al establecer la contraseña.'
  } finally {
    submitting.value = false
  }
}

onMounted(validate)
</script>

<style scoped>
.font-display {
  font-family: 'Outfit', 'Inter', sans-serif;
}
</style>
