<template>
  <div class="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <button @click="$router.back()" class="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
          <Icon icon="mdi:arrow-left" class="w-5 h-5" />
        </button>
        <div>
          <div class="flex items-center gap-3 mb-1">
             <h2 class="text-3xl font-black text-slate-800 tracking-tight">{{ order?.number || 'Cargando...' }}</h2>
             <span v-if="order" class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border" :class="getStatusBadgeClass(order.status)">
               {{ mapStatus(order.status) }}
             </span>
          </div>
          <p class="text-sm font-bold text-slate-500">Realizado el {{ order ? formatDate(order.date) : '...' }}</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3" v-if="order">
         <button class="btn bg-white border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50">
            <Icon icon="mdi:printer-outline" class="w-4 h-4" />
            Imprimir
         </button>
         <button @click="downloadPDF" :disabled="downloading" class="btn bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            <Icon :icon="downloading ? 'mdi:loading' : 'mdi:file-pdf-box'" :class="{'animate-spin': downloading}" class="w-4 h-4" />
            Descargar Proforma
         </button>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
       <div class="lg:col-span-2 space-y-6">
          <div class="h-64 bg-white/50 animate-pulse rounded-3xl border border-slate-100"></div>
          <div class="h-40 bg-white/50 animate-pulse rounded-3xl border border-slate-100"></div>
       </div>
       <div class="space-y-6">
          <div class="h-80 bg-white/50 animate-pulse rounded-3xl border border-slate-100"></div>
       </div>
    </div>

    <div v-else-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Items Table -->
        <div class="card bg-white border-slate-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
             <h3 class="text-xs font-black uppercase tracking-widest text-slate-500">Productos en el pedido</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-slate-50/30">
                  <th class="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                  <th class="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cant.</th>
                  <th class="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="item in order.items" :key="item.id">
                  <td class="px-6 py-4">
                    <p class="font-bold text-slate-900 text-sm">{{ item.name }}</p>
                    <p class="text-[10px] font-mono text-slate-400 uppercase">{{ item.sku }}</p>
                  </td>
                  <td class="px-6 py-4 text-right font-bold text-slate-700 text-sm">{{ item.quantity }}</td>
                  <td class="px-6 py-4 text-right font-black text-slate-900 text-sm">{{ formatCurrency(item.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="p-6 bg-slate-900 text-white flex justify-between items-center">
             <span class="text-sm font-black uppercase tracking-widest opacity-60">Total del Pedido</span>
             <span class="text-2xl font-black">{{ formatCurrency(order.total) }} <span class="text-xs opacity-50">{{ order.currency }}</span></span>
          </div>
        </div>

        <!-- Timeline / Traceability -->
        <div class="card bg-white border-slate-100 shadow-sm p-6">
           <h3 class="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Historial y Trazabilidad</h3>
           <div class="space-y-6">
              <div class="flex gap-4 group">
                 <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Icon icon="mdi:check-circle" class="w-5 h-5" />
                 </div>
                 <div class="flex-1 pb-6 border-l-2 border-slate-100 ml-[-24px] pl-10">
                    <p class="text-sm font-bold text-slate-900">Pedido Recibido</p>
                    <p class="text-xs text-slate-500 mt-0.5">La orden ha sido registrada exitosamente en sistema.</p>
                    <p class="text-[10px] font-black text-slate-400 uppercase mt-2">{{ formatDate(order.date) }}</p>
                 </div>
              </div>

              <div v-if="order.status === 'PENDING_APPROVAL'" class="flex gap-4 group">
                 <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 animate-pulse">
                    <Icon icon="mdi:clock-outline" class="w-5 h-5" />
                 </div>
                 <div class="flex-1 ml-[-24px] pl-10">
                    <p class="text-sm font-bold text-slate-900">Pendiente de Aprobación</p>
                    <p class="text-xs text-slate-500 mt-0.5">Un administrador de tu empresa debe autorizar esta compra.</p>
                 </div>
              </div>

              <div v-if="order.approvedAt" class="flex gap-4 group">
                 <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon icon="mdi:shield-check-outline" class="w-5 h-5" />
                 </div>
                 <div class="flex-1 pb-6 border-l-2 border-slate-100 ml-[-24px] pl-10">
                    <p class="text-sm font-bold text-slate-900">Aprobado por Admin</p>
                    <p class="text-xs text-slate-500 mt-0.5">El pedido fue validado internamente para su procesamiento.</p>
                    <p class="text-[10px] font-black text-slate-400 uppercase mt-2">{{ formatDate(order.approvedAt) }}</p>
                 </div>
              </div>

              <div v-if="order.status === 'SHIPPED'" class="flex gap-4 group">
                 <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Icon icon="mdi:truck-delivery-outline" class="w-5 h-5" />
                 </div>
                 <div class="flex-1 ml-[-24px] pl-10">
                    <p class="text-sm font-bold text-slate-900">En Tránsito</p>
                    <p class="text-xs text-slate-500 mt-0.5">Tu mercancia está en camino a la dirección de entrega.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Summary Card -->
        <div class="card bg-slate-900 text-white p-6 shadow-xl border-none">
           <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Detalles del Solicitante</p>
            <div class="flex items-center gap-4 mb-6 pb-6 border-b border-white/10" v-if="order.submittedBy">
              <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-black">
                {{ order.submittedBy?.firstName?.[0] || '' }}{{ order.submittedBy?.lastName?.[0] || '' }}
              </div>
              <div>
                 <p class="font-bold text-sm">{{ order.submittedBy?.firstName }} {{ order.submittedBy?.lastName }}</p>
                 <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest">Comprador Autorizado</p>
              </div>
            </div>
           
           <div class="space-y-4">
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Empresa</p>
                <p class="text-sm font-bold">{{ auth.user?.customerName }}</p>
              </div>
              <div v-if="order.notes">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Notas Adicionales</p>
                <p class="text-xs text-slate-300 italic">"{{ order.notes }}"</p>
              </div>
           </div>
        </div>

        <!-- Help Card -->
        <div class="card bg-white border-slate-100 p-6 shadow-sm">
           <h4 class="text-sm font-black text-slate-800 mb-2">¿Necesitas ayuda?</h4>
           <p class="text-xs text-slate-500 mb-4 leading-relaxed">Si tienes dudas sobre este pedido o deseas realizar un cambio, contacta a soporte.</p>
           <button class="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors">
              Abrir Ticket
           </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import api from '@/services/api'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useAuthStore } from '@/stores/auth'
import type { Order } from '@/types/portal'

const route = useRoute()
const auth = useAuthStore()
const order = ref<Order | null>(null)
const loading = ref(true)
const downloading = ref(false)

const fetchData = async () => {
  try {
    const { data } = await api.get(`/portal/orders/${route.params.id}`)
    order.value = data.data
  } catch (error) {
    console.error('Error fetching order details:', error)
  } finally {
    loading.value = false
  }
}

const downloadPDF = async () => {
  if (!order.value) return
  downloading.value = true
  try {
    const response = await api.get(`/portal/orders/${order.value.id}/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Proforma_${order.value.number}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error downloading PDF:', err)
  } finally {
    downloading.value = false
  }
}

const mapStatus = (status: string) => {
  const map: Record<string, string> = {
    PENDING_APPROVAL: 'Esperando Aprobación ⏳',
    OPEN: 'Confirmado ✅',
    SHIPPED: 'En Camino 🚚',
    DELIVERED: 'Recibido 🏁',
    CANCELLED: 'Anulado ❌',
    REJECTED: 'Rechazado 🚫'
  }
  return map[status] || status
}

const getStatusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
    OPEN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    SHIPPED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    DELIVERED: 'bg-slate-100 text-slate-700 border-slate-200',
    CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
    REJECTED: 'bg-rose-100 text-rose-700 border-rose-200'
  }
  return map[status] || 'bg-slate-50 text-slate-500'
}

onMounted(fetchData)
</script>
