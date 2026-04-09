<template>
  <div class="animate-in fade-in duration-700">
    <div class="page-header mb-8 flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-black text-slate-800 tracking-tight">¡Hola, {{ auth.user?.firstName }}! 👋</h2>
        <p class="text-sm text-slate-500 mt-1">Aquí tienes un resumen de tu actividad comercial hoy.</p>
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
          <button class="mt-4 text-xs font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">Ver Detalles</button>
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
                <button class="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/5">
                   <Icon icon="mdi:credit-card-outline" class="w-6 h-6 mb-2" />
                   <p class="text-[10px] font-bold uppercase">Pagar Factura</p>
                </button>
                <button class="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/5">
                   <Icon icon="mdi:help-circle-outline" class="w-6 h-6 mb-2" />
                   <p class="text-[10px] font-bold uppercase">Ayuda Soporte</p>
                </button>
             </div>
          </div>

          <div class="card p-6 border-indigo-100">
             <h3 class="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Información de Perfil</h3>
             <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                   {{ auth.user?.firstName[0] }}{{ auth.user?.lastName[0] }}
                </div>
                <div>
                   <p class="text-sm font-bold text-slate-900 leading-none">{{ auth.fullName }}</p>
                   <p class="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">{{ auth.user?.role }} @ {{ auth.company?.name }}</p>
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

const auth = useAuthStore()
const portalData = ref<any>(null)
const loading = ref(true)

const fetchData = async () => {
  try {
    const { data } = await api.get('/portal/dashboard')
    portalData.value = data.data
  } catch (error) {
    console.error('Error fetching portal data:', error)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(val))
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
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

