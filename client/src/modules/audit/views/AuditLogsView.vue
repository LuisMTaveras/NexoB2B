<template>
  <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[1600px] mx-auto">
    <!-- Compact Header -->
    <div class="flex items-center justify-between gap-4 bg-white/50 p-4 rounded-3xl border border-white/50 shadow-sm backdrop-blur-md">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-xl bg-slate-900 text-white shadow-lg border border-slate-700">
          <Icon icon="mdi:shield-history" class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-lg font-black text-slate-900 tracking-tight leading-none">Bitácora de Auditoría</h2>
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Sincronización y Seguridad en tiempo real</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <div class="flex p-1 bg-slate-100 rounded-xl">
           <button v-for="opt in rangeOptions" :key="opt.val" 
                   @click="setQuickRange(opt.val)"
                   class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all"
                   :class="activeRange === opt.val ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'">
             {{ opt.label }}
           </button>
        </div>
        <button @click="fetchLogs" class="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
          <Icon icon="mdi:refresh" :class="{ 'animate-spin': loading }" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Mini Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
       <div v-for="stat in stats" :key="stat.label" class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-colors">
          <div class="space-y-1">
             <p class="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{{ stat.label }}</p>
             <h4 class="text-xl font-black text-slate-900 tracking-tighter">{{ stat.value }}</h4>
          </div>
          <div :class="stat.bg" class="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110">
             <Icon :icon="stat.icon" class="w-5 h-5" />
          </div>
       </div>
    </div>

    <!-- Filters Bar -->
    <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 flex-1 min-w-[200px]">
        <Icon icon="mdi:calendar-range" class="text-slate-400 w-4 h-4" />
        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Desde</div>
        <input type="date" v-model="filters.startDate" class="bg-transparent text-xs font-bold outline-none border-none p-0 focus:text-indigo-600">
        <div class="w-px h-4 bg-slate-200 mx-2"></div>
        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Hasta</div>
        <input type="date" v-model="filters.endDate" class="bg-transparent text-xs font-bold outline-none border-none p-0 focus:text-indigo-600">
      </div>

      <div class="flex items-center gap-2 flex-1 min-w-[150px]">
        <select v-model="filters.action" class="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[11px] font-bold outline-none appearance-none cursor-pointer">
          <option value="">Acción: Todas</option>
          <option value="USER_LOGIN">Inicios de Sesión</option>
          <option value="TICKET_STATUS_UPDATED">Estado Tickets</option>
          <option value="INTEGRATION_SYNC_TRIGGERED">Sincronización ERP</option>
          <option value="CUSTOMER_UPDATED">Ajustes Clientes</option>
        </select>
      </div>

      <label class="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
         <input type="checkbox" v-model="filters.grouped" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
         <span class="text-[10px] font-black uppercase tracking-widest text-slate-600">Agrupar por Bitácora</span>
      </label>
    </div>

    <!-- Compact Table -->
    <div class="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50">
              <th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Evento / Recurso</th>
              <th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Responsable</th>
              <th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Actividad</th>
              <th class="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="loading" v-for="i in 8" :key="'skel'+i" class="animate-pulse border-b border-slate-50 relative">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                   <div class="w-10 h-10 rounded-xl bg-slate-100 shrink-0 shadow-inner"></div>
                   <div class="space-y-2 flex-1">
                      <div class="h-3 bg-slate-200 rounded w-24"></div>
                      <div class="h-2 bg-slate-100 rounded w-16"></div>
                   </div>
                </div>
              </td>
              <td class="px-6 py-4">
                 <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-slate-100 shadow-inner"></div>
                    <div class="w-20 h-2 bg-slate-200 rounded"></div>
                 </div>
              </td>
              <td class="px-6 py-4">
                 <div class="space-y-2">
                    <div class="h-3 bg-slate-200 rounded w-48"></div>
                    <div class="h-2 bg-slate-100 rounded w-32"></div>
                 </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end"><div class="w-8 h-8 rounded-lg bg-slate-100"></div></div>
              </td>
            </tr>
            <tr v-else-if="!logs.length" class="text-center py-20">
               <td colspan="4" class="py-20 text-slate-300 font-medium italic text-xs">No se encontraron registros para este periodo.</td>
            </tr>
            <tr v-for="log in logs" :key="log.id || log.key" 
                @click="showDetails(log)"
                class="hover:bg-slate-50/50 transition-all cursor-pointer group">
              <td class="px-6 py-3">
                <div class="flex items-center gap-3">
                   <div :class="getResourceIconClass(log.resource)" class="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-white">
                      <Icon :icon="getResourceIcon(log.resource)" />
                   </div>
                   <div class="flex flex-col">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-black text-slate-800 tracking-tight">{{ log.isGroup ? log.resource : formatAction(log.action) }}</span>
                        <span v-if="log.eventCount > 1" class="px-1.5 py-0.5 rounded-md bg-indigo-600 text-[8px] font-black text-white uppercase tracking-tighter">{{ log.eventCount }} EVENTOS</span>
                      </div>
                      <span class="text-[9px] font-bold text-slate-400 leading-none mt-1">{{ formatDate(log.createdAt) }} - {{ formatTime(log.createdAt) }}</span>
                   </div>
                </div>
              </td>
              <td class="px-6 py-3">
                 <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-[9px] font-black text-white uppercase ring-2 ring-white shadow-sm overflow-hidden">
                       <img v-if="log.user?.avatar" :src="log.user.avatar" class="w-full h-full object-cover">
                       <span v-else>{{ (log.user?.firstName || (log.userEmail || 'S'))[0] }}</span>
                    </div>
                    <span class="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{{ log.user ? `${log.user.firstName}` : 'Sistema' }}</span>
                 </div>
              </td>
              <td class="px-6 py-3">
                 <div class="flex flex-col">
                    <p class="text-[11px] text-slate-600 font-medium line-clamp-1 leading-none">{{ generateSummary(log) }}</p>
                    <div v-if="log.resourceId" class="flex items-center gap-1 mt-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       <span>REF:</span>
                       <span class="text-indigo-600 font-mono tracking-tighter">{{ log.resourceId.slice(-6).toUpperCase() }}</span>
                    </div>
                 </div>
              </td>
              <td class="px-6 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                   <div v-if="log.isGroup" class="p-1 px-2 rounded-lg bg-slate-50 text-[9px] font-black text-slate-400 uppercase border border-slate-100">Bitácora</div>
                   <button class="p-2 text-slate-300 group-hover:text-indigo-600 transition-colors">
                     <Icon :icon="log.isGroup ? 'mdi:chevron-right' : 'mdi:magnify-plus'" class="w-5 h-5" />
                   </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Timeline Explorer Modal (Redesigned for Bitácoras) -->
    <div v-if="selectedLog" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
       <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" @click="selectedLog = null"></div>
       <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative animate-in zoom-in-95 border border-white">
          <div class="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
             <div class="flex items-center gap-4">
                <div :class="getResourceIconClass(selectedLog.resource)" class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-white shadow-lg">
                   <Icon :icon="getResourceIcon(selectedLog.resource)" />
                </div>
                <div>
                   <h3 class="text-xl font-black text-slate-900 tracking-tight">{{ selectedLog.isGroup ? 'Bitácora Histórica' : 'Detalle de Evento' }}</h3>
                   <p class="text-[10px] font-black uppercase text-indigo-500 tracking-widest">
                      {{ selectedLog.resource }} Identificador #{{ selectedLog.resourceId?.slice(-8).toUpperCase() || 'N/A' }}
                   </p>
                </div>
             </div>
             <button @click="selectedLog = null" class="w-10 h-10 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center border border-slate-100 shadow-inner">
                <Icon icon="mdi:close" />
             </button>
          </div>

          <div class="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
             <!-- If it's a group, show Timeline -->
             <div v-if="selectedLog.isGroup" class="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                <div v-for="(entry, idx) in selectedLog.history" :key="entry.id" class="relative">
                   <div class="absolute -left-[27px] top-1 px-1 py-1 rounded-full bg-indigo-600 border-4 border-white shadow-sm z-10"></div>
                   <div class="space-y-2">
                      <div class="flex items-center justify-between">
                         <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ formatDate(entry.createdAt) }} - {{ formatTime(entry.createdAt) }}</span>
                         <span class="px-2 py-0.5 rounded-md bg-slate-50 text-[9px] font-black tracking-widest border border-slate-100">{{ entry.userEmail || 'Sistema' }}</span>
                      </div>
                      <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-help" @click.stop="toggleExp(entry.id)">
                         <p class="text-xs font-black text-slate-800 leading-tight">
                            {{ formatAction(entry.action) }}: 
                            <span class="font-bold text-slate-600 ml-1">{{ generateSummary(entry) }}</span>
                         </p>
                         
                         <!-- Compact Diff if expanded -->
                         <div v-if="expandedHistory.includes(entry.id)" class="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div v-for="(val, key) in getChangedKeys(entry.details)" :key="key" class="text-[10px] space-y-1">
                               <p class="font-black uppercase text-indigo-500 tracking-[0.1em]">{{ key }}</p>
                               <div class="grid grid-cols-2 gap-2">
                                  <div class="p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 line-through opacity-60">{{ formatVal(val.old, String(key)) }}</div>
                                  <div class="p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100 font-bold">{{ formatVal(val.new, String(key)) }}</div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <!-- Single Event View (Old logic but compact) -->
             <div v-else class="space-y-6">
                <div class="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                   <div>
                      <p class="text-[9px] font-black uppercase text-slate-400">Dirección IP</p>
                      <p class="text-xs font-bold text-slate-800">{{ selectedLog.ip || 'Interna' }}</p>
                   </div>
                   <div>
                      <p class="text-[9px] font-black uppercase text-slate-400">Responsable</p>
                      <p class="text-xs font-bold text-slate-800 truncate">{{ selectedLog.userEmail || 'Background System' }}</p>
                   </div>
                </div>
                <div class="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-sm font-bold text-slate-800 tracking-tight">
                   {{ generateSummary(selectedLog) }}
                </div>
                <div v-if="getChangedKeys(selectedLog.details)" class="space-y-3">
                   <h5 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Novedades en el evento</h5>
                   <div v-for="(val, key) in getChangedKeys(selectedLog.details)" :key="key" class="p-4 bg-white border border-slate-100 rounded-2xl">
                      <p class="text-[10px] font-black uppercase text-indigo-500 mb-2">{{ key }}</p>
                      <div class="flex items-center gap-4">
                         <div class="flex-1 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg line-through opacity-50">{{ formatVal(val.old, String(key)) }}</div>
                         <Icon icon="mdi:arrow-right" class="text-slate-300" />
                         <div class="flex-1 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg font-bold">{{ formatVal(val.new, String(key)) }}</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
          
          <div class="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
             ID LOG: {{ selectedLog.id || 'BITACORA_RES' }} • SESIÓN ACTIVA 
          </div>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import api from '@/services/api'

const logs = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const totalPages = ref(1)
const selectedLog = ref<any>(null)
const expandedHistory = ref<string[]>([])
const activeRange = ref('7d')

const stats = ref([
 { label: 'Inicios de Sesión', value: '0', icon: 'mdi:key-outline', bg: 'bg-rose-50 text-rose-600 border-rose-100' },
 { label: 'Tickets Soporte', value: '0', icon: 'mdi:face-agent', bg: 'bg-amber-50 text-amber-600 border-amber-100' },
 { label: 'Sincs ERP', value: '0', icon: 'mdi:api', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
 { label: 'Auditados', value: '0', icon: 'mdi:database-check', bg: 'bg-indigo-50 text-indigo-600 border-indigo-100' }
])

const rangeOptions = [
  { label: 'Hoy', val: 'today' },
  { label: 'Ayer', val: 'yesterday' },
  { label: 'Últimos 7d', val: '7d' },
  { label: 'Últimos 30d', val: '30d' },
  { label: 'Completo', val: 'all' }
]

const filters = ref({
  startDate: '',
  endDate: '',
  action: '',
  grouped: true
})

function setQuickRange(r: string) {
   activeRange.value = r
   const end = new Date()
   let start = new Date()
   
   if (r === 'today') start.setHours(0,0,0,0)
   else if (r === 'yesterday') {
      start.setDate(start.getDate() - 1)
      start.setHours(0,0,0,0)
      end.setDate(end.getDate() - 1)
      end.setHours(23,59,59,999)
   }
   else if (r === '7d') start.setDate(start.getDate() - 7)
   else if (r === '30d') start.setDate(start.getDate() - 30)
   else if (r === 'all') { filters.value.startDate = ''; filters.value.endDate = ''; return }

   filters.value.startDate = start.toISOString().split('T')[0] || ''
   filters.value.endDate = end.toISOString().split('T')[0] || ''
}

async function fetchLogs() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      action: filters.value.action || undefined,
      startDate: filters.value.startDate || undefined,
      endDate: filters.value.endDate || undefined,
      grouped: filters.value.grouped
    }
    const res = await api.get('/admin/audit-logs', { params })
    logs.value = res.data.data
    totalPages.value = res.data.meta.totalPages
    
    // Update mini-stats counts based on the first few logs or summary
    stats.value[0]!.value = logs.value.filter(l => l.action === 'USER_LOGIN').length.toString()
    stats.value[1]!.value = logs.value.filter(l => l.resource === 'Ticket').length.toString()
    stats.value[2]!.value = logs.value.filter(l => l.action.includes('SYNC')).length.toString()
    stats.value[3]!.value = res.data.meta.total.toString()
  } catch (err) {
    console.error('Audit Error:', err)
  } finally {
    loading.value = false
  }
}

watch(filters, () => { page.value = 1; fetchLogs() }, { deep: true })

onMounted(() => { setQuickRange('7d'); fetchLogs() })

function formatDate(d: string) { return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) }
function formatTime(d: string) { return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }
function formatAction(a: string) { return a.replace(/_/g, ' ') }

function translateStatus(status: string) {
   if (!status) return 'Desconocido'
   const map: any = {
      'OPEN': 'ABIERTO', 'PENDING': 'PENDIENTE', 'IN_PROGRESS': 'EN PROCESO', 'RESOLVED': 'RESUELTO',
      'CLOSED': 'CERRADO', 'ACTIVE': 'ACTIVO', 'INACTIVE': 'INACTIVO', 'INVITED': 'INVITADO'
   }
   return map[status.toUpperCase()] || status
}

function generateSummary(log: any) {
  if (!log || !log.action) return 'Cargando...'
  const d = log.details || {}
  switch(log.action) {
     case 'USER_LOGIN': return 'Inicio de sesión sistema'
     case 'TICKET_STATUS_UPDATED': return `Cambio: ${translateStatus(d.oldStatus)} → ${translateStatus(d.newStatus)}`
     case 'TICKET_ASSIGNED': return `Asignado a: ${d.assignedToName || 'Agente'}`
     case 'CUSTOMER_UPDATED': return `Actualización de parámetros: ${d.changedFields?.join(', ') || 'General'}`
     case 'CUSTOMER_USER_INVITED': return `Invitación enviada: ${d.email}`
     case 'INTEGRATION_SYNC_TRIGGERED': return `Sincronización manual: ${d.resource}`
     default: return log.action.includes('UPDATED') ? 'Actualización de registro' : 'Actividad operativa'
  }
}

function getResourceIcon(r: string) {
  switch(r) {
    case 'Auth': return 'mdi:security'
    case 'Ticket': return 'mdi:face-agent'
    case 'Customer': return 'mdi:office-building-cog'
    case 'Order': return 'mdi:cart'
    case 'Integration': return 'mdi:api'
    default: return 'mdi:circle-small'
  }
}

function getResourceIconClass(r: string) {
  switch(r) {
    case 'Auth': return 'bg-rose-50 text-rose-500 border-rose-100'
    case 'Ticket': return 'bg-amber-50 text-amber-500 border-amber-100'
    case 'Customer': return 'bg-indigo-50 text-indigo-500 border-indigo-100'
    case 'Order': return 'bg-emerald-50 text-emerald-500 border-emerald-100'
    case 'Integration': return 'bg-slate-900 text-white border-slate-700'
    default: return 'bg-slate-50 text-slate-400'
  }
}

function getChangedKeys(details: any) {
  const { oldData, newData } = details || {}
  if (!oldData || !newData) return null
  const diff: any = {}
  Object.keys(newData).forEach(k => {
    if (['passwordHash', 'updatedAt', 'id', 'companyId'].includes(k)) return
    if (JSON.stringify(oldData[k]) !== JSON.stringify(newData[k])) diff[k] = { old: oldData[k], new: newData[k] }
  })
  return Object.keys(diff).length ? diff : null
}

function formatVal(v: any, k: string) {
   if (v === null || v === undefined) return '(vacío)'
   if (k.toLowerCase().includes('status')) return translateStatus(String(v))
   return String(v)
}

function toggleExp(id: string) {
   if (expandedHistory.value.includes(id)) expandedHistory.value = expandedHistory.value.filter(i => i !== id)
   else expandedHistory.value.push(id)
}

function showDetails(log: any) {
  selectedLog.value = log
  expandedHistory.value = []
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
