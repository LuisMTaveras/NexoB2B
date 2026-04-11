<template>
  <div class="animate-in fade-in zoom-in-95 duration-500">
    <div class="page-header mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-slate-800 tracking-tight">Estado de Cuenta 📊</h2>
        <p class="text-sm text-slate-500 mt-1">Consulta tus facturas y el detalle de tus pagos.</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="fetchData" class="btn bg-white border-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-colors">
          <Icon icon="mdi:refresh" :class="{'animate-spin': loading}" />
          Actualizar
        </button>
        <button @click="exportCsv" class="btn bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <Icon icon="mdi:microsoft-excel" class="w-5 h-5" />
          <span class="text-xs font-black uppercase">Exportar CSV</span>
        </button>
        <button @click="downloadStatement" :disabled="generatingPdf" class="btn btn-secondary flex items-center gap-2">
          <Icon :icon="generatingPdf ? 'mdi:loading' : 'mdi:file-pdf-box'" :class="{'animate-spin': generatingPdf}" class="w-5 h-5 text-rose-500" />
          <span class="text-xs font-black uppercase">{{ generatingPdf ? 'Generando...' : 'Reporte Consolidado' }}</span>
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
        <p class="text-xl font-black tracking-tighter">{{ formatCurrency(creditLimit) }}</p>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="mb-4 flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
      <div class="relative flex-1 min-w-[180px]">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input v-model="search" type="text" placeholder="Buscar factura #..." 
               class="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 transition-all" />
      </div>
      <select v-model="statusFilter" class="pl-4 pr-10 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
        <option value="ALL">Todos los estados</option>
        <option value="PAID">Pagado</option>
        <option value="PENDING">Pendiente</option>
        <option value="OVERDUE">Vencida</option>
      </select>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-1 border border-slate-100">
          <Icon icon="mdi:calendar-start" class="w-4 h-4 text-slate-400" />
          <input v-model="dateFrom" type="date" class="text-xs font-bold text-slate-700 bg-transparent border-none outline-none w-[120px] cursor-pointer" />
        </div>
        <span class="text-[10px] font-black text-slate-300 uppercase">a</span>
        <div class="flex items-center gap-1.5 bg-slate-50 rounded-xl px-3 py-1 border border-slate-100">
          <Icon icon="mdi:calendar-end" class="w-4 h-4 text-slate-400" />
          <input v-model="dateTo" type="date" class="text-xs font-bold text-slate-700 bg-transparent border-none outline-none w-[120px] cursor-pointer" />
        </div>
      </div>
    </div>
    <!-- Date Presets -->
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <button v-for="preset in datePresets" :key="preset.key" @click="applyDatePreset(preset.key)"
        class="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all"
        :class="activePreset === preset.key ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'"
      >
        {{ preset.label }}
      </button>
      <button v-if="dateFrom || dateTo" @click="clearDateFilter" class="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100 transition-all flex items-center gap-1">
        <Icon icon="mdi:close" class="w-3 h-3" />
        Limpiar
      </button>
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
            <tr v-else-if="!filteredInvoices.length">
               <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                 <div class="flex flex-col items-center gap-2">
                   <Icon icon="mdi:file-search-outline" class="w-10 h-10 opacity-20" />
                   <p class="text-sm font-medium">No se encontraron facturas con estos filtros.</p>
                   <button @click="resetFilters" class="text-indigo-600 text-[11px] font-bold uppercase underline">Limpiar Filtros</button>
                 </div>
               </td>
            </tr>
            <tr v-for="inv in filteredInvoices" :key="inv.id" class="hover:bg-slate-50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                   <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center transition-colors group-hover:bg-indigo-100">
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
                 <button 
                  @click="downloadInvoice(inv)"
                  :disabled="downloading === inv.id"
                  class="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-colors border border-transparent hover:border-slate-200"
                  title="Descargar Factura"
                 >
                    <Icon :icon="downloading === inv.id ? 'mdi:loading' : 'mdi:download-outline'" :class="{'animate-spin': downloading === inv.id}" class="w-4 h-4" />
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
import { formatCurrency, formatDate } from '@/utils/formatters'
import type { Invoice } from '@/types/portal'

const invoices = ref<Invoice[]>([])
const loading = ref(true)
const creditLimit = ref(0)
const downloading = ref<string | null>(null)
const generatingPdf = ref(false)

// Filters
const search = ref('')
const statusFilter = ref('ALL')
const dateFrom = ref('')
const dateTo = ref('')
const activePreset = ref('')

const datePresets = [
  { key: 'today', label: 'Hoy' },
  { key: 'month', label: 'Este Mes' },
  { key: 'last30', label: 'Últ. 30 Días' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'all', label: 'Todo' },
]

const toDateStr = (d: Date) => d.toISOString().split('T')[0] || ''

const applyDatePreset = (key: string) => {
  activePreset.value = key
  const now = new Date()
  if (key === 'all') {
    dateFrom.value = ''
    dateTo.value = ''
    return
  }
  dateTo.value = toDateStr(now)
  if (key === 'today') {
    dateFrom.value = toDateStr(now)
  } else if (key === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    dateFrom.value = toDateStr(d)
  } else if (key === 'last30') {
    const d = new Date(); d.setDate(d.getDate() - 30)
    dateFrom.value = toDateStr(d)
  } else if (key === 'quarter') {
    const d = new Date(); d.setMonth(d.getMonth() - 3)
    dateFrom.value = toDateStr(d)
  }
}

const clearDateFilter = () => {
  dateFrom.value = ''
  dateTo.value = ''
  activePreset.value = ''
}

const resetFilters = () => {
  search.value = ''
  statusFilter.value = 'ALL'
  clearDateFilter()
}

const totalInvoiced = computed(() => invoices.value.reduce((s, i) => s + Number(i.total), 0))
const totalPaid = computed(() => invoices.value.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.total), 0))
const totalPending = computed(() => invoices.value.filter(i => i.status !== 'PAID').reduce((s, i) => s + Number(i.total), 0))

const filteredInvoices = computed(() => {
  return invoices.value.filter(inv => {
    // 1. Search
    const matchesSearch = !search.value || inv.number.toLowerCase().includes(search.value.toLowerCase())
    
    // 2. Status
    const matchesStatus = statusFilter.value === 'ALL' || inv.status === statusFilter.value
    
    // 3. Date Range
    let matchesDate = true
    const invDate = new Date(inv.date)
    if (dateFrom.value) {
      matchesDate = invDate >= new Date(dateFrom.value)
    }
    if (matchesDate && dateTo.value) {
      const endDate = new Date(dateTo.value)
      endDate.setHours(23, 59, 59, 999)
      matchesDate = invDate <= endDate
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })
})

const fetchData = async () => {
  try {
    loading.value = true
    const { data } = await api.get('/portal/invoices')
    invoices.value = data.data.invoices
    creditLimit.value = data.data.creditLimit
  } catch (err) {
    console.error('Error loading invoices:', err)
  } finally {
    loading.value = false
  }
}

const exportCsv = async () => {
  try {
    const response = await api.get('/portal/invoices/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Facturas_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error exporting CSV:', error)
    alert('No se pudo exportar el archivo CSV')
  }
}

const downloadStatement = async () => {
  if (generatingPdf.value) return
  generatingPdf.value = true
  try {
    const response = await api.get('/portal/invoices/statement', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Estado_Cuenta_${new Date().getTime()}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error downloading statement:', err)
    alert('No se pudo generar el reporte. Inténtalo de nuevo.')
  } finally {
    generatingPdf.value = false
  }
}

const downloadInvoice = async (inv: Invoice) => {
  if (downloading.value) return
  downloading.value = inv.id
  try {
    const response = await api.get(`/portal/invoices/${inv.id}/pdf`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Factura_${inv.number}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error downloading PDF:', err)
    alert('No se pudo generar el PDF. Inténtalo de nuevo.')
  } finally {
    downloading.value = null
  }
}

const translateStatus = (status: string) => {
  const map: Record<string, string> = { PAID: 'Pagado', PENDING: 'Pendiente', OVERDUE: 'Vencida', CANCELLED: 'Anulada' }
  return map[status] || status
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    PAID: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
    OVERDUE: 'bg-rose-100 text-rose-700 border border-rose-200',
    CANCELLED: 'bg-slate-100 text-slate-500 border border-slate-200'
  }
  return map[status] || 'bg-slate-50 text-slate-500'
}

onMounted(fetchData)
</script>

