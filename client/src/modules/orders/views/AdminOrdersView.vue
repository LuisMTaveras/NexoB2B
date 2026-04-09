<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-[var(--color-brand-900)] tracking-tight">Pedidos B2B</h2>
        <p class="text-[var(--color-brand-500)] font-medium mt-1">Gestión centralizada de órdenes y trazabilidad de usuarios.</p>
      </div>
      
      <div class="flex items-center gap-2">
        <div class="relative group">
          <Icon icon="mdi:magnify" class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-brand-400)] group-focus-within:text-[var(--color-accent-500)] transition-colors" />
          <input 
            v-model="search"
            placeholder="Buscar por cliente o # pedido..." 
            class="pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md border border-[var(--color-brand-200)] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[var(--color-accent-100)] focus:border-[var(--color-accent-400)] transition-all w-full md:w-80 shadow-sm"
          />
        </div>
      </div>
    </div>

    <!-- Filters & Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div v-for="stat in stats" :key="stat.label" class="bg-white/60 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <div :class="`p-2 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`">
            <Icon :icon="stat.icon" class="w-5 h-5" />
          </div>
          <span class="text-xs font-black uppercase tracking-widest text-[var(--color-brand-400)]">{{ stat.label }}</span>
        </div>
        <p class="text-2xl font-black text-[var(--color-brand-900)]">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-xl shadow-[var(--color-brand-900)]/[0.02] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-[var(--color-brand-100)] bg-[var(--color-brand-50)]/50">
              <th class="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-400)]">Pedido</th>
              <th class="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-400)]">Cliente / Empresa</th>
              <th class="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-400)]">Solicitado Por</th>
              <th class="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-400)]">Fecha</th>
              <th class="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-400)] text-right">Total</th>
              <th class="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-400)]">Estado</th>
              <th class="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-400)] text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-brand-100)]/50">
            <tr v-if="loading" v-for="i in 5" :key="i" class="animate-pulse">
              <td colspan="7" class="px-6 py-6"><div class="h-4 bg-[var(--color-brand-100)] rounded-full w-full"></div></td>
            </tr>
            <tr v-else-if="filteredOrders.length === 0" class="hover:bg-white/40 transition-colors">
              <td colspan="7" class="px-6 py-12 text-center">
                 <Icon icon="mdi:cart-off" class="w-12 h-12 mx-auto text-[var(--color-brand-200)] mb-4" />
                 <p class="text-[var(--color-brand-400)] font-medium">No se encontraron pedidos con estos filtros.</p>
              </td>
            </tr>
            <tr 
              v-else 
              v-for="order in filteredOrders" 
              :key="order.id"
              class="group hover:bg-white/80 transition-all duration-300"
            >
              <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[var(--color-accent-50)] text-[var(--color-accent-600)] flex items-center justify-center font-bold text-xs ring-1 ring-[var(--color-accent-100)]">
                    #
                  </div>
                  <div>
                    <p class="text-sm font-bold text-[var(--color-brand-900)]">{{ order.number }}</p>
                    <p class="text-[10px] text-[var(--color-brand-400)] font-medium uppercase tracking-tighter">{{ order.id.slice(-8) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5 text-sm">
                <p class="font-bold text-[var(--color-brand-800)]">{{ order.customer?.name }}</p>
                <p class="text-[11px] text-[var(--color-brand-500)] uppercase font-medium">{{ order.customer?.internalCode }}</p>
              </td>
              <td class="px-6 py-5 italic text-sm">
                <div v-if="order.submittedBy" class="flex flex-col">
                  <span class="font-bold text-indigo-700 not-italic">{{ order.submittedBy.firstName }} {{ order.submittedBy.lastName }}</span>
                  <span class="text-[10px] text-indigo-400 not-italic font-medium">{{ order.submittedBy.email }}</span>
                </div>
                <span v-else class="text-[var(--color-brand-300)]">ERP / Automatizada</span>
              </td>
              <td class="px-6 py-5 text-sm text-[var(--color-brand-600)] font-medium">
                {{ formatDate(order.date) }}
              </td>
              <td class="px-6 py-5 text-right font-black text-[var(--color-brand-900)]">
                {{ formatCurrency(order.total, order.currency) }}
              </td>
              <td class="px-6 py-5">
                <span :class="getStatusClass(order.status)" class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {{ order.status }}
                </span>
              </td>
              <td class="px-6 py-5">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="viewOrderDetails(order)"
                    class="p-2 rounded-xl text-[var(--color-brand-500)] hover:text-[var(--color-accent-600)] hover:bg-[var(--color-accent-50)] transition-all border border-transparent hover:border-[var(--color-accent-100)]"
                  >
                    <Icon icon="mdi:eye-outline" class="w-5 h-5" />
                  </button>
                  <button 
                    class="p-2 rounded-xl text-[var(--color-brand-500)] hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                  >
                    <Icon icon="mdi:sync" class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Details Modal Placeholder -->
    <div v-if="selectedOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
       <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="selectedOrder = null"></div>
       <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
          <div class="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div class="p-8">
             <div class="flex justify-between items-start mb-6">
                <div>
                  <h3 class="text-2xl font-black text-slate-900">Detalles del Pedido: {{ selectedOrder.number }}</h3>
                  <p class="text-sm text-slate-500 font-medium">Realizado por {{ selectedOrder.submittedBy?.firstName }} {{ selectedOrder.submittedBy?.lastName }}</p>
                </div>
                <button @click="selectedOrder = null" class="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                  <Icon icon="mdi:close" class="w-5 h-5" />
                </button>
             </div>

             <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div v-for="item in selectedOrder.items" :key="item.id" class="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <div>
                      <p class="font-bold text-slate-800">{{ item.name }}</p>
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ item.sku }}</p>
                   </div>
                   <div class="text-right">
                      <p class="font-black text-slate-900">{{ formatCurrency(item.total, selectedOrder.currency) }}</p>
                      <p class="text-[11px] font-bold text-slate-500">{{ item.quantity }} x {{ formatCurrency(item.unitPrice, selectedOrder.currency) }}</p>
                   </div>
                </div>
             </div>

             <div class="mt-8 pt-6 border-t border-slate-100 flex justify-between items-end">
                <div>
                   <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Notas del cliente</p>
                   <p class="text-sm italic text-slate-600">{{ selectedOrder.notes || 'Sin notas adicionales' }}</p>
                </div>
                <div class="text-right">
                   <p class="text-xs font-bold text-slate-500">Monto Total</p>
                   <p class="text-3xl font-black text-blue-600">{{ formatCurrency(selectedOrder.total, selectedOrder.currency) }}</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import api from '@/services/api'

const orders = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const selectedOrder = ref<any>(null)

const stats = computed(() => {
  const open = orders.value.filter(o => o.status === 'OPEN').length
  const totalVal = orders.value.reduce((sum, o) => sum + Number(o.total), 0)
  
  return [
    { label: 'Total Pedidos', value: orders.value.length, icon: 'mdi:cart-multiple', color: 'blue' },
    { label: 'Pendientes', value: open, icon: 'mdi:clock-alert-outline', color: 'amber' },
    { label: 'Valor Total', value: formatCurrency(totalVal, 'DOP'), icon: 'mdi:cash-multiple', color: 'green' },
    { label: 'Clientes Activos', value: new Set(orders.value.map(o => o.customerId)).size, icon: 'mdi:account-badge-outline', color: 'indigo' },
  ]
})

const filteredOrders = computed(() => {
  if (!search.value) return orders.value
  const q = search.value.toLowerCase()
  return orders.value.filter(o => 
    o.number.toLowerCase().includes(q) || 
    o.customer?.name.toLowerCase().includes(q) ||
    o.submittedBy?.firstName?.toLowerCase().includes(q)
  )

})

async function fetchOrders() {
  loading.value = true
  try {
    const res = await api.get('/orders')
    orders.value = res.data.data
  } catch (err) {
    console.error('Error fetching orders:', err)
  } finally {
    loading.value = false
  }
}

function viewOrderDetails(order: any) {
  selectedOrder.value = order
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-DO', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatCurrency(val: number | string, currency: string = 'DOP') {
  return new Intl.NumberFormat('es-DO', { 
    style: 'currency', 
    currency 
  }).format(Number(val))
}

function getStatusClass(status: string) {
  switch (status) {
    case 'OPEN':      return 'bg-amber-100 text-amber-700'
    case 'CONFIRMED': return 'bg-blue-100 text-blue-700'
    case 'SHIPPED':   return 'bg-indigo-100 text-indigo-700'
    case 'DELIVERED': return 'bg-green-100 text-green-700'
    case 'CANCELLED': return 'bg-red-100 text-red-700'
    default:          return 'bg-slate-100 text-slate-700'
  }
}

onMounted(fetchOrders)
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>
