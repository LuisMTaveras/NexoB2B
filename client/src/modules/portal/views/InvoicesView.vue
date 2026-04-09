<template>
  <div class="animate-in fade-in zoom-in-95 duration-500">
    <div class="page-header mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-slate-800 tracking-tight">Estado de Cuenta 📊</h2>
        <p class="text-sm text-slate-500 mt-1">Consulta tus facturas y el detalle de tus pagos.</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="btn btn-secondary flex items-center gap-2">
          <Icon icon="mdi:file-pdf-box" class="w-5 h-5 text-rose-500" />
          <span class="text-xs font-black uppercase">Descargar PDF</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="card p-5 bg-white border-slate-100 shadow-sm border-2 border-indigo-50">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Total</p>
        <p class="text-xl font-black text-slate-900 tracking-tighter">{{ formatCurrency(totalInvoiced) }}</p>
      </div>
      <div class="card p-5 bg-emerald-50/30 border-emerald-100 border shadow-sm">
        <p class="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Pagado</p>
        <p class="text-xl font-black text-emerald-700 tracking-tighter">{{ formatCurrency(totalPaid) }}</p>
      </div>
      <div class="card p-5 bg-rose-50/30 border-rose-100 border shadow-sm">
        <p class="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Pendiente</p>
        <p class="text-xl font-black text-rose-700 tracking-tighter">{{ formatCurrency(totalPending) }}</p>
      </div>
      <div class="card p-5 bg-slate-900 text-white border-none shadow-lg">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Limite de Crédito</p>
        <p class="text-xl font-black tracking-tighter">RD$ 500,000</p>
      </div>
    </div>

    <!-- Invoices Table -->
    <div class="card overflow-hidden bg-white border-slate-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Factura</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Monto</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Estado</th>
              <th class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <template v-if="loading">
              <tr v-for="n in 5" :key="n" class="animate-pulse">
                 <td colspan="5" class="px-6 py-4 h-12 bg-slate-50/50"></td>
              </tr>
            </template>
            <tr v-else-if="!invoices.length">
               <td colspan="5" class="px-6 py-12 text-center text-slate-400"> No se encontraron facturas. </td>
            </tr>
            <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-slate-50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                   <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon icon="mdi:file-document-outline" class="w-4 h-4" />
                   </div>
                   <span class="text-xs font-bold text-slate-900">{{ inv.number }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-xs text-slate-600">{{ formatDate(inv.date) }}</td>
              <td class="px-6 py-4 text-xs font-black text-slate-900 text-right">
                {{ formatCurrency(inv.total) }}
                <span class="text-[9px] text-slate-400 font-bold ml-1">{{ inv.currency }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter" :class="getStatusClass(inv.status)">
                  {{ translateStatus(inv.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                 <button class="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-colors border border-transparent hover:border-slate-200">
                    <Icon icon="mdi:download-outline" class="w-4 h-4" />
                 </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import api from '@/services/api'

const invoices = ref<any[]>([])
const loading = ref(true)

const totalInvoiced = computed(() => invoices.value.reduce((s, i) => s + Number(i.total), 0))
const totalPaid = computed(() => invoices.value.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.total), 0))
const totalPending = computed(() => invoices.value.filter(i => i.status !== 'PAID').reduce((s, i) => s + Number(i.total), 0))

const fetchData = async () => {
  try {
    const { data } = await api.get('/portal/invoices')
    invoices.value = data.data
  } catch (err) {
    console.error('Error loading invoices:', err)
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

const translateStatus = (status: string) => {
  const map: any = { PAID: 'Pagado', PENDING: 'Pendiente', OVERDUE: 'Vencida', CANCELLED: 'Anulada' }
  return map[status] || status
}

const getStatusClass = (status: string) => {
  const map: any = {
    PAID: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
    OVERDUE: 'bg-rose-100 text-rose-700 border border-rose-200',
    CANCELLED: 'bg-slate-100 text-slate-500 border border-slate-200'
  }
  return map[status] || 'bg-slate-50 text-slate-500'
}

onMounted(fetchData)
</script>

