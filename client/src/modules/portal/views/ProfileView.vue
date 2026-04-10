<template>
  <div class="animate-in fade-in duration-300 pb-20 mt-4 max-w-5xl mx-auto">
    
    <!-- Profile Header -->
    <div class="px-8 mt-12 mb-16 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
       <div class="relative group">
          <div class="w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-5xl font-black shadow-[0_20px_50px_-15px_rgba(79,70,229,0.5)] border-4 border-slate-50 ring-4 ring-indigo-50 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
            {{ initials }}
          </div>
          <div class="absolute bottom-0 right-0 w-12 h-12 rounded-2xl bg-emerald-500 border-4 border-slate-50 flex items-center justify-center text-white shadow-xl animate-bounce-subtle" title="Perfil Verificado">
             <Icon icon="mdi:check-decagram" class="w-6 h-6" />
          </div>
       </div>

       <div class="flex-1 space-y-3 pb-2">
         <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm">
            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span class="text-[9px] font-black uppercase tracking-widest text-emerald-700">Cuenta Activa</span>
         </div>
         <h2 class="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{{ auth.fullName }}</h2>
         <p class="text-lg font-bold text-slate-500 flex items-center justify-center md:justify-start gap-2">
           <Icon icon="mdi:email-outline" class="w-5 h-5 opacity-70" />
           {{ auth.user?.email }}
         </p>
       </div>
    </div>
    
    <!-- Main Content Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        <!-- Company Info Card -->
        <div class="group relative bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] p-10 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-20px_rgba(79,70,229,0.15)] transition-all duration-500 overflow-hidden">
           <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-transparent opacity-40 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-110"></div>
           
           <div class="w-16 h-16 bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 shadow-inner flex items-center justify-center text-indigo-600 mb-8 relative z-10 group-hover:-translate-y-1 transition-transform">
              <Icon icon="mdi:office-building-outline" class="w-8 h-8" />
           </div>

           <h3 class="font-black text-slate-800 text-2xl tracking-tight mb-8 relative z-10">Información Corporativa</h3>
           
           <div class="space-y-8 relative z-10">
              <div class="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50">
                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Empresa Registrada</p>
                 <p class="text-xl font-black text-slate-900 tracking-tight">{{ auth.user?.customerName || 'Empresa No Identificada' }}</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/30">
                  <p class="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest mb-1">Código ID</p>
                  <p class="text-base font-black text-indigo-900 uppercase tracking-widest">NX-{{ auth.user?.id.slice(-6).toUpperCase() }}</p>
                </div>
                <div class="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/30">
                  <p class="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest mb-1">Rol B2B</p>
                  <p class="text-sm font-black text-emerald-700 tracking-tight leading-tight mt-1">{{ auth.user?.role === 'ADMIN' ? 'Administrador' : 'Comprador' }}</p>
                </div>
              </div>

              <div class="flex items-center gap-4 py-4 px-2 border-t border-slate-100">
                <Icon icon="mdi:storefront-outline" class="w-6 h-6 text-slate-400" />
                <div>
                   <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Proveedor Activo</p>
                   <p class="text-sm font-bold text-slate-600 tracking-tight">{{ auth.company?.name }}</p>
                </div>
              </div>
           </div>
        </div>

        <!-- Security Card -->
        <div class="group relative bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] p-10 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-20px_rgba(79,70,229,0.15)] transition-all duration-500 overflow-hidden">
           <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-slate-100 to-transparent opacity-40 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-700 group-hover:scale-110"></div>
           
           <div class="w-16 h-16 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-200 shadow-inner flex items-center justify-center text-slate-800 mb-8 relative z-10 group-hover:-translate-y-1 transition-transform">
              <Icon icon="mdi:shield-lock-outline" class="w-8 h-8" />
           </div>

           <h3 class="font-black text-slate-800 text-2xl tracking-tight mb-8 relative z-10">Seguridad de la Cuenta</h3>
           
           <div class="space-y-5 relative z-10">
              <button @click="showPasswordModal = true" class="w-full flex items-center justify-between p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-[0_10px_30px_-10px_rgba(79,70,229,0.2)] transition-all group/btn cursor-pointer">
                 <div class="flex items-center gap-5 text-left">
                    <div class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover/btn:bg-indigo-600 group-hover/btn:text-white group-hover/btn:shadow-md transition-all">
                       <Icon icon="mdi:key-variant" class="w-6 h-6" />
                    </div>
                    <div>
                       <p class="text-base font-black text-slate-800 leading-tight group-hover/btn:text-indigo-900 transition-colors">Contraseña Segura</p>
                       <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Haz clic para actualizar</p>
                    </div>
                 </div>
                 <Icon icon="mdi:arrow-right" class="w-5 h-5 text-slate-300 group-hover/btn:text-indigo-600 group-hover/btn:translate-x-1 transition-all" />
              </button>
              
              <div class="w-full flex items-center justify-between p-6 rounded-2xl bg-slate-50/50 border border-slate-100 opacity-70">
                 <div class="flex items-center gap-5 text-left">
                    <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                       <Icon icon="mdi:cellphone-lock" class="w-6 h-6" />
                    </div>
                    <div>
                       <div class="flex items-center gap-2">
                         <p class="text-base font-black text-slate-800 leading-tight">Autenticación 2FA</p>
                         <span class="px-2 py-0.5 bg-slate-200 text-slate-500 text-[8px] font-black uppercase rounded-md tracking-widest">Próximamente</span>
                       </div>
                       <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Nivel de Seguridad Estándar</p>
                    </div>
                 </div>
                 <Icon icon="mdi:lock-outline" class="w-5 h-5 text-slate-300" />
              </div>

               <div class="mt-8 pt-8 border-t border-slate-100">
                  <p class="text-xs text-slate-500 font-medium leading-relaxed">
                    Asegúrate de no compartir tus credenciales de NexoB2B con personal no autorizado. Las compras realizadas bajo tu usuario comprometen la responsabilidad de tu empresa.
                  </p>
               </div>
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
