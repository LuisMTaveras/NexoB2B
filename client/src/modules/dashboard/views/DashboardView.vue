<template>
  <div>
    <div class="page-header mb-8">
      <div>
        <h2 class="text-2xl font-bold text-brand-900 tracking-tight">Panel de Control (Sistema)</h2>
        <p class="text-sm text-[var(--color-brand-600)] mt-1">Monitoreo de integraciones y actividad proactiva.</p>
      </div>
      <span class="text-sm font-medium text-[var(--color-brand-500)] px-3 py-1.5 bg-white/60 rounded-lg shadow-sm border border-white/80 backdrop-blur-md">{{ today }}</span>
    </div>

    <!-- Main KPIs (System Oriented) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="stat-card group relative overflow-hidden">
        <div class="stat-icon z-10" :style="{ backgroundColor: stat.bg }">
          <Icon :icon="stat.icon" class="w-6 h-6" :style="{ color: stat.color }" />
        </div>
        <div class="z-10">
          <div class="stat-value text-2xl font-black">
            <span v-if="loading" class="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
            <span v-else>{{ stat.value }}</span>
          </div>
          <div class="stat-label text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- Monitoring Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      <!-- Sync Health & Volume -->
      <div class="bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm rounded-2xl p-6 lg:col-span-2">
        <div class="flex items-center justify-between mb-6">
           <h3 class="font-semibold text-slate-900 text-lg flex items-center gap-2">
             <Icon icon="mdi:sync-circle" class="text-indigo-500 w-6 h-6" />
             Salud de Sincronización (ERP)
           </h3>
           <div v-if="!loading" class="flex items-center gap-4">
              <div class="text-right">
                <p class="text-[9px] font-black uppercase text-slate-400">Tasa de Éxito</p>
                <p class="text-lg font-black" :class="syncHealth.successRate > 90 ? 'text-emerald-600' : 'text-amber-600'">{{ syncHealth.successRate }}%</p>
              </div>
              <div class="w-px h-8 bg-slate-100"></div>
              <div class="text-right">
                <p class="text-[9px] font-black uppercase text-slate-400">Total Sincronizado</p>
                <p class="text-lg font-black text-slate-800">{{ syncHealth.totalRecords }}</p>
              </div>
           </div>
        </div>

        <div class="h-48">
          <div v-if="loading" class="w-full h-full flex items-center justify-center">
             <Icon icon="mdi:loading" class="animate-spin text-gray-200 w-8 h-8" />
          </div>
          <Bar v-else :data="chartDataSyncVolume" :options="chartOptionsBar" />
        </div>
      </div>

      <!-- Live Monitoring Widget (Online Users) -->
      <div class="bg-white/70 backdrop-blur-xl shadow-sm border border-slate-200 rounded-[2.5rem] p-8 relative overflow-hidden group flex flex-col">
        <div class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>
        
        <div class="flex items-center justify-between mb-8 relative z-10">
           <h3 class="font-bold text-slate-900 text-md flex items-center gap-3">
             <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]"></div>
             Actividad en Vivo
           </h3>
           <span class="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full tracking-[0.2em] uppercase border border-indigo-100">Real-Time</span>
        </div>

        <div class="space-y-4 relative z-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          <div v-if="onlineUsers.length === 0" class="py-12 flex flex-col items-center text-center opacity-40 text-slate-500">
             <Icon icon="mdi:account-off-outline" class="w-10 h-10 mb-3" />
             <p class="text-[10px] font-bold uppercase tracking-widest">Sin usuarios activos</p>
          </div>
          
          <div v-for="user in onlineUsers" :key="user.id" class="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-all shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black uppercase shadow-sm border border-indigo-100">
              {{ user.firstName[0] }}{{ user.lastName[0] }}
            </div>
            <div class="flex-1 min-w-0">
               <p class="text-xs font-bold text-slate-800 truncate">{{ user.firstName }} {{ user.lastName }}</p>
               <p class="text-[10px] text-slate-500 truncate mt-0.5">{{ user.clientName }}</p>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-slate-100 relative z-10 flex items-center justify-between">
           <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Sincronizado en tiempo real</p>
           <button @click="fetchOnlineUsers" class="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200">
              <Icon icon="mdi:refresh" :class="{ 'animate-spin': onlineLoading }" class="text-slate-500" />
           </button>
        </div>
      </div>
    </div>

    <!-- Health & Churn Alerts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- Churn Alerts -->
      <div class="card p-8 bg-white shadow-sm border-slate-100 flex flex-col rounded-[2.5rem]">
         <div class="flex items-center justify-between mb-8">
            <h3 class="font-bold text-slate-900 text-sm flex items-center gap-3 uppercase tracking-widest">
              <Icon icon="mdi:alert-decagram" class="text-rose-500 w-6 h-6" />
              Alertas de Churn (Inactividad)
            </h3>
            <span v-if="insights?.atRiskCustomers?.length" class="bg-rose-100 text-rose-600 text-[10px] font-black px-2.5 py-1 rounded-lg">{{ insights.atRiskCustomers.length }} Clientes</span>
         </div>
         
         <div class="space-y-4">
           <div v-if="!insights?.atRiskCustomers?.length" class="py-12 flex flex-col items-center opacity-30">
              <Icon icon="mdi:shield-check-outline" class="w-12 h-12 text-emerald-400 mb-3" />
              <p class="text-xs font-bold uppercase tracking-widest">Cartera de clientes saludable</p>
           </div>
           <div v-for="customer in insights?.atRiskCustomers" :key="customer.id" class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
              <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center text-xs font-black uppercase">
                 {{ customer.name[0] }}
              </div>
              <div class="flex-1 min-w-0">
                 <p class="text-xs font-bold text-slate-800 truncate">{{ customer.name }}</p>
                 <p class="text-[10px] text-rose-600 font-bold uppercase mt-1">{{ customer.daysInactive }} días sin pedidos</p>
              </div>
           </div>
         </div>
      </div>

      <!-- ERP Integration Health -->
      <div class="card p-8 bg-white border border-slate-100 shadow-sm rounded-[2.5rem]">
        <h3 class="font-bold text-slate-900 text-sm flex items-center gap-3 uppercase tracking-widest mb-8">
          <Icon icon="mdi:heart-pulse" class="text-emerald-500 w-6 h-6" />
          Monitoreo de Canales ERP
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div v-for="erp in insights?.erpHealth" :key="erp.id" class="p-5 rounded-3xl bg-slate-50 border border-slate-100">
              <div class="flex items-center justify-between mb-4">
                 <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full" :class="erp.isDown ? 'bg-rose-500' : 'bg-emerald-500'"></div>
                    <span class="text-[11px] font-black uppercase tracking-widest text-slate-800">{{ erp.name }}</span>
                 </div>
                 <span class="text-[8px] font-black bg-white px-2 py-0.5 rounded border border-slate-200 uppercase text-slate-400">{{ erp.type }}</span>
              </div>
              
              <div class="flex items-end justify-between">
                 <div>
                    <p class="text-[9px] text-slate-400 font-bold uppercase mb-1">Última Sincro</p>
                    <p class="text-xs font-bold">{{ erp.lastSync ? new Date(erp.lastSync).toLocaleTimeString() : '---' }}</p>
                 </div>
                 <div class="text-right">
                    <p class="text-[10px] font-black uppercase" :class="erp.isDown ? 'text-rose-500' : 'text-emerald-500'">
                       {{ erp.isDown ? 'Interrumpido' : 'Conectado' }}
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import api from '@/services/api'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const today = new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
const loading = ref(true)
const onlineLoading = ref(false)
interface OnlineUser {
  id: string
  firstName: string
  lastName: string
  email: string
  clientName: string
  type: 'internal' | 'customer'
}

interface AtRiskCustomer {
  id: string
  name: string
  daysInactive: number
}

interface ERPHealth {
  id: string
  name: string
  type: string
  isDown: boolean
  lastSync: string | null
}

interface InsightsType {
  atRiskCustomers: AtRiskCustomer[]
  erpHealth: ERPHealth[]
}

const onlineUsers = ref<OnlineUser[]>([])
const syncHealth = ref({ successRate: 0, totalRecords: 0 })
const insights = ref<InsightsType | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const stats = ref([
  { label: 'Clientes Activos', value: '0', icon: 'mdi:account-multiple', color: '#2563EB', bg: '#EFF6FF' },
  { label: 'Canales ERP',      value: '0', icon: 'mdi:transit-connection', color: '#059669', bg: '#DCFCE7' },
  { label: 'Facturas Pend.',   value: '0', icon: 'mdi:file-document', color: '#D97706', bg: '#FEF3C7' },
  { label: 'Pedidos Abiertos', value: '0', icon: 'mdi:cart-check', color: '#7C3AED', bg: '#EDE9FE' },
])

const chartDataSyncVolume = ref({
  labels: [] as string[],
  datasets: [{
    label: 'Registros',
    data: [] as number[],
    backgroundColor: '#6366F1',
    borderRadius: 8,
  }]
})

const chartOptionsBar = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' }, border: { display: false } },
    x: { grid: { display: false }, border: { display: false } }
  }
}

const fetchDashboardData = async () => {
  try {
    const { data } = await api.get('/dashboard')
    const res = data.data
    
    stats.value[0]!.value = res.overview.activeCustomers.toString()
    stats.value[1]!.value = res.overview.activeIntegrations.toString()
    stats.value[2]!.value = res.overview.pendingInvoices.toString()
    stats.value[3]!.value = res.overview.openOrders.toString()
    
    syncHealth.value = res.charts.syncHealth
    insights.value = res.insights

    chartDataSyncVolume.value = {
      labels: res.charts.syncHealth.dailyVolumes.map((v: { date: string, count: number }) => new Date(v.date).toLocaleDateString('es-DO', { weekday: 'short' })),
      datasets: [{ ...chartDataSyncVolume.value.datasets[0], data: res.charts.syncHealth.dailyVolumes.map((v: { count: number }) => v.count) } as { label: string, data: number[], backgroundColor: string, borderRadius: number }]
    }
  } catch (err) {
    console.error('Failed to fetch stats', err)
  } finally {
    loading.value = false
  }
}

const fetchOnlineUsers = async () => {
  onlineLoading.value = true
  try {
    const { data } = await api.get('/dashboard/online')
    onlineUsers.value = data.data
  } catch (err) {
    console.error('Monitoring failed', err)
  } finally {
    onlineLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
  fetchOnlineUsers()
  refreshTimer = setInterval(fetchOnlineUsers, 5000)
})

onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer) })
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
</style>
