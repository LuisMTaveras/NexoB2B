<template>
  <div class="max-w-[1600px] mx-auto px-4 py-6">
    <!-- Premium Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
      <div>
        <h2 class="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Inteligencia de Ventas</h2>
        <p class="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
          <Icon icon="mdi:trophy-variant" class="text-amber-500 w-4 h-4" />
          Análisis de rendimiento comercial NexoB2B
        </p>
      </div>
      
      <div class="flex items-center gap-3">
        <div class="flex p-1 bg-slate-100/80 backdrop-blur rounded-2xl border border-white/50 shadow-inner">
           <button v-for="p in periods" :key="p.val" 
                   @click="activePeriod = p.val"
                   class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
                   :class="activePeriod === p.val ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'">
             {{ p.label }}
           </button>
        </div>
        <button @click="fetchDashboardData" class="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
          <Icon icon="mdi:refresh" :class="{ 'animate-spin': loading }" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Main KPIs Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div v-for="stat in stats" :key="stat.label" class="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl border transition-transform group-hover:scale-110 shadow-sm" :style="{ backgroundColor: stat.bg, color: stat.color, borderColor: 'rgba(255,255,255,0.8)' }">
            <Icon :icon="stat.icon" class="w-6 h-6" />
          </div>
          <div v-if="stat.growth !== undefined" class="flex flex-col items-end">
             <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-tighter shadow-sm border"
                  :class="stat.growth >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'">
               <Icon :icon="stat.growth >= 0 ? 'mdi:trending-up' : 'mdi:trending-down'" />
               {{ Math.abs(stat.growth).toFixed(1) }}%
             </div>
             <span class="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">vs Mes Anterior</span>
          </div>
        </div>
        <div>
          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{{ stat.label }}</h4>
          <div class="text-3xl font-black text-slate-900 tracking-tighter">
             <span v-if="loading" class="inline-block w-20 h-8 bg-slate-100 animate-pulse rounded-lg"></span>
             <span v-else>{{ stat.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Analytics Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
      <!-- Top Selling Products Panel -->
      <div class="lg:col-span-2 bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[3rem] p-8 relative overflow-hidden group flex flex-col">
         <div class="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-1000"></div>
         
         <div class="flex items-center justify-between mb-8 relative z-10">
            <div>
               <h3 class="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <div class="p-2 rounded-xl bg-orange-50 text-orange-500 border border-orange-100">
                     <Icon icon="mdi:fire" class="w-5 h-5 text-white" />
                  </div>
                  Productos Estrella del Mes
               </h3>
               <p class="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-2">Basado en volumen de facturación activa</p>
            </div>
         </div>

         <div class="space-y-4 relative z-10">
            <div v-if="loading" v-for="i in 3" :key="i" class="h-20 bg-slate-100 rounded-3xl animate-pulse"></div>
            <div v-else-if="!topProducts.length" class="py-20 text-center opacity-40 italic font-mono text-xs text-slate-500">No hay actividad registrada en este periodo.</div>
            <div v-for="(prod, idx) in topProducts" :key="prod.sku" class="flex items-center gap-5 p-4 bg-white hover:bg-slate-50 rounded-[2rem] border border-slate-100 transition-all shadow-sm">
               <div class="flex-shrink-0 relative">
                  <div class="w-14 h-14 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                     <img v-if="prod.imageUrl" :src="prod.imageUrl" class="w-full h-full object-cover">
                     <Icon v-else icon="mdi:package-variant" class="w-full h-full p-3 text-slate-400" />
                  </div>
                  <div class="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-slate-900 text-white border-2 border-white flex items-center justify-center text-[10px] font-black">
                     {{ idx + 1 }}
                  </div>
               </div>
               <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-bold text-slate-800 truncate">{{ prod.name }}</h4>
                  <p class="text-[10px] font-mono text-slate-400 mt-1 uppercase">{{ prod.sku }}</p>
                  <div class="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                     <div class="h-full bg-orange-500 rounded-full" 
                          :style="{ width: (prod.total / (topProducts[0]?.total || 1)) * 100 + '%' }"></div>
                  </div>
               </div>
               <div class="text-right">
                  <p class="text-[9px] font-black uppercase text-slate-400 tracking-wider">Monto Total</p>
                  <p class="text-lg font-black text-slate-900 tracking-tighter">{{ formatCurrency(prod.total) }}</p>
                  <p class="text-[10px] font-bold text-slate-400 mt-1">{{ prod.quantity }} Unidades</p>
               </div>
            </div>
         </div>
      </div>

      <!-- Top Customers Panel -->
      <div class="bg-white rounded-[3rem] p-8 border border-white shadow-xl flex flex-col">
         <div class="flex items-center justify-between mb-8">
            <h3 class="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
               <div class="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Icon icon="mdi:account-star" class="w-5 h-5" />
               </div>
               VIP Leaderboard
            </h3>
         </div>

         <div class="flex-1 space-y-6">
            <div v-if="loading" v-for="i in 5" :key="i" class="flex gap-4 animate-pulse">
               <div class="w-10 h-10 bg-slate-100 rounded-full"></div>
               <div class="flex-1 space-y-2 mt-1">
                  <div class="h-2.5 bg-slate-100 rounded w-1/2"></div>
                  <div class="h-2 bg-slate-50 rounded w-1/4"></div>
               </div>
            </div>
            <div v-for="cust in topCustomers" :key="cust.id" class="flex items-center gap-4 group">
               <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black uppercase ring-4 ring-white shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform">
                  {{ cust.name.slice(0, 2) }}
               </div>
               <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-bold text-slate-800 truncate">{{ cust.name }}</h4>
                  <div class="flex items-center gap-2 mt-1">
                     <span class="text-[9px] font-black bg-slate-50 border border-slate-100 text-slate-400 px-1.5 py-0.5 rounded-lg uppercase tracking-tighter">{{ cust.code }}</span>
                     <span class="text-[10px] font-bold text-indigo-600">{{ cust.orderCount }} pedidos</span>
                  </div>
               </div>
               <div class="text-right">
                  <p class="text-sm font-black text-slate-900 tracking-tighter">{{ formatCurrency(cust.totalSpent) }}</p>
                  <div class="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                     <div class="h-full bg-indigo-600 rounded-full" 
                          :style="{ width: (cust.totalSpent / (topCustomers[0]?.totalSpent || 1)) * 100 + '%' }"></div>
                  </div>
               </div>
            </div>
         </div>

         <button class="mt-8 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-slate-200 transition-all border border-slate-200">
            Descargar Reporte Comercial
         </button>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Line Chart Revenue -->
      <div class="bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.05)] rounded-[3rem] p-8 lg:col-span-2 flex flex-col">
        <h3 class="font-black text-slate-900 mb-8 flex items-center gap-3 text-lg tracking-tight">
          <div class="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
             <Icon icon="mdi:chart-timeline-variant-shimmer" class="w-6 h-6" />
          </div>
          Histórico de Ingresos
        </h3>
        <div class="flex-1 w-full h-72 min-h-[18rem]">
          <div v-if="loading" class="w-full h-full flex items-center justify-center">
            <Icon icon="mdi:loading" class="w-8 h-8 animate-spin text-slate-200" />
          </div>
          <Line v-else-if="hasRevenueData" :data="chartDataRevenue" :options="chartOptionsLines" />
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
             <Icon icon="mdi:chart-line" class="w-12 h-12 mb-3 opacity-20" />
             <p class="text-xs font-bold uppercase tracking-widest">Sin transacciones registradas</p>
          </div>
        </div>
      </div>

      <!-- Doughnut Chart Orders -->
      <div class="bg-white/70 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(0,0,0,0.05)] rounded-[3rem] p-8 flex flex-col">
        <h3 class="font-black text-slate-900 mb-8 flex items-center gap-3 text-lg tracking-tight">
          <div class="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
             <Icon icon="mdi:chart-pie" class="w-6 h-6" />
          </div>
          Estado de Operaciones
        </h3>
        <div class="flex-1 w-full h-72 min-h-[18rem] flex items-center justify-center">
          <div v-if="loading" class="flex items-center justify-center">
            <Icon icon="mdi:loading" class="w-8 h-8 animate-spin text-slate-200" />
          </div>
          <Doughnut v-else :data="chartDataDistribution" :options="chartOptionsDoughnut" class="max-w-[90%] max-h-[90%]" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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

const loading = ref(true)
const activePeriod = ref('monthly')
const topProducts = ref<any[]>([])
const topCustomers = ref<any[]>([])
const hasRevenueData = ref(false)

const periods = [
  { label: 'Este Mes', val: 'monthly' },
  { label: 'Últimos 90d', val: '90d' },
  { label: 'Histórico', val: 'all' }
]

const stats = ref([
  { label: 'Ventas Totales',  value: 'RD$ 0', icon: 'mdi:cash-multiple', color: '#10B981', bg: '#F1FDF7', growth: 0 },
  { label: 'Ticket Promedio', value: 'RD$ 0', icon: 'mdi:tag-heart',    color: '#6366F1', bg: '#EEF2FF', growth: 0 },
  { label: 'Pedidos Activos', value: '0',      icon: 'mdi:basket-check', color: '#F59E0B', bg: '#FFFBEB' },
  { label: 'Clientes VIP',    value: '0',      icon: 'mdi:account-star', color: '#8B5CF6', bg: '#F5F3FF' },
])

const chartDataRevenue = ref({
  labels: [] as string[],
  datasets: [{
    label: 'Ingresos',
    data: [] as number[],
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 4,
    pointBackgroundColor: '#fff',
    pointBorderColor: '#6366F1',
    pointBorderWidth: 2,
    pointRadius: 5,
    fill: true,
    tension: 0.4
  }]
})

const chartDataDistribution = ref({
  labels: [] as string[],
  datasets: [{
    data: [] as number[],
    backgroundColor: ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#14B8A6'],
    borderWidth: 4,
    borderColor: '#ffffff',
    hoverOffset: 15
  }]
})

const chartOptionsLines = {
  responsive: true as const,
  maintainAspectRatio: false as const,
  plugins: { 
    legend: { display: false as const },
    tooltip: {
      padding: 15,
      backgroundColor: '#0f172a',
      titleFont: { size: 12, weight: 'bold' as const, family: 'Inter' },
      bodyFont: { size: 14, weight: 'bold' as const, family: 'Inter' },
      displayColors: false,
      callbacks: {
        label: (context: any) => ` ${formatCurrency(context.parsed.y)}`
      }
    }
  },
  scales: {
    y: { 
      beginAtZero: true, 
      grid: { color: 'rgba(0,0,0,0.03)', borderDash: [5, 5] },
      ticks: { color: '#94a3b8', font: { size: 10, family: 'Inter' } }
    },
    x: { 
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 10, family: 'Inter' } }
    }
  }
}

const chartOptionsDoughnut = {
  responsive: true as const,
  maintainAspectRatio: false as const,
  cutout: '80%',
  plugins: {
    legend: { 
      position: 'bottom' as const,
      labels: { usePointStyle: true, pointStyle: 'circle' as const, padding: 25, color: '#64748b', font: { size: 11, weight: 'bold' as const, family: 'Inter' } }
    }
  }
}

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/dashboard')
    const res = data.data
    
    // Update Stats
    stats.value[0]!.value = formatCurrency(res.overview.thisMonthTotal)
    stats.value[0]!.growth = res.overview.growth
    stats.value[1]!.value = formatCurrency(res.overview.aov)
    stats.value[2]!.value = res.overview.openOrders.toString()
    stats.value[3]!.value = res.overview.activeCustomers.toString()

    // Analytics lists
    topProducts.value = res.analytics.topProducts
    topCustomers.value = res.analytics.topCustomers

    // History Chart
    hasRevenueData.value = res.charts.revenue.data.some((v: number) => v > 0)
    chartDataRevenue.value.labels = res.charts.revenue.labels
    chartDataRevenue.value.datasets[0]!.data = res.charts.revenue.data

    // Distribution
    if (res.charts.orderDistribution.labels.length > 0) {
      chartDataDistribution.value.labels = res.charts.orderDistribution.labels.map((l: string) => l.replace(/_/g, ' '))
      chartDataDistribution.value.datasets[0]!.data = res.charts.orderDistribution.counts
    }

  } catch (error) {
    console.error('Analytics Fetch Failed', error)
  } finally {
    loading.value = false
  }
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 0 }).format(v || 0)
}

watch(activePeriod, () => fetchDashboardData())
onMounted(() => fetchDashboardData())
</script>

<style scoped>
.tracking-tighter { letter-spacing: -0.05em; }
</style>
