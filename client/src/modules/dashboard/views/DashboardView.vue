<template>
  <div>
    <div class="page-header mb-8">
      <div>
        <h2 class="text-2xl font-bold text-[var(--color-brand-900)] tracking-tight">Dashboard General</h2>
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
    </div>

    <!-- Status + Quick actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Integration status -->
      <div class="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.1)] rounded-2xl p-6 lg:col-span-2">
        <h3 class="font-semibold text-[var(--color-brand-900)] mb-4 text-lg">Estado Operativo</h3>

        <!-- Loaded and has active integration -->
        <div v-if="!loading && activeIntegrationsCount > 0" class="flex items-center gap-5 p-6 bg-gradient-to-r from-emerald-50 to-teal-50/20 border border-emerald-100 rounded-xl relative overflow-hidden">
          <div class="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
          <div class="w-14 h-14 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center shrink-0">
             <Icon icon="mdi:transit-connection-variant" class="w-7 h-7" />
          </div>
          <div>
            <h4 class="text-emerald-900 font-bold text-lg">Tus canales ERP están activos</h4>
            <p class="text-emerald-700/80 text-sm mt-0.5">La sincronización funciona en segundo plano.</p>
          </div>
          <RouterLink to="/admin/integrations" class="btn btn-secondary ml-auto shadow-sm">Ver Canales</RouterLink>
        </div>

        <!-- Loaded but no active integrations -->
        <div v-else-if="!loading" class="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-xl">
          <Icon icon="mdi:api-off" class="w-10 h-10 mb-3 text-[var(--color-brand-300)]" />
          <p class="text-[var(--color-brand-700)] font-medium">Sin ecosistemas ERP configurados</p>
          <p class="text-xs mt-1 text-[var(--color-brand-500)] max-w-sm">Para liberar el poder total de NexoB2B necesitas conectar el sistema administrador de inventario.</p>
          <RouterLink to="/admin/integrations" class="btn btn-primary btn-sm mt-5 shadow-md">
            <Icon icon="mdi:connection" class="w-4 h-4" />
            Vincular ERP
          </RouterLink>
        </div>
        
        <!-- Skeleton loader -->
        <div v-else class="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
      </div>

      <!-- Quick actions -->
      <div class="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.1)] rounded-2xl p-6">
        <h3 class="font-semibold text-[var(--color-brand-900)] mb-4 text-lg">Accesos Rapidos</h3>
        <div class="space-y-3">
          <RouterLink
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            class="flex items-center gap-3 p-3 rounded-xl bg-white border border-[var(--color-brand-100)] hover:border-[var(--color-accent-300)] hover:shadow-md transition-all duration-300 group"
          >
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-accent-50)] to-[var(--color-accent-100)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Icon :icon="action.icon" class="w-5 h-5 text-[var(--color-accent-600)]" />
            </div>
            <span class="text-sm font-medium text-[var(--color-brand-700)] group-hover:text-[var(--color-brand-900)]">{{ action.label }}</span>
            <Icon icon="mdi:chevron-right" class="w-5 h-5 text-[var(--color-brand-300)] ml-auto group-hover:text-[var(--color-accent-500)] transition-colors" />
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
import { Line, Doughnut } from 'vue-chartjs'

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

const stats = ref([
  { label: 'Clientes de Alto Nivel', value: '0', icon: 'mdi:account-tie', color: '#2563EB', bg: '#EFF6FF' },
  { label: 'Canales ERP',            value: '0', icon: 'mdi:transit-connection-variant', color: '#059669', bg: '#DCFCE7' },
  { label: 'Facturación Abierta',    value: '0', icon: 'mdi:file-document-multiple-outline', color: '#D97706', bg: '#FEF3C7' },
  { label: 'Pedidos por Atender',    value: '0', icon: 'mdi:cart-arrow-down', color: '#7C3AED', bg: '#EDE9FE' },
])

const activeIntegrationsCount = ref(0)
const hasRevenueData = ref(false)

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
      bodyFont: { size: 14, family: 'Inter', weight: 'bold' }
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
      bodyFont: { size: 14, family: 'Inter', weight: 'bold' }
    }
  }
}

const quickActions = [
  { to: '/admin/integrations', icon: 'mdi:connection',            label: 'Gestionar Conexiones' },
  { to: '/admin/customers',    icon: 'mdi:account-plus-outline',   label: 'Nuevos Participantes' },
  { to: '/admin/products',     icon: 'mdi:package-variant-closed', label: 'Monitor de Inventario' },
  { to: '/admin/company',      icon: 'mdi:domain',                 label: 'Configuración Corporativa' },
]

const fetchDashboardData = async () => {
  try {
    const { data } = await api.get('/dashboard')
    const result = data.data
    
    // Update Stats
    stats.value[0].value = result.overview.activeCustomers.toString()
    stats.value[1].value = result.overview.activeIntegrations.toString()
    stats.value[2].value = result.overview.pendingInvoices.toString()
    stats.value[3].value = result.overview.openOrders.toString()
    
    activeIntegrationsCount.value = result.overview.activeIntegrations

    // Update charts
    const revenueSum = result.charts.revenue.data.reduce((a: number, b: number) => a + b, 0)
    hasRevenueData.value = revenueSum > 0 || result.charts.revenue.data.length > 0;

    chartDataRevenue.value = {
      labels: result.charts.revenue.labels,
      datasets: [{
        ...chartDataRevenue.value.datasets[0],
        data: result.charts.revenue.data,
      }]
    }

    if (result.charts.orderDistribution.labels.length > 0) {
      chartDataDistribution.value = {
        labels: result.charts.orderDistribution.labels,
        datasets: [{
          ...chartDataDistribution.value.datasets[0],
          data: result.charts.orderDistribution.counts,
        }]
      }
    } else {
      // Empty state doughnut
      chartDataDistribution.value = {
        labels: ['Sin datos'],
        datasets: [{ data: [1], backgroundColor: ['#E2E8F0'], borderWidth: 0, hoverOffset: 0 }]
      }
    }

  } catch (error) {
    console.error('Failed to fetch dashboard data', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>
