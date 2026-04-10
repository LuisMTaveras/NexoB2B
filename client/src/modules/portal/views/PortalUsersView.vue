<template>
  <div class="max-w-7xl mx-auto px-4 py-8 space-y-10">
    <!-- Premium Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 transition-all animate-in fade-in duration-200">
      <div class="space-y-2">
        <h2 class="text-4xl font-black text-slate-900 tracking-tight leading-none">Mi <span class="text-indigo-600">Equipo</span></h2>
        <p class="text-slate-500 font-medium flex items-center gap-2">
          <Icon icon="mdi:shield-account-group" class="text-indigo-400 w-5 h-5" />
          Administra los accesos y roles de tu organización en tiempo real.
        </p>
      </div>

      <div class="flex items-center gap-6 bg-white/50 backdrop-blur-xl p-3 px-6 rounded-3xl border border-white shadow-sm ring-1 ring-slate-200/50">
        <!-- Usage Indicator -->
        <div class="flex flex-col items-start min-w-[140px]">
          <div class="flex items-center justify-between w-full mb-2">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cupos Utilizados</p>
            <span class="text-xs font-black text-indigo-600">{{ meta.count }}<span class="text-slate-300 font-bold mx-0.5">/</span>{{ meta.maxUsers }}</span>
          </div>
          <div class="w-full h-2 bg-slate-100/80 rounded-full overflow-hidden border border-slate-200/50">
            <div 
              class="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out"
              :style="{ width: `${(meta.count / meta.maxUsers) * 100}%` }"
            ></div>
          </div>
        </div>
        
        <div class="w-px h-8 bg-slate-200"></div>

        <button 
          @click="showInviteModal = true" 
          class="flex items-center gap-2 bg-indigo-600 hover:bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(79,70,229,0.4)] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
          :disabled="meta.count >= meta.maxUsers"
        >
          <Icon icon="mdi:account-plus" class="text-lg" />
          Invitar Colega
        </button>
      </div>
    </div>

    <!-- Team List Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
      <!-- Loading Skeleton -->
      <template v-if="loading">
        <div v-for="i in 3" :key="'skel-' + i" class="bg-white/40 backdrop-blur-sm border border-white p-8 rounded-[2.5rem] shadow-sm animate-pulse space-y-6">
           <div class="flex items-center gap-5">
              <div class="w-16 h-16 rounded-3xl bg-slate-100"></div>
              <div class="flex-1 space-y-3">
                 <div class="h-4 bg-slate-100 rounded-lg w-3/4"></div>
                 <div class="h-3 bg-slate-50 rounded-lg w-1/2"></div>
              </div>
           </div>
           <div class="h-px bg-slate-100"></div>
           <div class="flex justify-between items-center">
              <div class="h-4 bg-slate-50 rounded-lg w-20"></div>
              <div class="h-4 bg-slate-50 rounded-lg w-24"></div>
           </div>
        </div>
      </template>

      <!-- Member Cards -->
      <div 
        v-else 
        v-for="user in team" 
        :key="user.id"
        class="group relative bg-white border border-slate-100/80 p-8 rounded-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_-20px_rgba(79,70,229,0.1)] hover:border-indigo-100 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden"
      >
        <!-- Background Accent -->
        <div class="absolute -top-12 -right-12 w-40 h-40 bg-indigo-50/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <div class="relative z-10 space-y-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-5">
              <div class="relative">
                <div class="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-slate-100 flex items-center justify-center font-black text-xl text-indigo-600 shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500">
                  {{ user.firstName[0] }}{{ user.lastName[0] }}
                </div>
                <!-- Online Badge -->
                <div v-if="isOnline(user.lastActiveAt)" 
                    class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white p-1 shadow-md border border-slate-50"
                    title="En línea">
                  <div class="w-full h-full rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                </div>
              </div>
              <div>
                <h4 class="font-black text-slate-800 text-lg tracking-tight group-hover:text-indigo-950 transition-colors">{{ user.firstName }} {{ user.lastName }}</h4>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 px-2 py-0.5 rounded-lg bg-slate-50/50">{{ user.role }}</span>
                  <div class="w-1 h-1 rounded-full bg-slate-200"></div>
                  <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border" :class="getStatusClass(user.status)">
                    {{ user.status === 'INVITED' ? 'Invitado' : 'Activo' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="h-px bg-gradient-to-r from-slate-100 via-slate-100 to-transparent"></div>

          <div class="space-y-3">
             <div class="flex items-center gap-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                <Icon icon="mdi:email-outline" class="w-4 h-4" />
                <span class="text-xs font-medium truncate">{{ user.email }}</span>
             </div>
             
             <div class="flex items-center justify-between pt-2">
                <div class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all"
                     :class="isOnline(user.lastActiveAt) ? 'text-emerald-500' : (user.lastLoginAt ? 'text-indigo-500' : 'text-slate-300')">
                   <Icon :icon="isOnline(user.lastActiveAt) ? 'mdi:broadcast' : (user.lastLoginAt ? 'mdi:clock-check-outline' : 'mdi:clock-alert-outline')" class="w-4 h-4" :class="isOnline(user.lastActiveAt) ? 'animate-pulse' : ''" />
                   <span v-if="isOnline(user.lastActiveAt)">En línea</span>
                   <span v-else-if="user.lastLoginAt">{{ formatRelativeTime(user.lastLoginAt) }}</span>
                   <span v-else>Esperando activación</span>
                </div>
                
                <button v-if="user.status === 'ACTIVE'" class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-95" title="Gestionar Permisos">
                   <Icon icon="mdi:cog-outline" class="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && team.length === 0" 
         class="relative overflow-hidden bg-white/50 backdrop-blur-xl border-dashed border-2 border-slate-200 p-24 rounded-[4rem] flex flex-col items-center text-center transition-all animate-in zoom-in-95 duration-700">
       <div class="absolute -top-24 -left-24 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl animate-pulse"></div>
       
       <div class="w-24 h-24 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-8 shadow-inner ring-1 ring-indigo-100 relative z-10">
          <Icon icon="mdi:account-group-outline" class="w-12 h-12" />
       </div>
       <h3 class="text-2xl font-black text-slate-900 tracking-tight z-10">Tu círculo está vacío</h3>
       <p class="text-slate-500 font-medium mt-3 max-w-sm leading-relaxed z-10">
         Crea una red colaborativa invitando a tus departamentos de compras, logística o finanzas para agilizar tus pedidos.
       </p>
       <button @click="showInviteModal = true" class="mt-10 px-10 py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-indigo-500/20 transition-all group z-10">
         Comenzar Invitaciones
         <Icon icon="mdi:arrow-right" class="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
       </button>
    </div>

    <!-- Invite Modal -->
    <Teleport to="body">
      <div v-if="showInviteModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" @click="showInviteModal = false"></div>
        
        <div class="relative bg-white rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] w-full max-w-xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-white">
          <!-- Modal Header -->
          <div class="p-10 pb-0 flex justify-between items-start">
            <div class="space-y-2">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
                <Icon icon="mdi:plus-circle-outline" />
                Seguridad B2B Pro
              </div>
              <h3 class="text-3xl font-black text-slate-900 tracking-tight leading-none">Invitar a <span class="text-indigo-600">Colega</span></h3>
              <p class="text-slate-500 font-medium">Define el alcance del acceso personalizado.</p>
            </div>
            <button @click="showInviteModal = false" class="w-12 h-12 rounded-2xl hover:bg-slate-50 flex items-center justify-center transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 group">
              <Icon icon="mdi:close" class="text-2xl group-hover:rotate-90 transition-transform" />
            </button>
          </div>
          
          <div class="p-10 pt-8">
            <form @submit.prevent="sendInvite" class="space-y-8">
              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                  <div class="relative group">
                    <Icon icon="mdi:account-outline" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input v-model="form.firstName" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm focus:shadow-indigo-500/10 placeholder:text-slate-300" placeholder="Ej: Luis" required />
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                  <input v-model="form.lastName" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm focus:shadow-indigo-500/10 placeholder:text-slate-300" placeholder="Ej: Taveras" required />
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Profesional</label>
                <div class="relative group">
                  <Icon icon="mdi:email-outline" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input v-model="form.email" type="email" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm focus:shadow-indigo-500/10 placeholder:text-slate-300" placeholder="usuario@empresa.com" required />
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between ml-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol de Operación</label>
                  <span class="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">Auditado por Sistema</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <button 
                    type="button" 
                    v-for="role in ['BUYER', 'ADMIN']" 
                    :key="role"
                    class="relative group p-6 rounded-3xl border-2 text-left transition-all overflow-hidden"
                    :class="form.role === role ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-100' : 'border-slate-100 bg-slate-50/50 hover:border-slate-300'"
                    @click="form.role = role; form.requiresApproval = (role === 'BUYER')"
                  >
                    <Icon :icon="role === 'ADMIN' ? 'mdi:shield-crown' : 'mdi:cart-variant'" class="text-2xl mb-3" :class="form.role === role ? 'text-indigo-600' : 'text-slate-400'" />
                    <p class="font-black text-slate-900 text-sm tracking-tight">{{ role === 'ADMIN' ? 'Administrador' : 'Comprador' }}</p>
                    <p class="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed">{{ role === 'ADMIN' ? 'Control total corporativo' : 'Consulta y creación pedidos' }}</p>
                    <div v-if="form.role === role" class="absolute top-2 right-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center animate-in zoom-in-0 duration-300">
                      <Icon icon="mdi:check-bold" class="text-xs" />
                    </div>
                  </button>
                </div>
              </div>

              <!-- Action Footer -->
              <div class="pt-6 border-t border-slate-100 flex items-center gap-4">
                <button type="button" @click="showInviteModal = false" class="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                  Cancelar
                </button>
                <button type="submit" class="flex-[2] py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50" :disabled="inviting">
                  <div class="flex items-center justify-center gap-3">
                    <Icon v-if="inviting" icon="mdi:loading" class="animate-spin text-lg" />
                    <Icon v-else icon="mdi:send-variant-outline" class="text-lg" />
                    {{ inviting ? 'Procesando...' : 'Enviar Invitación' }}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

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
  lastActiveAt?: string
  createdAt: string
}

const loading = ref(true)
const inviting = ref(false)
const showInviteModal = ref(false)
const team = ref<TeamMember[]>([])
const meta = reactive({ count: 0, maxUsers: 5 })
let refreshTimer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  email: '',
  firstName: '',
  lastName: '',
  role: 'BUYER',
  requiresApproval: true,
  orderLimit: ''
})

async function loadTeam() {
  // Only show full loader on first visit
  if (team.value.length === 0) loading.value = true
  
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
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-600 border-emerald-100'
  if (status === 'INVITED') return 'bg-amber-50 text-amber-600 border-amber-100'
  return 'bg-slate-50 text-slate-400 border-slate-100'
}

function formatRelativeTime(dateString: string) {
  if (!dateString) return ''
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
  } catch {
    return new Date(dateString).toLocaleDateString()
  }
}

function isOnline(lastActiveAt?: string) {
  if (!lastActiveAt) return false
  const lastActive = new Date(lastActiveAt).getTime()
  const now = new Date().getTime()
  // Consider online if active in the last 2 minutes
  return (now - lastActive) < 120000
}

onMounted(() => {
  loadTeam()
  // Setup auto-refresh every 30s to keep "online" dots fresh
  refreshTimer = setInterval(loadTeam, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.leading-none { line-height: 1 !important; }
.tracking-tight { letter-spacing: -0.04em; }

@keyframes pulse-emerald {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.animate-pulse {
  animation: pulse-emerald 2s infinite;
}
</style>
