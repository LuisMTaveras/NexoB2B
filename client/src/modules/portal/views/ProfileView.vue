<template>
  <div class="animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
    <!-- Header Section -->
    <div class="mb-12 text-center">
       <div class="relative inline-block group">
          <div class="w-32 h-32 rounded-[2.5rem] bg-linear-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center text-4xl font-black shadow-[0_20px_50px_-15px_rgba(79,70,229,0.4)] border-4 border-white ring-1 ring-indigo-100 transition-transform group-hover:scale-105 duration-500">
            {{ initials }}
          </div>
          <div class="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-emerald-500 border-4 border-white flex items-center justify-center text-white shadow-xl animate-bounce-subtle" title="Perfil Verificado">
             <Icon icon="mdi:check-decagram" class="w-6 h-6" />
          </div>
       </div>
       <h2 class="text-4xl font-black text-slate-900 tracking-tight mt-6">{{ auth.fullName }}</h2>
       <div class="flex items-center justify-center gap-3 mt-3">
          <span class="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
             {{ auth.user?.role === 'ADMIN' ? 'Administrador B2B' : 'Comprador Autorizado' }}
          </span>
          <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          <p class="text-base text-slate-500 font-bold opacity-80">{{ auth.user?.email }}</p>
       </div>
    </div>
    
    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Left Column: Primary Info (8 cols) -->
      <div class="lg:col-span-8 space-y-8">
        <!-- Company Info Card -->
        <div class="card p-10 bg-white border-slate-100 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.08)] relative overflow-hidden group">
           <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-50 opacity-20 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700"></div>
           
           <h3 class="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] mb-8 flex items-center gap-3">
              <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Icon icon="mdi:office-building-outline" class="w-5 h-5" />
              </div>
              Información Corporativa
           </h3>
           
           <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-12 relative z-10">
              <div class="space-y-2">
                 <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Empresa Registrada</p>
                 <p class="text-xl font-black text-slate-800 tracking-tight">{{ auth.user?.customerName || 'Empresa No Identificada' }}</p>
              </div>
              <div class="space-y-2">
                 <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Estado de Cuenta</p>
                 <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p class="text-xl font-black text-emerald-600 tracking-tight">Activo / Verificado</p>
                 </div>
              </div>
              <div class="space-y-2 pt-4 border-t border-slate-50">
                 <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Proveedor Principal</p>
                 <p class="text-lg font-bold text-slate-600 italic tracking-tight">{{ auth.company?.name }}</p>
              </div>
              <div class="space-y-2 pt-4 border-t border-slate-50">
                 <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Código Interno</p>
                 <p class="text-lg font-bold text-slate-600 tracking-widest uppercase">NX-{{ auth.user?.id.slice(-6).toUpperCase() }}</p>
              </div>
           </div>
        </div>

        <!-- Security Card -->
        <div class="card p-10 bg-white border-slate-100 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.08)]">
           <h3 class="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] mb-8 flex items-center gap-3">
              <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Icon icon="mdi:shield-lock-outline" class="w-5 h-5" />
              </div>
              Seguridad y Privacidad
           </h3>
           
           <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button @click="showPasswordModal = true" class="flex items-center justify-between p-6 rounded-2xl bg-slate-50 hover:bg-white border-2 border-transparent hover:border-indigo-100 hover:shadow-lg transition-all group cursor-pointer">
                 <div class="flex items-center gap-4 text-left">
                    <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                       <Icon icon="mdi:key-variant" class="w-6 h-6" />
                    </div>
                    <div>
                       <p class="text-sm font-black text-slate-800 leading-tight">Contraseña</p>
                       <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Actualizar clave</p>
                    </div>
                 </div>
                 <Icon icon="mdi:chevron-right" class="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </button>
              
              <button class="flex items-center justify-between p-6 rounded-2xl bg-slate-50 hover:bg-white border-2 border-transparent hover:border-indigo-100 hover:shadow-lg transition-all group opacity-60 cursor-not-allowed">
                 <div class="flex items-center gap-4 text-left">
                    <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                       <Icon icon="mdi:cellphone-lock" class="w-6 h-6" />
                    </div>
                    <div>
                       <p class="text-sm font-black text-slate-800 leading-tight">Autenticación 2FA</p>
                       <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Nivel: Estándar</p>
                    </div>
                 </div>
                 <Icon icon="mdi:lock-outline" class="w-5 h-5 text-slate-300" />
              </button>
           </div>
        </div>
      </div>

      <!-- Right Column: Contextual Sidebars (4 cols) -->
      <div class="lg:col-span-4 space-y-8">
        <!-- Admin Management Block -->
        <div v-if="auth.user?.role === 'ADMIN'" class="card p-8 bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group border-none">
           <div class="absolute -right-8 -bottom-8 w-40 h-40 bg-white opacity-[0.03] rounded-full group-hover:scale-110 transition-transform duration-1000"></div>
           
           <div class="relative z-10">
              <span class="inline-flex px-3 py-1 bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-lg mb-4 border border-white/10">Panel Administrativo</span>
              <h3 class="text-2xl font-black mb-4 leading-tight tracking-tight">Gestión de Equipo Corporativo</h3>
              <p class="text-xs text-white/60 mb-8 leading-relaxed font-medium">Controle los accesos, límites de gasto y jerarquías de compra para su organización desde un solo lugar.</p>
              
              <RouterLink to="/portal/team" class="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-900/40 transition-all border border-indigo-400/30">
                 <Icon icon="mdi:account-multiple-plus" class="w-5 h-5" />
                 Administrar Delegados
              </RouterLink>
           </div>
        </div>

        <!-- Session Control -->
        <div class="card p-10 bg-linear-to-b from-rose-50 to-white border-rose-100/50 shadow-xl shadow-rose-100/20 text-center relative">
           <div class="w-16 h-16 rounded-3xl bg-white border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm mx-auto mb-6">
              <Icon icon="mdi:logout-variant" class="w-8 h-8" />
           </div>
           <h3 class="font-black text-rose-900 uppercase text-[10px] tracking-[0.2em] mb-3">Control de Sesión</h3>
           <p class="text-[11px] text-rose-600/70 font-bold mb-8 leading-relaxed">¿Ha terminado su actividad comercial?<br>Cierre su sesión de forma segura.</p>
           
           <button @mousedown.stop="auth.logout()" class="w-full h-14 bg-white border-2 border-rose-200 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm group cursor-pointer">
              <span class="pointer-events-none flex items-center gap-3">
                Cerrar Sesión Ahora
                <Icon icon="mdi:arrow-right" class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
           </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Password Change Modal -->
  <div v-if="showPasswordModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
      <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 class="text-xl font-black text-slate-800 tracking-tight">Cambiar Contraseña</h3>
          <p class="text-xs text-slate-400 mt-1">Introduce tu clave actual y la nueva.</p>
        </div>
        <button @click="closePasswordModal" class="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center transition-colors text-slate-400">✕</button>
      </div>
      <div class="p-8">
        <form @submit.prevent="changePassword" class="space-y-5">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Contraseña Actual</label>
            <div class="relative">
              <Icon icon="mdi:lock-outline" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input v-model="pwForm.currentPassword" type="password" class="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all" placeholder="Tu clave actual" required />
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Nueva Contraseña</label>
            <div class="relative">
              <Icon icon="mdi:key-variant" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input v-model="pwForm.newPassword" type="password" class="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all" placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número" required />
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Confirmar Nueva Contraseña</label>
            <div class="relative">
              <Icon icon="mdi:key-chain" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input v-model="pwForm.confirmPassword" type="password" class="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all" placeholder="Repite la nueva clave" required />
            </div>
          </div>

          <!-- Error/Success -->
          <div v-if="pwError" class="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold">
            <Icon icon="mdi:alert-circle-outline" class="w-4 h-4 shrink-0" />
            {{ pwError }}
          </div>
          <div v-if="pwSuccess" class="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-bold">
            <Icon icon="mdi:check-circle-outline" class="w-4 h-4 shrink-0" />
            {{ pwSuccess }}
          </div>

          <div class="flex items-center gap-3 pt-4 border-t border-slate-50">
            <button type="button" @click="closePasswordModal" class="flex-1 px-6 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
            <button type="submit" :disabled="pwSaving" class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Icon v-if="pwSaving" icon="mdi:loading" class="animate-spin w-4 h-4" />
              {{ pwSaving ? 'Guardando...' : 'Actualizar Clave' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth = useAuthStore()

const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
})

// Password change
const showPasswordModal = ref(false)
const pwSaving = ref(false)
const pwError = ref('')
const pwSuccess = ref('')
const pwForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

function closePasswordModal() {
  showPasswordModal.value = false
  pwForm.currentPassword = ''
  pwForm.newPassword = ''
  pwForm.confirmPassword = ''
  pwError.value = ''
  pwSuccess.value = ''
}

async function changePassword() {
  pwError.value = ''
  pwSuccess.value = ''

  if (pwForm.newPassword !== pwForm.confirmPassword) {
    pwError.value = 'Las contraseñas nuevas no coinciden.'
    return
  }

  if (pwForm.newPassword.length < 8) {
    pwError.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }

  if (!/[A-Z]/.test(pwForm.newPassword)) {
    pwError.value = 'Debe contener al menos una letra mayúscula.'
    return
  }

  if (!/[0-9]/.test(pwForm.newPassword)) {
    pwError.value = 'Debe contener al menos un número.'
    return
  }

  pwSaving.value = true
  try {
    await api.put('/auth/password', {
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword
    })
    pwSuccess.value = '¡Contraseña actualizada correctamente!'
    pwForm.currentPassword = ''
    pwForm.newPassword = ''
    pwForm.confirmPassword = ''
    setTimeout(() => closePasswordModal(), 2000)
  } catch (err: unknown) {
    const apiError = err as { response?: { data?: { error?: string } } }
    pwError.value = apiError.response?.data?.error || 'Error al cambiar la contraseña. Verifica tu clave actual.'
  } finally {
    pwSaving.value = false
  }
}
</script>
