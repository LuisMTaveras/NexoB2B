<template>
  <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="page-header mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-[var(--color-brand-900)] tracking-tight">Mis Pedidos</h2>
        <p class="text-sm font-bold text-[var(--color-brand-500)] mt-1">Sigue el estado de tus compras B2B en tiempo real.</p>
      </div>
      <button @click="fetchOrders" class="btn bg-white hover:bg-[var(--color-brand-50)] text-[var(--color-brand-600)] border border-[var(--color-brand-200)] shadow-sm px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
         <Icon icon="mdi:refresh" :class="{'animate-spin': loading}" />
         Actualizar
      </button>
    </div>

    <div v-if="loading" class="flex flex-col gap-4">
       <div v-for="i in 3" :key="i" class="h-24 bg-white/50 animate-pulse rounded-2xl border border-[var(--color-brand-100)]"></div>
    </div>

    <div v-else-if="!orders.length" class="card py-20 flex flex-col items-center text-center bg-white/80 backdrop-blur-xl border border-[var(--color-brand-100)] shadow-sm mt-8">
      <div class="w-20 h-20 rounded-full bg-[var(--color-brand-50)] flex items-center justify-center mb-6 border border-[var(--color-brand-100)]">
         <Icon icon="mdi:package-variant-closed" class="w-10 h-10 text-[var(--color-brand-300)]" />
      </div>
      <h3 class="text-lg font-black text-[var(--color-brand-900)]">Aún no hay pedidos</h3>
      <p class="text-[13px] font-medium text-[var(--color-brand-500)] max-w-sm mx-auto mt-2 mb-6">Tu historial está vacío. Visita nuestro catálogo para realizar tu primera orden corporativa.</p>
      <RouterLink to="/portal/catalog" class="btn bg-gradient-to-br from-[var(--color-accent-400)] to-[var(--color-accent-600)] text-white font-black px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform border border-[var(--color-accent-400)]/50">Explorar Catálogo</RouterLink>
    </div>

    <div v-else class="space-y-4">
       <div v-for="order in orders" :key="order.id" class="bg-white/80 backdrop-blur-xl rounded-2xl border border-[var(--color-brand-100)] shadow-sm overflow-hidden group hover:border-[var(--color-accent-200)] transition-all">
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
                            <th class="py-2 text-[10px] font-black text-[var(--color-brand-400)] uppercase tracking-widest border-b border-[var(--color-brand-100)]">Producto</th>
                            <th class="py-2 text-[10px] font-black text-[var(--color-brand-400)] uppercase tracking-widest border-b border-[var(--color-brand-100)] text-right">Cant.</th>
                            <th class="py-2 text-[10px] font-black text-[var(--color-brand-400)] uppercase tracking-widest border-b border-[var(--color-brand-100)] text-right">Precio Unit.</th>
                            <th class="py-2 text-[10px] font-black text-[var(--color-brand-400)] uppercase tracking-widest border-b border-[var(--color-brand-100)] text-right">Subtotal</th>
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
             </div>
          </Transition>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import api from '@/services/api'

const orders = ref<any[]>([])
const loading = ref(true)
const expandedOrder = ref<string | null>(null)

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

const toggleOrder = (id: string) => {
  expandedOrder.value = expandedOrder.value === id ? null : id
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateStr))
}

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(val))
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'OPEN': return 'mdi:cart-outline'
    case 'CONFIRMED': return 'mdi:check-circle-outline'
    case 'SHIPPED': return 'mdi:truck-fast-outline'
    case 'DELIVERED': return 'mdi:package-variant'
    case 'CANCELLED': return 'mdi:close-circle-outline'
    default: return 'mdi:file-document-outline'
  }
}

const getStatusIconClass = (status: string) => {
  switch (status) {
    case 'OPEN': return 'bg-blue-50 text-blue-500 border-blue-100'
    case 'CONFIRMED': return 'bg-emerald-50 text-emerald-500 border-emerald-100'
    case 'SHIPPED': return 'bg-purple-50 text-purple-500 border-purple-100'
    case 'DELIVERED': return 'bg-indigo-50 text-indigo-500 border-indigo-100'
    case 'CANCELLED': return 'bg-rose-50 text-rose-500 border-rose-100'
    default: return 'bg-slate-50 text-slate-500 border-slate-100'
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'OPEN': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'CONFIRMED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'SHIPPED': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'DELIVERED': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-200'
    default: return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const mapStatus = (status: string) => {
  const map: any = {
    OPEN: 'Abierto / En Revisión',
    CONFIRMED: 'Confirmado',
    SHIPPED: 'En Tránsito',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado'
  }
  return map[status] || status
}

onMounted(fetchOrders)
</script>
