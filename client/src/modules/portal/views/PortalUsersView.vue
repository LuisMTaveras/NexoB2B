<template>
  <div class="space-y-8">
    <div class="page-header">
      <div>
        <h2 class="page-title text-2xl font-black text-slate-800 tracking-tight">Mi Equipo</h2>
        <p class="page-subtitle text-sm text-slate-500 mt-1">Gestiona los accesos de tus colaboradores al portal.</p>
      </div>
      <div class="flex items-center gap-4">
        <!-- Usage Indicator -->
        <div class="hidden md:flex flex-col items-end">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cupos de Usuario</p>
          <div class="flex items-center gap-2 mt-1">
             <div class="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-indigo-500 transition-all duration-500"
                  :style="{ width: `${(meta.count / meta.maxUsers) * 100}%` }"
                ></div>
             </div>
             <span class="text-xs font-bold text-slate-600">{{ meta.count }} / {{ meta.maxUsers }}</span>
          </div>
        </div>
        
        <button 
          @click="showInviteModal = true" 
          class="btn btn-primary"
          :disabled="meta.count >= meta.maxUsers"
        >
          <Icon icon="mdi:account-plus-outline" />
          Invitar Colega
        </button>
      </div>
    </div>

    <!-- Team List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <template v-if="loading">
        <div v-for="i in 3" :key="i" class="card p-6 animate-pulse space-y-4">
           <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-slate-200"></div>
              <div class="flex-1 space-y-2">
                 <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                 <div class="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
           </div>
           <div class="h-8 bg-slate-100 rounded-lg w-full"></div>
        </div>
      </template>

      <div 
        v-else 
        v-for="user in team" 
        :key="user.id"
        class="card p-6 group hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 relative overflow-hidden"
      >
        <div class="flex items-start justify-between mb-4 relative z-10">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
              {{ user.firstName[0] }}{{ user.lastName[0] }}
            </div>
            <div>
              <h4 class="font-bold text-slate-800 group-hover:text-indigo-900">{{ user.firstName }} {{ user.lastName }}</h4>
              <p class="text-xs text-slate-400 truncate max-w-[150px]">{{ user.email }}</p>
            </div>
          </div>
          <span 
            class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter"
            :class="getStatusClass(user.status)"
          >
            {{ user.status === 'INVITED' ? 'Invitado' : 'Activo' }}
          </span>
        </div>

        <div class="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">
          <div class="flex items-center gap-1.5">
            <Icon icon="mdi:shield-account-outline" class="w-3.5 h-3.5" />
            {{ user.role }}
          </div>
          <div v-if="user.lastLoginAt">
            Acceso: {{ new Date(user.lastLoginAt).toLocaleDateString() }}
          </div>
          <div v-else>Pendiente</div>
        </div>

        <!-- Hover background effect -->
        <div class="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && team.length === 0" class="card p-20 flex flex-col items-center text-center bg-slate-50/50 border-dashed border-2">
       <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-6">
          <Icon icon="mdi:account-group-outline" class="w-8 h-8" />
       </div>
       <h3 class="text-lg font-bold text-slate-800">Todavía no has invitado a nadie</h3>
       <p class="text-sm text-slate-400 mt-2 max-w-sm">Invita a tus compañeros de compras o tesorería para que colaboren en el portal.</p>
       <button @click="showInviteModal = true" class="btn btn-primary mt-8">Comenzar Invitaciones</button>
    </div>

    <!-- Invite Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 class="text-xl font-black text-slate-800 tracking-tight">Invitar Colega</h3>
            <p class="text-xs text-slate-400 mt-1">Envía una invitación de acceso a tu equipo.</p>
          </div>
          <button @click="showInviteModal = false" class="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center transition-colors text-slate-400">✕</button>
        </div>
        
        <div class="p-8">
          <form @submit.prevent="sendInvite" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Nombre</label>
                <div class="relative">
                  <Icon icon="mdi:account-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input v-model="form.firstName" class="input pl-10" placeholder="Ej: Juan" required />
                </div>
              </div>
              <div>
                <label class="label">Apellido</label>
                <input v-model="form.lastName" class="input" placeholder="Ej: Pérez" required />
              </div>
            </div>

            <div>
              <label class="label">Correo Electrónico</label>
              <div class="relative">
                <Icon icon="mdi:email-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input v-model="form.email" type="email" class="input pl-10" placeholder="juan@tuempresa.com" required />
              </div>
            </div>

            <div>
              <label class="label">Rol en el Portal</label>
              <div class="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  v-for="role in ['BUYER', 'ADMIN']" 
                  :key="role"
                  class="p-4 rounded-2xl border-2 text-left transition-all"
                  :class="form.role === role ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 hover:border-slate-300'"
                  @click="form.role = role; form.requiresApproval = (role === 'BUYER')"
                >
                  <Icon :icon="role === 'ADMIN' ? 'mdi:shield-account' : 'mdi:cart-outline'" class="w-5 h-5 mb-2" />
                  <p class="font-bold text-sm">{{ role === 'ADMIN' ? 'Administrador' : 'Comprador' }}</p>
                  <p class="text-[10px] opacity-60">{{ role === 'ADMIN' ? 'Control total equipo' : 'Solo ver y pedir' }}</p>
                </button>
              </div>
            </div>

            <div class="space-y-4">
               <div class="bg-indigo-50 p-4 rounded-2xl flex items-center justify-between border border-indigo-100 animate-in fade-in zoom-in-95 duration-300" v-if="form.role === 'ADMIN'">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-500">
                      <Icon icon="mdi:shield-check-outline" class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-xs font-black text-indigo-700 tracking-tight">Autorización Administrativa</p>
                      <p class="text-[10px] text-indigo-400 font-medium">Sus pedidos requerirán aprobación de otro Admin.</p>
                    </div>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="form.requiresApproval" class="sr-only peer">
                    <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
               </div>

               <div v-else class="bg-amber-50 p-4 rounded-2xl flex items-center gap-3 border border-amber-100 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div class="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-500 shadow-sm">
                    <Icon icon="mdi:lock-alert-outline" class="w-5 h-5" />
                  </div>
                  <div>
                    <h5 class="text-xs font-black text-amber-700 uppercase tracking-widest">{{ form.role === 'ADMIN' ? 'Administrador B2B' : 'Comprador Autorizado' }}</h5>
                    <p class="text-[10px] text-amber-600 font-medium">Los Compradores siempre necesitan autorización de un administrador.</p>
                  </div>
               </div>

               <!-- Spending Limit Input -->
               <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Límite de Gasto por Pedido (DOP)</label>
                  <div class="relative">
                    <Icon icon="mdi:currency-usd" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input v-model="form.orderLimit" type="number" class="input pl-10 bg-white" placeholder="Ej: 5000 (Opcional)" />
                  </div>
                  <p class="text-[9px] text-slate-400 mt-2">Los pedidos que superen este monto quedarán en espera de aprobación automáticamente.</p>
               </div>
            </div>

            <div class="flex items-center justify-between pt-6 border-t border-slate-50">
               <p class="text-[10px] font-bold text-slate-400 max-w-[200px]">
                 Se enviará un correo con un enlace de activación seguro.
               </p>
               <div class="flex gap-3">
                 <button type="button" class="btn btn-secondary" @click="showInviteModal = false">Cancelar</button>
                 <button type="submit" class="btn btn-primary min-w-[140px]" :disabled="inviting">
                    <Icon v-if="inviting" icon="mdi:loading" class="animate-spin" />
                    {{ inviting ? 'Enviando...' : 'Enviar Invitación' }}
                 </button>
               </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const ui = useUiStore()
const auth = useAuthStore()

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  lastLoginAt?: string
  createdAt: string
}

const loading = ref(true)
const inviting = ref(false)
const showInviteModal = ref(false)
const team = ref<TeamMember[]>([])
const meta = reactive({ count: 0, maxUsers: 5 })

const form = reactive({
  email: '',
  firstName: '',
  lastName: '',
  role: 'BUYER',
  requiresApproval: true,
  orderLimit: ''
})

async function loadTeam() {
  loading.value = true
  try {
    const res = await api.get('/customers/me/team')
    team.value = res.data.data
    Object.assign(meta, res.data.meta)
  } catch {
    console.error('Failed to load team')
  } finally {
    loading.value = false
  }
}

async function sendInvite() {
  inviting.value = true
  try {
    const targetCustomerId = auth.user?.customerId
    
    if (!targetCustomerId) throw new Error('Customer ID missing')
    
    await api.post(`/customers/${targetCustomerId}/invite`, form)
    
    showInviteModal.value = false
    ui.alert('Invitación Enviada', `Hemos enviado un correo a ${form.firstName}.`, 'success')
    
    // Reset and reload
    Object.assign(form, { email: '', firstName: '', lastName: '', role: 'BUYER', requiresApproval: true, orderLimit: '' })
    await loadTeam()
  } catch (err: unknown) {
    const apiError = err as { response?: { data?: { error?: string } } };
    const msg = apiError.response?.data?.error || 'Error al enviar invitación'
    ui.alert('Error', msg, 'error')
  } finally {
    inviting.value = false
  }
}

function getStatusClass(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-100 text-emerald-700'
  if (status === 'INVITED') return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

onMounted(loadTeam)
</script>
