<template>
  <div>
      <div class="page-header mb-8">
        <div>
          <h2 class="text-2xl font-bold text-brand-900 tracking-tight">Dashboard General</h2>
          <p class="text-sm text-[var(--color-brand-600)] mt-1">Bienvenido, {{ auth.fullName }}. Resumen de tu plataforma.</p>
        </div>
      <span class="text-sm font-medium text-[var(--color-brand-500)] px-3 py-1.5 bg-white/60 rounded-lg shadow-sm border border-white/80 backdrop-blur-md">{{ today }}</span>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="stat-card group relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="stat-icon z-10" :style="{ backgroundColor: stat.bg }">
          <Icon :icon="stat.icon" class="w-6 h-6" :style="{ color: stat.color }" />
        </div>
        <div class="z-10">
          <div class="stat-value">
            <span v-if="loading" class="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
            <span v-else>{{ stat.value }}</span>
          </div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Line Chart Revenue -->
      <div class="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.1)] rounded-2xl p-6 lg:col-span-2 flex flex-col">
        <h3 class="font-semibold text-[var(--color-brand-900)] mb-6 flex items-center gap-2 text-lg">
          <Icon icon="mdi:chart-bell-curve-cumulative" class="text-[var(--color-accent-500)] w-6 h-6" />
          Volumen de Pedidos (Últimos 6 Meses)
        </h3>
        <div class="flex-1 w-full h-64 min-h-[16rem]">
          <div v-if="loading" class="w-full h-full flex items-center justify-center text-[var(--color-brand-400)]">
            <Icon icon="mdi:loading" class="w-8 h-8 animate-spin" />
          </div>
          <Line v-else-if="hasRevenueData" :data="chartDataRevenue" :options="chartOptionsLines" />
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-[var(--color-brand-400)] bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
             <Icon icon="mdi:chart-line" class="w-10 h-10 mb-2 opacity-30" />
             <p class="text-sm">Sin datos suficientes para graficar</p>
          </div>
        </div>
      </div>

      <!-- Doughnut Chart Orders -->
      <div class="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.1)] rounded-2xl p-6 flex flex-col">
        <h3 class="font-semibold text-[var(--color-brand-900)] mb-6 flex items-center gap-2 text-lg">
          <Icon icon="mdi:chart-donut-variant" class="text-[var(--color-accent-500)] w-6 h-6" />
          Distribución de Pedidos
        </h3>
        <div class="flex-1 w-full h-64 min-h-[16rem] flex items-center justify-center">
          <div v-if="loading" class="flex items-center justify-center text-[var(--color-brand-400)]">
            <Icon icon="mdi:loading" class="w-8 h-8 animate-spin" />
          </div>
          <Doughnut v-else :data="chartDataDistribution" :options="chartOptionsDoughnut" class="max-w-[90%] max-h-[90%]" />
        </div>
      </div>
    </div>    <!-- Status + Monitoring Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Sync Health & Volume -->
      <div class="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.1)] rounded-2xl p-6 lg:col-span-2">
        <div class="flex items-center justify-between mb-6">
           <h3 class="font-semibold text-[var(--color-brand-900)] text-lg flex items-center gap-2">
             <Icon icon="mdi:sync-circle" class="text-indigo-500 w-6 h-6" />
             Salud de Sincronización (7d)
           </h3>
           <div v-if="!loading" class="flex items-center gap-4">
              <div class="text-right">
                <p class="text-[10px] font-black uppercase text-[var(--color-brand-400)]">Tasa de Éxito</p>
                <p class="text-lg font-black" :class="syncHealth.successRate > 90 ? 'text-emerald-600' : 'text-amber-600'">{{ syncHealth.successRate }}%</p>
              </div>
              <div class="w-px h-8 bg-gray-100"></div>
              <div class="text-right">
                <p class="text-[10px] font-black uppercase text-[var(--color-brand-400)]">Total Sincronizado</p>
                <p class="text-lg font-black text-[var(--color-brand-800)]">{{ syncHealth.totalRecords }}</p>
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

      <!-- Live Monitoring Widget -->
      <!-- Live Monitoring Widget -->
      <div class="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.1)] rounded-2xl p-6 relative overflow-hidden group">
        <!-- Accent decorative element -->
        <div class="absolute -top-12 -right-12 w-32 h-32 bg-[var(--color-accent-100)] opacity-50 rounded-full group-hover:scale-110 transition-all duration-700"></div>
        
        <div class="flex items-center justify-between mb-6 relative z-10">
           <h3 class="font-semibold text-[var(--color-brand-900)] text-lg flex items-center gap-2">
             <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             Actividad en Vivo
           </h3>
           <span class="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full tracking-widest uppercase border border-indigo-100">Live</span>
        </div>

        <div class="space-y-4 relative z-10 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
          <div v-if="onlineUsers.length === 0" class="py-12 flex flex-col items-center text-center">
             <div class="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 text-gray-300">
               <Icon icon="mdi:account-off-outline" class="w-6 h-6" />
             </div>
             <p class="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Sin usuarios activos</p>
             <p class="text-[9px] text-gray-400 mt-1">Los usuarios en línea aparecerán aquí.</p>
          </div>
          
          <div v-for="user in onlineUsers" :key="user.id" class="flex items-center gap-3 p-3 rounded-xl bg-white border border-[var(--color-brand-50)] shadow-sm hover:border-[var(--color-accent-200)] transition-all group/user">
            <div class="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black uppercase ring-2 ring-white shadow-sm">
              {{ user.firstName[0] }}{{ user.lastName[0] }}
            </div>
            <div class="flex-1 min-w-0">
               <div class="flex items-center gap-2">
                 <p class="text-xs font-bold text-[var(--color-brand-900)] truncate">{{ user.firstName }} {{ user.lastName }}</p>
                 <span v-if="user.type === 'internal'" class="text-[8px] bg-[var(--color-accent-100)] text-[var(--color-accent-700)] px-1.5 py-0.5 rounded font-black uppercase">Staff</span>
               </div>
               <p class="text-[10px] text-[var(--color-brand-500)] truncate mt-0.5">{{ user.clientName }}</p>
            </div>
            <div class="text-right">
               <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-[var(--color-brand-100)] relative z-10 flex items-center justify-between">
           <p class="text-[10px] font-bold text-[var(--color-brand-400)] uppercase tracking-widest">Auto-refresh 30s</p>
           <button @click="fetchOnlineUsers" class="text-[var(--color-brand-400)] hover:text-[var(--color-accent-600)] transition-colors p-1.5 hover:bg-[var(--color-accent-50)] rounded-lg">
              <Icon icon="mdi:refresh" :class="{ 'animate-spin': onlineLoading }" />
           </button>
        </div>
      </div>
    </div>

    <!-- Quick actions secondary section -->
    <div class="mt-8">
        <h3 class="font-bold text-brand-900 mb-4 text-sm uppercase tracking-widest">Accesos Directos</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
           <RouterLink
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            class="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-center"
          >
            <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
              <Icon :icon="action.icon" class="w-6 h-6 text-slate-400 group-hover:text-white" />
            </div>
            <span class="text-xs font-bold text-slate-600 group-hover:text-slate-900">{{ action.label }}</span>
          </RouterLink>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const auth = useAuthStore()
const today = new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
const loading = ref(true)
const onlineLoading = ref(false)
const onlineUsers = ref<any[]>([])
let refreshTimer: any = null

const stats = ref([
  { label: 'Clientes de Alto Nivel', value: '0', icon: 'mdi:account-tie', color: '#2563EB', bg: '#EFF6FF' },
  { label: 'Canales ERP',            value: '0', icon: 'mdi:transit-connection-variant', color: '#059669', bg: '#DCFCE7' },
  { label: 'Facturación Abierta',    value: '0', icon: 'mdi:file-document-multiple-outline', color: '#D97706', bg: '#FEF3C7' },
  { label: 'Pedidos por Atender',    value: '0', icon: 'mdi:cart-arrow-down', color: '#7C3AED', bg: '#EDE9FE' },
])

const activeIntegrationsCount = ref(0)
const hasRevenueData = ref(false)
const syncHealth = ref({ successRate: 0, totalRecords: 0 })

const chartDataRevenue = ref({
  labels: [] as string[],
  datasets: [{
    label: 'Volumen ($)',
    data: [] as number[],
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 3,
    pointBackgroundColor: '#fff',
    pointBorderColor: '#2563EB',
    pointBorderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 6,
    fill: true,
    tension: 0.4
  }]
})

const chartDataSyncVolume = ref({
  labels: [] as string[],
  datasets: [{
    label: 'Registros Procesados',
    data: [] as number[],
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    borderRadius: 6,
    borderWidth: 0,
  }]
})

const chartDataDistribution = ref({
  labels: [] as string[],
  datasets: [{
    data: [] as number[],
    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    borderWidth: 0,
    hoverOffset: 4
  }]
})

const chartOptionsLines = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 12,
      titleFont: { size: 13, family: 'Inter' },
      bodyFont: { size: 14, family: 'Inter', weight: 'bold' as const }
    }
  },
  scales: {
    y: { 
      beginAtZero: true, 
      grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
      border: { display: false },
      ticks: { color: '#64748b', font: { family: 'Inter' } }
    },
    x: { 
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#64748b', font: { family: 'Inter' } }
    }
  }
}

const chartOptionsBar = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' }, border: { display: false } },
    x: { grid: { display: false }, border: { display: false } }
  }
}

const chartOptionsDoughnut = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '75%',
  plugins: {
    legend: { 
      position: 'right' as const,
      labels: { usePointStyle: true, padding: 20, color: '#475569', font: { family: 'Inter' } }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 12,
      bodyFont: { size: 14, family: 'Inter', weight: 'bold' as const }
    }
  }
}

const quickActions = [
  { to: '/admin/integrations', icon: 'mdi:connection',            label: 'Gestionar Conexiones' },
  { to: '/admin/customers',    icon: 'mdi:account-multiple-outline', label: 'Gestión de Clientes' },
  { to: '/admin/settings/email', icon: 'mdi:email-cog-outline',      label: 'Configuración de Email' },
  { to: '/admin/company',      icon: 'mdi:domain',                 label: 'Configuración Corporativa' },
]

const fetchDashboardData = async () => {
  try {
    const { data } = await api.get('/dashboard')
    const result = data.data
    
    // Update Stats
    stats.value[0]!.value = result.overview.activeCustomers.toString()
    stats.value[1]!.value = result.overview.activeIntegrations.toString()
    stats.value[2]!.value = result.overview.pendingInvoices.toString()
    stats.value[3]!.value = result.overview.openOrders.toString()
    
    activeIntegrationsCount.value = result.overview.activeIntegrations
    syncHealth.value = result.charts.syncHealth

    // Update charts
    const revenueSum = result.charts.revenue.data.reduce((a: number, b: number) => a + b, 0)
    hasRevenueData.value = revenueSum > 0 || result.charts.revenue.data.length > 0;

    chartDataRevenue.value = {
      labels: result.charts.revenue.labels,
      datasets: [{
        ...chartDataRevenue.value.datasets[0],
        data: result.charts.revenue.data,
      } as any]
    }

    chartDataSyncVolume.value = {
      labels: result.charts.syncHealth.dailyVolumes.map((v: any) => {
        const d = new Date(v.date)
        return d.toLocaleDateString('es-DO', { weekday: 'short' })
      }),
      datasets: [{
        ...chartDataSyncVolume.value.datasets[0],
        data: result.charts.syncHealth.dailyVolumes.map((v: any) => v.count),
      } as any]
    }

    if (result.charts.orderDistribution.labels.length > 0) {
      chartDataDistribution.value = {
        labels: result.charts.orderDistribution.labels,
        datasets: [{
          ...chartDataDistribution.value.datasets[0],
          data: result.charts.orderDistribution.counts as number[],
        } as any]
      }
    } else {
      chartDataDistribution.value = {
        labels: ['Sin datos'],
        datasets: [{ 
          data: [1], 
          backgroundColor: ['#E2E8F0'], 
          borderWidth: 0, 
          hoverOffset: 0 
        }] as any
      }
    }

  } catch (error) {
    console.error('Failed to fetch dashboard data', error)
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
  refreshTimer = setInterval(fetchOnlineUsers, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.1);
}
</style>
