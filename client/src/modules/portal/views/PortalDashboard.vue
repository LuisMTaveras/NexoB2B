<template>
  <div class="animate-in fade-in duration-700">
    <div class="page-header mb-8 flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-black text-slate-800 tracking-tight">¡Hola, {{ auth.user?.firstName }}! 👋</h2>
        <div class="flex items-center gap-2 mt-1">
          <p class="text-sm text-slate-500">Accediendo como parte de</p>
          <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-black uppercase tracking-widest border border-indigo-100">
            {{ auth.user?.customerName || 'Empresa B2B' }}
          </span>
        </div>
      </div>
      <div class="text-right hidden sm:block">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tu Código Cliente</p>
        <p class="text-sm font-bold text-slate-600">{{ portalData?.customerCode || '---' }}</p>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="card overflow-hidden border-none bg-indigo-600 text-white p-6 shadow-indigo-200 shadow-xl relative group">
        <div class="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <Icon icon="mdi:cash-multiple" class="w-24 h-24" />
        </div>
        <div class="relative z-10">
          <p class="text-[10px] font-black uppercase tracking-widest opacity-80">Balance Pendiente</p>
          <div class="flex items-baseline gap-2 mt-2">
            <span class="text-3xl font-black tracking-tighter">{{ formatCurrency(portalData?.balance || 0) }}</span>
            <span class="text-xs opacity-70 font-bold uppercase">{{ portalData?.currency || 'DOP' }}</span>
          </div>
          <RouterLink to="/portal/invoices" class="mt-4 text-xs font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors inline-block">Ver Detalles</RouterLink>
        </div>
      </div>

      <div class="card p-6 bg-white/60 backdrop-blur-xl border-white/80 shadow-slate-200/50 shadow-lg group">
         <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon icon="mdi:package-variant-closed" class="w-6 h-6" />
            </div>
            <span class="badge badge-indigo animate-pulse">En Proceso</span>
         </div>
         <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedidos Activos</p>
         <p class="text-3xl font-black text-slate-800 mt-1 tracking-tighter">{{ portalData?.orderCount || 0 }}</p>
      </div>

      <div class="card p-6 border-dashed border-indigo-200 bg-indigo-50/20 flex flex-col items-center justify-center text-center">
         <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
            <Icon icon="mdi:cart-plus" class="w-6 h-6 text-indigo-600" />
         </div>
         <p class="text-sm font-bold text-slate-700">¿Necesitas reabastecerte?</p>
         <RouterLink to="/portal/catalog" class="btn btn-primary mt-3 text-[10px] uppercase font-black px-6">Ir al Catálogo</RouterLink>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Invoices -->
      <div class="card p-6 bg-white shadow-sm border-slate-100">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-black text-slate-800 uppercase text-xs tracking-widest">Facturas Recientes</h3>
            <RouterLink to="/portal/invoices" class="text-[10px] font-black text-indigo-600 uppercase hover:underline">Ver todas</RouterLink>
          </div>
          
          <div v-if="loading" class="space-y-4">
             <div v-for="n in 3" :key="n" class="h-12 bg-slate-50 animate-pulse rounded-xl"></div>
          </div>
          
          <div v-else-if="!portalData?.recentInvoices?.length" class="text-center py-10 text-slate-400">
             <Icon icon="mdi:file-search-outline" class="w-12 h-12 mx-auto opacity-20 mb-2" />
             <p class="text-sm">No hay facturas registradas recientemente.</p>
          </div>

          <div v-else class="divide-y divide-slate-50">
             <div v-for="inv in portalData.recentInvoices" :key="inv.id" class="py-4 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                <div class="flex items-center gap-3">
                   <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <Icon icon="mdi:file-document-outline" class="w-4 h-4" />
                   </div>
                   <div>
                      <p class="text-xs font-bold text-slate-800">{{ inv.number }}</p>
                      <p class="text-[10px] text-slate-400">{{ formatDate(inv.date) }}</p>
                   </div>
                </div>
                <div class="text-right">
                   <p class="text-xs font-black text-slate-900">{{ formatCurrency(inv.total) }}</p>
                   <span class="text-[9px] font-black uppercase tracking-tighter" :class="getStatusClass(inv.status)">
                      {{ inv.status }}
                   </span>
                </div>
             </div>
          </div>
      </div>

      <!-- Quick Actions / Support -->
      <div class="space-y-6">
          <div class="card p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden">
             <Icon icon="mdi:rocket-launch" class="absolute -right-2 -bottom-2 w-24 h-24 opacity-10" />
             <h3 class="font-black uppercase text-xs tracking-widest mb-4">Acceso Rápido</h3>
             <div class="grid grid-cols-2 gap-4 relative z-10">
                <RouterLink to="/portal/invoices" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/5">
                   <Icon icon="mdi:credit-card-outline" class="w-6 h-6 mb-2" />
                   <p class="text-[10px] font-bold uppercase">Pagar Factura</p>
                </RouterLink>
                <RouterLink to="/portal/support" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/5">
                   <Icon icon="mdi:help-circle-outline" class="w-6 h-6 mb-2" />
                   <p class="text-[10px] font-bold uppercase">Ayuda Soporte</p>
                </RouterLink>
             </div>
          </div>

          <div class="card p-6 border-indigo-100 bg-white group hover:border-indigo-300 transition-all">
             <div class="flex items-center justify-between mb-4">
                <h3 class="font-black text-slate-800 uppercase text-xs tracking-widest">Información de Perfil</h3>
                <RouterLink to="/portal/profile" class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                   <Icon icon="mdi:pencil-outline" class="w-4 h-4" />
                </RouterLink>
             </div>
             <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black shadow-md border border-indigo-400/30">
                   {{ auth.user?.firstName[0] }}{{ auth.user?.lastName[0] }}
                </div>
                <div>
                   <p class="text-sm font-bold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">{{ auth.fullName }}</p>
                   <p class="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-tighter">
                      {{ auth.user?.role === 'ADMIN' ? 'Administrador de Cuenta' : 'Comprador Autorizado' }}
                   </p>
                </div>
             </div>
          </div>

          <!-- Admin Quick Team Management -->
          <div v-if="auth.user?.role === 'ADMIN'" class="card p-6 bg-indigo-50/50 border-indigo-100 border-dashed animate-in slide-in-from-right duration-500">
             <h3 class="font-black text-indigo-800 uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">
                <Icon icon="mdi:account-group-outline" />
                Gestión de Delegados
             </h3>
             <p class="text-[11px] text-indigo-600 font-medium mb-4">Administra quiénes pueden realizar pedidos en nombre de tu empresa.</p>
             <RouterLink to="/portal/team" class="btn bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white w-full py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <Icon icon="mdi:account-plus-outline" />
                Administrar Mi Equipo
             </RouterLink>
          </div>
      </div>
    </div>

    <!-- Analytics Section (Admins Only) -->
    <div v-if="portalData?.analytics" class="mt-10 animate-in slide-in-from-bottom-5 duration-700 delay-200">
      <h3 class="font-black text-slate-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
        <Icon icon="mdi:chart-line" class="text-indigo-600" />
        Resumen de Consumo (Empresa)
      </h3>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <!-- Monthly Chart -->
        <div class="lg:col-span-2 card p-6 bg-white shadow-sm border-slate-100 min-h-[300px]">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tendencia de Gasto (6 meses)</p>
          <div class="h-64">
            <LineChart :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- User Spend List -->
        <div class="card p-6 bg-white shadow-sm border-slate-100">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gasto por Usuario (Top 5)</p>
          <div class="space-y-4">
            <div v-for="user in portalData.analytics.spendByUser" :key="user.name" class="flex flex-col">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-bold text-slate-700 truncate mr-2">{{ user.name }}</span>
                <span class="text-xs font-black text-indigo-600">{{ formatCurrency(user.total) }}</span>
              </div>
              <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-indigo-500 h-full rounded-full transition-all duration-1000" :style="{ width: getUserPercentage(user.total) + '%' }"></div>
              </div>
            </div>
            <div v-if="!portalData.analytics.spendByUser.length" class="text-center py-8 text-slate-400 italic text-xs">
              No hay datos de consumo disponibles.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Invoice } from '@/types/portal'

const auth = useAuthStore()

interface AnalyticMonth {
  label: string;
  total: number;
}

interface AnalyticUser {
  name: string;
  total: number;
}

interface PortalData {
  customerCode: string;
  balance: number;
  currency: string;
  orderCount: number;
  recentInvoices: Invoice[];
  analytics?: {
    spendByMonth: AnalyticMonth[];
    spendByUser: AnalyticUser[];
  };
}

const portalData = ref<PortalData | null>(null)
const loading = ref(true)

import { Line as LineChart } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler, type ChartData, type ChartOptions } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

const chartData = ref<ChartData<'line'>>({
  labels: [],
  datasets: [{
    label: 'Consumo Mensual',
    data: [],
    borderColor: '#4f46e5',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    fill: true,
    tension: 0.4,
    pointRadius: 4,
    pointBackgroundColor: '#fff',
    pointBorderWidth: 2,
  }]
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { display: false },
    x: { 
      grid: { display: false },
      ticks: { font: { size: 10, weight: 700 }, color: '#94a3b8' }
    }
  }
}

const getUserPercentage = (total: number) => {
  const analytics = portalData.value?.analytics
  const firstUser = analytics?.spendByUser?.[0]
  if (!firstUser || firstUser.total <= 0) return 0
  return (total / firstUser.total) * 100
}

const fetchData = async () => {
  try {
    const { data } = await api.get('/portal/dashboard')
    portalData.value = data.data

    if (portalData.value && portalData.value.analytics) {
      chartData.value = {
        labels: portalData.value.analytics.spendByMonth.map((m) => m.label),
        datasets: [{
          ...chartData.value.datasets[0],
          data: portalData.value.analytics.spendByMonth.map((m) => m.total)
        }]
      }
    }
  } catch (error) {
    console.error('Error fetching portal data:', error)
  } finally {
    loading.value = false
  }
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    PAID: 'text-emerald-500',
    PENDING: 'text-amber-500',
    OVERDUE: 'text-rose-500',
    CANCELLED: 'text-slate-400'
  }
  return map[status] || 'text-slate-500'
}

onMounted(fetchData)
</script>

