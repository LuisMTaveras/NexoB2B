<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top_right,var(--color-accent-100),transparent),radial-gradient(circle_at_bottom_left,var(--color-brand-50),transparent)] flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
      <!-- Logo / Header -->
      <div class="text-center mb-10 transition-all duration-500 transform hover:scale-105">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl mb-4 border border-white/50 animate-float">
          <Icon icon="mdi:nexus" class="text-4xl text-[var(--color-accent-600)]" />
        </div>
        <h1 class="text-3xl font-black text-[var(--color-brand-950)] tracking-tight">
           NexoB2B
           <span class="text-[var(--color-accent-500)]">Collaboration</span>
        </h1>
        <div class="flex items-center justify-center gap-3 mt-3">
          <div class="h-px w-8 bg-[var(--color-brand-200)]"></div>
          <p class="text-[10px] font-black text-[var(--color-brand-400)] uppercase tracking-[0.3em]">Activación de Cuenta</p>
          <div class="h-px w-8 bg-[var(--color-brand-200)]"></div>
        </div>
      </div>

      <div class="card overflow-hidden shadow-[0_32px_64px_-16px_rgba(15,23,42,0.12)] border-white/60">
        <!-- Status: Loading -->
        <div v-if="loading" class="p-16 text-center space-y-6">
          <div class="relative w-16 h-16 mx-auto">
            <div class="absolute inset-0 rounded-full border-4 border-[var(--color-brand-100)]"></div>
            <div class="absolute inset-0 rounded-full border-4 border-[var(--color-accent-500)] border-t-transparent animate-spin"></div>
          </div>
          <p class="text-sm font-bold text-[var(--color-brand-400)] animate-pulse">Validando invitación segura...</p>
        </div>

        <!-- Status: Error -->
        <div v-else-if="error" class="p-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div class="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center mx-auto text-rose-500 rotate-12 shadow-inner border border-rose-100">
            <Icon icon="mdi:alert-rhombus" class="w-12 h-12" />
          </div>
          <div>
            <h2 class="text-2xl font-black text-[var(--color-brand-950)]">Enlace No Válido</h2>
            <p class="text-sm text-[var(--color-brand-500)] mt-2 leading-relaxed px-4">{{ error }}</p>
          </div>
          <div class="pt-4 px-4">
             <router-link to="/login" class="btn btn-secondary w-full py-4 font-bold rounded-2xl">Volver al Portal</router-link>
          </div>
        </div>

        <!-- Status: Success -->
        <div v-else-if="success" class="p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
           <div class="relative w-24 h-24 mx-auto animate-success-pop">
             <div class="absolute inset-0 bg-emerald-100 rounded-3xl rotate-12 opacity-50"></div>
             <div class="absolute inset-0 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 shadow-xl border border-white">
               <Icon icon="mdi:shield-check" class="w-12 h-12" />
             </div>
           </div>
           <div>
             <h2 class="text-2xl font-black text-[var(--color-brand-950)]">¡Acceso Verificado!</h2>
             <p class="text-sm text-[var(--color-brand-500)] mt-3 leading-relaxed">Tu identidad ha sido confirmada y tu contraseña establecida con éxito. Bienvenido al ecosistema B2B.</p>
           </div>
           <router-link to="/login" class="btn btn-primary w-full py-4 text-base font-bold shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] rounded-2xl">
             Acceder al Portal
             <Icon icon="mdi:arrow-right" />
           </router-link>
        </div>

        <!-- Status: Form -->
        <div v-else class="p-8">
          <!-- User Profile Card -->
          <div class="mb-8 p-6 bg-gradient-to-br from-slate-50 to-white/30 rounded-3xl border border-white shadow-sm relative group overflow-hidden">
            <div class="absolute -right-4 -top-4 opacity-[0.03] transition-transform duration-700 group-hover:scale-150">
              <Icon icon="mdi:security" class="text-9xl" />
            </div>
            
            <div class="flex items-center gap-4 mb-3">
              <div class="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-1.5 transition-transform duration-300 group-hover:rotate-3">
                 <img v-if="userData?.company?.logo" :src="userData.company.logo" class="w-full h-full object-contain" />
                 <Icon v-else icon="mdi:office-building" class="text-2xl text-slate-300" />
              </div>
              <div>
                <span class="text-[10px] font-black text-[var(--color-accent-600)] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/50">Invitación VIP</span>
                <h2 class="text-xl font-black text-[var(--color-brand-950)] mt-1">Hola, {{ userData?.firstName }}</h2>
              </div>
            </div>
            
            <p class="text-xs text-[var(--color-brand-500)] leading-relaxed">
              Estás a un paso de unirte a <strong>{{ userData?.company?.name }}</strong>. 
              Crea tu contraseña para <strong>{{ userData?.email }}</strong>.
            </p>
          </div>

          <form @submit.prevent="submitPassword" class="space-y-6">
            <!-- New Password -->
            <div class="space-y-2">
              <div class="flex items-center justify-between px-1">
                <label class="label !mb-0 font-bold">Nueva Contraseña</label>
                <button type="button" @click="showPass = !showPass" class="text-[10px] font-black text-[var(--color-brand-400)] uppercase tracking-widest hover:text-[var(--color-accent-600)] transition-colors">
                  {{ showPass ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>
              <div class="relative group">
                <Icon icon="mdi:key-variant" class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-500)] z-10 transition-colors group-focus-within:text-[var(--color-accent-500)] text-lg" />
                <input 
                  v-model="password" 
                  :type="showPass ? 'text' : 'password'" 
                  class="input pl-12 py-3.5 bg-white/50 border-slate-200 focus:bg-white" 
                  placeholder="Introduce tu contraseña" 
                  required 
                />
              </div>
              
              <!-- Strength Meter -->
              <div class="px-1 pt-1">
                <div class="flex justify-between items-center mb-1.5">
                  <span class="text-[10px] font-bold text-[var(--color-brand-400)] uppercase">Fortaleza</span>
                  <span class="text-[10px] font-black uppercase" :class="strengthColor">{{ strengthLabel }}</span>
                </div>
                <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div :class="['h-full transition-all duration-500 rounded-full', s >= strengthScore ? strengthBarColor : 'bg-transparent']" 
                       v-for="s in [1,2,3,4,5]" :key="s" :style="{ width: '20%' }"></div>
                </div>
              </div>

              <!-- Criteria Checklist -->
              <div class="grid grid-cols-2 gap-2 mt-4 px-1">
                <div v-for="(criterion, key) in criteria" :key="key" 
                     class="flex items-center gap-2 transition-all duration-300"
                     :class="criterion.valid ? 'text-emerald-600' : 'text-slate-400'">
                  <Icon :icon="criterion.valid ? 'mdi:check-circle' : 'mdi:circle-outline'" class="text-sm" />
                  <span class="text-[10px] font-bold">{{ criterion.label }}</span>
                </div>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="space-y-2">
              <label class="label font-bold px-1">Confirmar Contraseña</label>
              <div class="relative group">
                <Icon icon="mdi:shield-lock-outline" class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-500)] z-10 transition-colors group-focus-within:text-[var(--color-accent-500)] text-lg" />
                <input 
                  v-model="confirmPassword" 
                  :type="showPass ? 'text' : 'password'" 
                  class="input pl-12 py-3.5 bg-white/50 border-slate-200 focus:bg-white" 
                  placeholder="Repite tu contraseña" 
                  required 
                />
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="formError" class="p-4 bg-rose-50 text-rose-700 text-xs rounded-2xl border border-rose-100 flex items-start gap-3 animate-shake">
              <Icon icon="mdi:alert-circle" class="text-lg shrink-0" />
              <p class="font-medium">{{ formError }}</p>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              class="btn btn-primary w-full py-4 font-black rounded-2xl text-base shadow-xl transition-all duration-300 disabled:shadow-none disabled:grayscale" 
              :disabled="submitting || !isFormValid"
              :class="isFormValid ? 'shadow-blue-200' : ''"
            >
              <Icon v-if="submitting" icon="mdi:loading" class="animate-spin text-xl" />
              <span v-else class="flex items-center gap-2">
                {{ submitting ? 'Guardando Seguridad...' : 'Activar Cuenta' }}
                <Icon icon="mdi:chevron-right" class="text-lg" />
              </span>
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-slate-50 text-center">
            <p class="text-[9px] text-[var(--color-brand-300)] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-2">
              <Icon icon="mdi:lock-check" class="text-xs" />
              Encriptación AES-256 Garantizada
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
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
const showPass = ref(false)
const formError = ref('')
const submitting = ref(false)

// Password Validation Logic
const criteria = reactive({
  length: { label: '8+ Caracteres', valid: false },
  upper: { label: 'Mayúscula', valid: false },
  lower: { label: 'Minúscula', valid: false },
  number: { label: 'Número', valid: false },
  special: { label: 'Especial (#$%)', valid: false }
})

watch(password, (val) => {
  criteria.length.valid = val.length >= 8
  criteria.upper.valid = /[A-Z]/.test(val)
  criteria.lower.valid = /[a-z]/.test(val)
  criteria.number.valid = /\d/.test(val)
  criteria.special.valid = /[!@#$%^&*(),.?":{}|<>]/.test(val)
})

const strengthScore = computed(() => {
  return Object.values(criteria).filter(c => c.valid).length
})

const strengthLabel = computed(() => {
  const scores = ['Débil', 'Bajo', 'Medio', 'Fuerte', 'Excelente', 'Imbatible']
  return scores[strengthScore.value]
})

const strengthColor = computed(() => {
  if (strengthScore.value <= 2) return 'text-rose-500'
  if (strengthScore.value <= 4) return 'text-amber-500'
  return 'text-emerald-500'
})

const strengthBarColor = computed(() => {
  if (strengthScore.value <= 2) return 'bg-rose-500'
  if (strengthScore.value <= 4) return 'bg-amber-500'
  return 'bg-emerald-500'
})

const isFormValid = computed(() => {
  return strengthScore.value >= 4 && password.value === confirmPassword.value && password.value.length > 0
})

async function validate() {
  if (!token) {
    error.value = 'El enlace de invitación es inválido o ha expirado.'
    loading.value = false
    return
  }

  try {
    const res = await api.get(`/customers/setup-password/validate/${token}`)
    userData.value = res.data.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'No pudimos verificar esta invitación. Contacta con soporte.'
  } finally {
    loading.value = false
  }
}

async function submitPassword() {
  if (password.value !== confirmPassword.value) {
    formError.value = 'Las contraseñas no coinciden.'
    return
  }

  if (strengthScore.value < 4) {
    formError.value = 'La contraseña no es lo suficientemente segura.'
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
    formError.value = err.response?.data?.error || 'No pudimos procesar tu clave. Inténtalo de nuevo.'
  } finally {
    submitting.value = false
  }
}

onMounted(validate)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap');

.font-display {
  font-family: 'Outfit', sans-serif;
}

.card {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

input::placeholder {
  color: var(--color-brand-200);
}
</style>
