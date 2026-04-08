<template>
  <div class="max-w-4xl mx-auto">
    <!-- Page header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-[var(--color-brand-900)] tracking-tight">Mi Perfil</h2>
      <p class="text-sm text-[var(--color-brand-600)] mt-1">Gestiona tu información personal y la seguridad de tu cuenta.</p>
    </div>

    <!-- Tabs Header -->
    <div class="flex gap-6 border-b border-[var(--color-brand-200)] mb-8">
      <button
        @click="activeTab = 'profile'"
        class="pb-3 text-sm font-semibold transition-colors border-b-2"
        :class="activeTab === 'profile' ? 'text-[var(--color-accent-600)] border-[var(--color-accent-600)]' : 'text-[var(--color-brand-500)] border-transparent hover:text-[var(--color-brand-800)]'"
      >
        Datos Personales
      </button>
      <button
        @click="activeTab = 'security'"
        class="pb-3 text-sm font-semibold transition-colors border-b-2"
        :class="activeTab === 'security' ? 'text-[var(--color-accent-600)] border-[var(--color-accent-600)]' : 'text-[var(--color-brand-500)] border-transparent hover:text-[var(--color-brand-800)]'"
      >
        Gestión de Contraseña
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Sidebar Info Card -->
      <div class="md:col-span-1">
        <div class="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.1)] rounded-2xl p-6 flex flex-col items-center text-center">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-accent-100)] to-[var(--color-accent-300)] flex items-center justify-center text-[var(--color-accent-700)] text-3xl font-bold border border-[var(--color-accent-400)] shadow-inner mb-4">
            {{ initials }}
          </div>
          <h3 class="text-lg font-bold text-[var(--color-brand-900)]">{{ auth.fullName }}</h3>
          <p class="text-sm text-[var(--color-brand-500)]">{{ auth.user?.role }}</p>
          
          <div class="w-full h-px bg-gradient-to-r from-transparent via-[var(--color-brand-200)] to-transparent my-6"></div>
          
          <div class="w-full text-left space-y-3">
            <div class="flex items-center gap-2 text-sm text-[var(--color-brand-600)]">
              <Icon icon="mdi:email-outline" class="w-4 h-4 text-[var(--color-brand-400)]" />
              <span class="truncate">{{ auth.user?.email }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-[var(--color-brand-600)]">
              <Icon icon="mdi:office-building-outline" class="w-4 h-4 text-[var(--color-brand-400)]" />
              <span class="truncate">{{ auth.company?.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="md:col-span-2 space-y-6">
        
        <!-- Tab: Profile -->
        <div v-show="activeTab === 'profile'" class="bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_15px_40px_-15px_rgba(15,23,42,0.1)] rounded-2xl p-8">
          <h3 class="text-lg font-semibold text-[var(--color-brand-900)] mb-6 flex items-center gap-2">
            <Icon icon="mdi:account-details-outline" class="w-5 h-5 text-[var(--color-accent-500)]" />
            Información Básica
          </h3>
          <form @submit.prevent="handleUpdateProfile" class="space-y-5">
            <div class="grid grid-cols-2 gap-5">
              <div>
                <label class="label">Nombres</label>
                <input v-model="profileForm.firstName" type="text" class="input" required />
              </div>
              <div>
                <label class="label">Apellidos</label>
                <input v-model="profileForm.lastName" type="text" class="input" required />
              </div>
            </div>
            <div>
              <label class="label">Correo Electrónico</label>
              <input v-model="profileForm.email" type="email" class="input" required />
            </div>
            
            <div v-if="profileError" class="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
              <Icon icon="mdi:alert-circle-outline" class="w-4 h-4" />
              {{ profileError }}
            </div>

            <div class="pt-4 border-t border-[var(--color-brand-100)] flex justify-end">
              <button type="submit" class="btn btn-primary" :disabled="auth.loading">
                <Icon v-if="auth.loading" icon="mdi:loading" class="w-4 h-4 animate-spin" />
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>

        <!-- Tab: Security -->
        <div v-show="activeTab === 'security'" class="bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_15px_40px_-15px_rgba(15,23,42,0.1)] rounded-2xl p-8">
          <h3 class="text-lg font-semibold text-[var(--color-brand-900)] mb-6 flex items-center gap-2">
            <Icon icon="mdi:shield-lock-outline" class="w-5 h-5 text-[var(--color-accent-500)]" />
            Cambiar Contraseña
          </h3>
          <form @submit.prevent="handleChangePassword" class="space-y-5">
            <div>
              <label class="label">Contraseña Actual</label>
              <input v-model="passwordForm.currentPassword" type="password" class="input tracking-widest" required placeholder="••••••••" />
            </div>
            <div>
              <label class="label">Nueva Contraseña</label>
              <input v-model="passwordForm.newPassword" type="password" class="input tracking-widest" required placeholder="••••••••" />
              <p class="text-xs text-[var(--color-brand-500)] mt-2">Debe tener al menos 8 caracteres, incluir una mayúscula y un número.</p>
            </div>
            <div>
              <label class="label">Confirmar Nueva Contraseña</label>
              <input v-model="passwordForm.confirmPassword" type="password" class="input tracking-widest" required placeholder="••••••••" />
            </div>

            <div v-if="passwordError" class="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
              <Icon icon="mdi:alert-circle-outline" class="w-4 h-4 shrink-0" />
              {{ passwordError }}
            </div>

            <div class="pt-4 border-t border-[var(--color-brand-100)] flex justify-end">
              <button type="submit" class="btn btn-primary" :disabled="auth.loading">
                <Icon v-if="auth.loading" icon="mdi:loading" class="w-4 h-4 animate-spin" />
                Actualizar Contraseña
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>

    <!-- Toast (Premium Corporate Dark) -->
    <Transition
      enter-active-class="transform transition duration-400 ease-out"
      enter-from-class="translate-y-10 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transform transition duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="toast" class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 py-3.5 px-6 rounded-2xl bg-[#0F172A] text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 min-w-[340px] max-w-md">
        <Icon :icon="toast.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'" 
              :class="toast.type === 'success' ? 'text-green-400' : 'text-red-400'"
              class="w-6 h-6 shrink-0" />
        <p class="text-[0.95rem] font-bold tracking-tight whitespace-nowrap">{{ toast.message }}</p>
        <div class="h-4 w-px bg-white/10 mx-1"></div>
        <button @click="toast = null" class="text-white/40 hover:text-white transition-colors">
          <Icon icon="mdi:close" class="w-4 h-4" />
        </button>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// Tabs
const activeTab = ref<'profile' | 'security'>('profile')

// User info
const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
})

// Forms state
const profileForm = reactive({
  firstName: '',
  lastName: '',
  email: ''
})
const profileError = ref('')

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordError = ref('')

// Toast state
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  setTimeout(() => { toast.value = null }, 3500)
}

// Prefill form
onMounted(() => {
  if (auth.user) {
    profileForm.firstName = auth.user.firstName
    profileForm.lastName = auth.user.lastName
    profileForm.email = auth.user.email
  }
})

// Handlers
const handleUpdateProfile = async () => {
  profileError.value = ''
  try {
    await auth.updateProfile({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      email: profileForm.email
    })
    showToast('success', 'Perfil actualizado correctamente')
  } catch (err: any) {
    profileError.value = err?.response?.data?.error || 'No se pudo actualizar el perfil'
  }
}

const handleChangePassword = async () => {
  passwordError.value = ''
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Las contraseñas no coinciden'
    return
  }
  try {
    await auth.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    })
    showToast('success', 'Contraseña modificada de forma segura')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err: any) {
    passwordError.value = err?.response?.data?.error || 'No se pudo cambiar la contraseña'
  }
}
</script>
