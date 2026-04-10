<template>
  <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="page-header mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-[var(--color-brand-900)] tracking-tight">Mis Pedidos</h2>
        <p class="text-sm font-bold text-[var(--color-brand-500)] mt-1">Sigue el estado de tus compras B2B en tiempo real.</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="fetchOrders" class="btn bg-white hover:bg-[var(--color-brand-50)] text-[var(--color-brand-600)] border border-[var(--color-brand-200)] shadow-sm px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
           <Icon icon="mdi:refresh" :class="{'animate-spin': loading}" />
           Actualizar
        </button>
        <button @click="exportCsv" class="btn bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
           <Icon icon="mdi:microsoft-excel" class="w-5 h-5" />
           <span class="text-xs font-black uppercase">Exportar CSV</span>
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="mb-8 flex flex-wrap items-center gap-4 bg-white/50 p-4 rounded-2xl border border-[var(--color-brand-100)] backdrop-blur-sm">
      <div class="relative flex-1 min-w-[200px]">
        <Icon icon="mdi:search" class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-400)]" />
        <input v-model="search" type="text" placeholder="Buscar por número o SKU..." 
               class="w-full pl-10 pr-4 py-2 bg-white border border-[var(--color-brand-100)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-400)] transition-all" />
      </div>
      <select v-model="statusFilter" class="pl-4 pr-10 py-2 bg-white border border-[var(--color-brand-100)] rounded-xl text-sm font-bold text-[var(--color-brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-400)] appearance-none cursor-pointer">
        <option value="ALL">Todos los estados</option>
        <option value="PENDING_APPROVAL">Pend. Aprobación</option>
        <option value="OPEN">Abierto</option>
        <option value="CONFIRMED">Confirmado</option>
        <option value="SHIPPED">En Tránsito</option>
        <option value="DELIVERED">Entregado</option>
        <option value="CANCELLED">Cancelado</option>
        <option value="REJECTED">Rechazado</option>
      </select>
      <select v-model="dateFilter" class="pl-4 pr-10 py-2 bg-white border border-[var(--color-brand-100)] rounded-xl text-sm font-bold text-[var(--color-brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-400)] appearance-none cursor-pointer">
        <option value="all">Cualquier fecha</option>
        <option value="today">Hoy</option>
        <option value="week">Esta semana</option>
        <option value="month">Este mes</option>
        <option value="quarter">Últimos 3 meses</option>
      </select>
    </div>

    <div v-if="loading" class="flex flex-col gap-4">
       <div v-for="i in 3" :key="i" class="h-24 bg-white/50 animate-pulse rounded-2xl border border-[var(--color-brand-100)]"></div>
    </div>

    <div v-else-if="!filteredOrders.length" class="card py-20 flex flex-col items-center text-center bg-white/80 backdrop-blur-xl border border-[var(--color-brand-100)] shadow-sm mt-8">
      <div class="w-20 h-20 rounded-full bg-[var(--color-brand-50)] flex items-center justify-center mb-6 border border-[var(--color-brand-100)]">
         <Icon icon="mdi:package-variant-closed" class="w-10 h-10 text-[var(--color-brand-300)]" />
      </div>
      <h3 class="text-lg font-black text-[var(--color-brand-900)]">No se encontraron pedidos</h3>
      <p class="text-[13px] font-medium text-[var(--color-brand-500)] max-w-sm mx-auto mt-2 mb-6">No hay resultados que coincidan con tus filtros.</p>
      <button @click="resetFilters" class="btn bg-[var(--color-brand-900)] text-white font-black px-6 py-2.5 rounded-xl">Limpiar Filtros</button>
    </div>

    <div v-else class="space-y-4">
       <div v-for="order in filteredOrders" :key="order.id" class="bg-white/80 backdrop-blur-xl rounded-2xl border border-[var(--color-brand-100)] shadow-sm overflow-hidden group hover:border-[var(--color-accent-200)] transition-all">
          <div class="px-6 py-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer" @click="toggleOrder(order.id)">
             <div class="flex items-center gap-5">
               <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border" :class="getStatusIconClass(order.status)">
                  <Icon :icon="getStatusIcon(order.status)" class="w-6 h-6" />
               </div>
               <div>
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-black text-[var(--color-brand-900)]">{{ order.number }}</p>
                    <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border" :class="getStatusBadgeClass(order.status)">{{ mapStatus(order.status) }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-[11px] font-bold text-[var(--color-brand-500)]">
                     <span>{{ formatDate(order.date) }}</span>
                     <span class="w-1 h-1 rounded-full bg-[var(--color-brand-300)]"></span>
                     <span>{{ order.items?.length || 0 }} productos</span>
                  </div>
               </div>
             </div>
             
             <div class="flex items-center gap-6">
                <div class="text-right">
                   <p class="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-400)]">Total Facturado</p>
                   <p class="font-black text-lg text-[var(--color-brand-900)] tracking-tighter">{{ formatCurrency(order.total) }} <span class="text-[10px]">{{ order.currency }}</span></p>
                </div>
                <button class="w-8 h-8 rounded-full bg-[var(--color-brand-50)] flex items-center justify-center text-[var(--color-brand-400)] transition-colors group-hover:bg-[var(--color-accent-50)] group-hover:text-[var(--color-accent-600)]">
                   <Icon icon="mdi:chevron-down" class="w-5 h-5 transition-transform duration-300" :class="{'rotate-180': expandedOrder === order.id}" />
                </button>
             </div>
          </div>

          <!-- Expanded Items -->
          <Transition
             enter-active-class="transition duration-300 ease-out"
             enter-from-class="opacity-0 -translate-y-4"
             enter-to-class="opacity-100 translate-y-0"
             leave-active-class="transition duration-200 ease-in"
             leave-from-class="opacity-100 translate-y-0"
             leave-to-class="opacity-0 -translate-y-4"
          >
             <div v-if="expandedOrder === order.id" class="border-t border-[var(--color-brand-100)]/50 bg-[var(--color-brand-50)]/50 p-6">
                <!-- Notes -->
                <div v-if="order.notes" class="mb-4 p-3 rounded-xl bg-amber-50/50 border border-amber-100/50 flex gap-3 text-amber-800">
                   <Icon icon="mdi:note-text-outline" class="w-5 h-5 shrink-0 opacity-70 mt-0.5" />
                   <div>
                     <p class="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Notas del Pedido</p>
                     <p class="text-xs font-medium">{{ order.notes }}</p>
                   </div>
                </div>

                <div class="overflow-x-auto">
                   <table class="w-full text-left border-collapse">
                      <thead>
                         <tr>
                            <th class="py-2 text-[10px] font-black text-[var(--color-brand-400)] uppercase tracking-widest border-b border-[var(--brand-100)]">Producto</th>
                            <th class="py-2 text-[10px] font-black text-[var(--color-brand-400)] uppercase tracking-widest border-b border-[var(--brand-100)] text-right">Cant.</th>
                            <th class="py-2 text-[10px] font-black text-[var(--color-brand-400)] uppercase tracking-widest border-b border-[var(--brand-100)] text-right">Precio Unit.</th>
                            <th class="py-2 text-[10px] font-black text-[var(--color-brand-400)] uppercase tracking-widest border-b border-[var(--brand-100)] text-right">Subtotal</th>
                         </tr>
                      </thead>
                      <tbody class="text-sm font-medium">
                         <tr v-for="item in order.items" :key="item.id" class="border-b border-[var(--color-brand-100)]/50 last:border-0 hover:bg-white/50 transition-colors">
                            <td class="py-3">
                               <p class="font-bold text-[var(--color-brand-900)] leading-tight">{{ item.name }}</p>
                               <p class="text-[10px] font-bold text-[var(--color-brand-400)] font-mono uppercase">{{ item.sku }}</p>
                            </td>
                            <td class="py-3 text-right font-black text-[var(--color-brand-700)]">{{ item.quantity }}</td>
                            <td class="py-3 text-right font-semibold text-[var(--color-brand-600)]">{{ formatCurrency(item.unitPrice) }}</td>
                            <td class="py-3 text-right font-black text-[var(--color-brand-900)] tracking-tight">{{ formatCurrency(item.total) }}</td>
                         </tr>
                      </tbody>
                   </table>
                </div>

                <!-- Approval Info / Actions -->
                <div v-if="order.status === 'PENDING_APPROVAL' || order.status === 'REJECTED' || order.approvedAt" class="mt-6 mb-4 p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4" :class="order.status === 'REJECTED' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'">
                   <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full flex items-center justify-center border" :class="order.status === 'REJECTED' ? 'bg-white text-rose-500 border-rose-200' : 'bg-white text-indigo-500 border-slate-200'">
                         <Icon :icon="order.status === 'REJECTED' ? 'mdi:alert-octagon-outline' : 'mdi:shield-check-outline'" class="w-6 h-6" />
                      </div>
                      <div>
                         <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado de Autorización</p>
                         <h4 class="text-sm font-black text-slate-700" v-if="order.status === 'PENDING_APPROVAL'">Esperando validación interna</h4>
                         <h4 class="text-sm font-black text-rose-700" v-else-if="order.status === 'REJECTED'">Pedido Rechazado: {{ order.rejectedReason }}</h4>
                         <h4 class="text-sm font-black text-emerald-700" v-else>Pedido Autorizado por Administración</h4>
                      </div>
                   </div>

                   <div v-if="order.status === 'PENDING_APPROVAL' && isAdmin" class="flex gap-2">
                      <button 
                        @click.stop="rejectOrder(order)"
                        class="px-4 py-2 bg-white text-rose-600 border border-rose-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-all shadow-sm flex items-center gap-2"
                      >
                         <Icon icon="mdi:close-thick" class="w-4 h-4" />
                         Rechazar
                      </button>
                      <button 
                        @click.stop="approveOrder(order)"
                        :disabled="approving === order.id"
                        class="px-5 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                      >
                         <Icon :icon="approving === order.id ? 'mdi:loading' : 'mdi:check-bold'" :class="{'animate-spin': approving === order.id}" class="w-4 h-4" />
                         {{ approving === order.id ? 'Aprobando...' : 'Aprobar Pedido' }}
                      </button>
                   </div>
                </div>

                <!-- Actions -->
                <div class="mt-6 flex justify-end gap-3 px-2">
                   <RouterLink 
                     :to="`/portal/support?orderId=${order.number}`"
                     class="px-4 py-2 border border-slate-200 bg-white text-[var(--color-brand-600)] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
                   >
                     <Icon icon="mdi:ticket-outline" class="w-4 h-4" />
                     Reportar Problema
                   </RouterLink>

                   <RouterLink :to="`/portal/orders/${order.id}`" class="btn bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 text-[10px] uppercase tracking-widest">
                       <Icon icon="mdi:eye-outline" class="w-4 h-4" />
                       Ver Detalle Completo
                    </RouterLink>

                   <button 
                     @click.stop="downloadProforma(order)"
                     :disabled="downloading === order.id"
                     class="px-4 py-2 border border-blue-200 bg-white text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2"
                   >
                     <Icon :icon="downloading === order.id ? 'mdi:loading' : 'mdi:file-pdf-outline'" :class="{'animate-spin': downloading === order.id}" class="w-4 h-4" />
                     {{ downloading === order.id ? 'Generando...' : 'Descargar Proforma' }}
                   </button>

                   <button 
                     @click.stop="reorderOrder(order)"
                     :disabled="reordering === order.id"
                     class="px-4 py-2 bg-[var(--color-accent-600)] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                   >
                      <Icon :icon="reordering === order.id ? 'mdi:loading' : 'mdi:repeat'" :class="{'animate-spin': reordering === order.id}" class="w-4 h-4" />
                      {{ reordering === order.id ? 'Procesando...' : 'Repetir Pedido' }}
                   </button>
                </div>
             </div>
          </Transition>

       </div>
    </div>

    <!-- Rejection Modal -->
    <div v-if="showRejectModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
       <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h3 class="text-lg font-black text-slate-800 tracking-tight">Rechazar Pedido</h3>
             <button @click="showRejectModal = false" class="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
          </div>
          <div class="p-6 space-y-4">
             <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">¿Por qué deseas rechazar el pedido {{ rejectTarget?.number }}?</p>
             <textarea 
               v-model="rejectReason" 
               class="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none"
               placeholder="Escribe el motivo del rechazo aquí..."
             ></textarea>
             
             <div class="flex gap-3 pt-4">
                <button @click="showRejectModal = false" class="btn bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-6 py-2.5 rounded-xl flex-1">Cancelar</button>
                <button 
                  @click="confirmReject" 
                  :disabled="!rejectReason.trim() || rejecting"
                  class="btn bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-2.5 rounded-xl flex-1 shadow-lg shadow-rose-200 disabled:opacity-50"
                >
                   {{ rejecting ? 'Procesando...' : 'Confirmar Rechazo' }}
                </button>
             </div>
          </div>
       </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
       <div class="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
          <div class="p-8 text-center">
             <div class="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                <Icon icon="mdi:check-circle" class="w-12 h-12 text-emerald-500 animate-in zoom-in-50 duration-500" />
             </div>
             <h3 class="text-2xl font-black text-slate-900 tracking-tight mb-2">{{ successTitle }}</h3>
             <p class="text-sm font-medium text-slate-500 leading-relaxed mb-8">{{ successMessage }}</p>
             <button @click="showSuccessModal = false" class="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                Entendido
             </button>
          </div>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Order } from '@/types/portal'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'ADMIN')

const rejectTarget = ref<Order | null>(null)
const rejectReason = ref('')
const rejecting = ref(false)
const showRejectModal = ref(false)

const loading = ref(false)
const orders = ref<Order[]>([])
const expandedOrder = ref<string | null>(null)
const approving = ref<string | null>(null)
const downloading = ref<string | null>(null)
const reordering = ref<string | null>(null)

const showSuccessModal = ref(false)
const successTitle = ref('')
const successMessage = ref('')

// Filters
const search = ref('')
const statusFilter = ref('ALL')
const dateFilter = ref('all')

const resetFilters = () => {
  search.value = ''
  statusFilter.value = 'ALL'
  dateFilter.value = 'all'
}

const filteredOrders = computed(() => {
  return orders.value.filter(o => {
    // 1. Search
    const cleanSearch = search.value.toLowerCase().trim()
    const matchesSearch = !cleanSearch || 
      o.number.toLowerCase().includes(cleanSearch) || 
      o.items?.some(item => item.name.toLowerCase().includes(cleanSearch) || item.sku.toLowerCase().includes(cleanSearch))

    // 2. Status
    const matchesStatus = statusFilter.value === 'ALL' || o.status === statusFilter.value

    // 3. Date
    let matchesDate = true
    if (dateFilter.value !== 'all') {
      const orderDate = new Date(o.date)
      const now = new Date()
      if (dateFilter.value === 'today') {
        matchesDate = orderDate.toDateString() === now.toDateString()
      } else if (dateFilter.value === 'week') {
        const lastWeek = new Date()
        lastWeek.setDate(lastWeek.getDate() - 7)
        matchesDate = orderDate >= lastWeek
      } else if (dateFilter.value === 'month') {
        matchesDate = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
      } else if (dateFilter.value === 'quarter') {
        const quarterAgo = new Date()
        quarterAgo.setMonth(quarterAgo.getMonth() - 3)
        matchesDate = orderDate >= quarterAgo
      }
    }

    return matchesSearch && matchesStatus && matchesDate
  })
})

const fetchOrders = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/portal/orders')
    orders.value = data.data
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    loading.value = false
  }
}

const exportCsv = async () => {
  try {
    const response = await api.get('/portal/orders/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Pedidos_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error exporting CSV:', error)
    alert('No se pudo exportar el archivo CSV')
  }
}

const toggleOrder = (id: string) => {
  expandedOrder.value = expandedOrder.value === id ? null : id
}

const approveOrder = async (order: Order) => {
  approving.value = order.id
  try {
    await api.patch(`/portal/orders/${order.id}/approve`)
    successTitle.value = '¡Pedido Aprobado!'
    successMessage.value = `El pedido ${order.number} ha sido autorizado exitosamente y pasará a revisión logística.`
    showSuccessModal.value = true
    await fetchOrders()
  } catch (err: unknown) {
    const apiError = err as { response?: { data?: { error?: string } } };
    alert(apiError.response?.data?.error || 'No se pudo aprobar el pedido.')
  } finally {
    approving.value = null
  }
}

async function downloadProforma(order: Order) {
  if (downloading.value) return
  downloading.value = order.id
  try {
    const response = await api.get(`/portal/orders/${order.id}/proforma`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `PROFORMA-${order.number}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Download error:', err)
    alert('No se pudo generar la proforma.')
  } finally {
    downloading.value = null
  }
}

const rejectOrder = (order: Order) => {
  rejectTarget.value = order
  rejectReason.value = ''
  showRejectModal.value = true
}

const confirmReject = async () => {
  if (!rejectTarget.value) return
  rejecting.value = true
  try {
    await api.patch(`/portal/orders/${rejectTarget.value.id}/reject`, { reason: rejectReason.value })
    showRejectModal.value = false
    successTitle.value = 'Pedido Rechazado'
    successMessage.value = 'El pedido ha sido rechazado correctamente y el comprador será notificado.'
    showSuccessModal.value = true
    await fetchOrders()
  } catch (err: unknown) {
    const apiError = err as { response?: { data?: { error?: string } } };
    alert(apiError.response?.data?.error || 'No se pudo rechazar el pedido.')
  } finally {
    rejecting.value = false
  }
}

const reorderOrder = async (order: Order) => {
  if (reordering.value) return
  reordering.value = order.id
  try {
    await api.post(`/portal/orders/${order.id}/reorder`)
    successTitle.value = '¡Repedido Exitoso!'
    successMessage.value = 'El pedido se ha duplicado correctamente. Ya puedes verlo al inicio de tu lista de pedidos.'
    showSuccessModal.value = true
    await fetchOrders()
  } catch (err) {
    console.error('Error reordering:', err)
  } finally {
    reordering.value = null
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING_APPROVAL': return 'mdi:clock-alert-outline'
    case 'OPEN':             return 'mdi:cart-outline'
    case 'CONFIRMED':        return 'mdi:check-circle-outline'
    case 'SHIPPED':          return 'mdi:truck-fast-outline'
    case 'DELIVERED':        return 'mdi:package-variant'
    case 'CANCELLED':        return 'mdi:close-circle-outline'
    case 'REJECTED':         return 'mdi:close-circle'
    default: return 'mdi:file-document-outline'
  }
}

const getStatusIconClass = (status: string) => {
  switch (status) {
    case 'PENDING_APPROVAL': return 'bg-amber-50 text-amber-500 border-amber-200'
    case 'OPEN':             return 'bg-blue-50 text-blue-500 border-blue-100'
    case 'CONFIRMED':        return 'bg-emerald-50 text-emerald-500 border-emerald-100'
    case 'SHIPPED':          return 'bg-purple-50 text-purple-500 border-purple-100'
    case 'DELIVERED':        return 'bg-indigo-50 text-indigo-500 border-indigo-100'
    case 'CANCELLED':        return 'bg-slate-50 text-slate-400 border-slate-100'
    case 'REJECTED':         return 'bg-rose-50 text-rose-500 border-rose-100'
    default: return 'bg-slate-50 text-slate-500 border-slate-100'
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'PENDING_APPROVAL': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'OPEN':             return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'CONFIRMED':        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'SHIPPED':          return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'DELIVERED':        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'CANCELLED':        return 'bg-slate-50 text-slate-500 border-slate-200'
    case 'REJECTED':         return 'bg-rose-50 text-rose-700 border-rose-200'
    default: return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const mapStatus = (status: string) => {
  const map: Record<string, string> = {
    PENDING_APPROVAL: 'Pend. Aprobación',
    OPEN: 'Abierto / En Revisión',
    CONFIRMED: 'Confirmado',
    SHIPPED: 'En Tránsito',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
    REJECTED: 'Rechazado'
  }
  return map[status] || status
}

onMounted(fetchOrders)
</script>
