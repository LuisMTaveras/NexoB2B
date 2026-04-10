<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 sm:px-0">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" @click="close"></div>
      
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95 duration-200">
        <!-- Search Input -->
        <div class="p-4 border-b border-slate-100 flex items-center gap-4">
          <Icon icon="mdi:magnify" class="w-6 h-6 text-slate-400" />
          <input 
            ref="inputRef"
            v-model="query" 
            type="text" 
            placeholder="Buscar productos, pedidos, facturas..." 
            class="flex-1 bg-transparent border-none text-lg focus:ring-0 placeholder-slate-400 font-medium"
            @keydown.esc="close"
          />
          <div class="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Esc
          </div>
        </div>

        <!-- Results -->
        <div class="max-h-[60vh] overflow-y-auto p-2">
          <div v-if="loading" class="p-8 text-center">
            <Icon icon="mdi:loading" class="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
            <p class="text-sm text-slate-500">Buscando en tu portal...</p>
          </div>

          <div v-else-if="!query" class="p-8 text-center">
            <p class="text-sm text-slate-400 font-medium">Escribe algo para comenzar a buscar</p>
            <div class="mt-4 flex flex-wrap justify-center gap-2">
               <span class="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-500 border border-slate-100"># Pedido</span>
               <span class="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-500 border border-slate-100">SKU</span>
               <span class="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-500 border border-slate-100">Nombre Producto</span>
            </div>
          </div>

          <div v-else-if="isEmpty" class="p-12 text-center">
             <Icon icon="mdi:search-off" class="w-12 h-12 text-slate-200 mx-auto mb-3" />
             <p class="text-slate-900 font-bold">No encontramos coincidencias</p>
             <p class="text-xs text-slate-500 mt-1">Intenta con otros términos o filtros</p>
          </div>

          <div v-else class="space-y-4 p-2">
            <!-- Products -->
            <div v-if="results.products?.length">
              <h3 class="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Productos</h3>
              <div class="space-y-1">
                <button 
                  v-for="p in results.products" :key="p.id"
                  @click="navigate('/portal/catalog', { search: p.name })"
                  class="w-full text-left p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                      <img v-if="p.imageUrl" :src="p.imageUrl" class="w-full h-full object-cover" />
                      <Icon v-else icon="mdi:package-variant" class="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{{ p.name }}</p>
                      <p class="text-[10px] font-mono text-slate-400 uppercase">{{ p.sku }}</p>
                    </div>
                  </div>
                  <Icon icon="mdi:chevron-right" class="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <!-- Orders -->
            <div v-if="results.orders?.length">
              <h3 class="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedidos</h3>
              <div class="space-y-1">
                <button 
                  v-for="o in results.orders" :key="o.id"
                  @click="navigate(`/portal/orders/${o.id}`)"
                  class="w-full text-left p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon icon="mdi:package-variant-closed" class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{{ o.number }}</p>
                      <p class="text-[10px] font-bold text-slate-400 uppercase">{{ formatDate(o.date) }} • {{ formatCurrency(o.total) }}</p>
                    </div>
                  </div>
                  <Icon icon="mdi:chevron-right" class="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <!-- Invoices -->
            <div v-if="results.invoices?.length">
              <h3 class="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Facturas</h3>
              <div class="space-y-1">
                <button 
                  v-for="i in results.invoices" :key="i.id"
                  @click="navigate('/portal/invoices', { search: i.number })"
                  class="w-full text-left p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Icon icon="mdi:file-document-outline" class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{{ i.number }}</p>
                      <p class="text-[10px] font-bold text-slate-400 uppercase">{{ formatDate(i.date) }} • {{ formatCurrency(i.total) }}</p>
                    </div>
                  </div>
                  <Icon icon="mdi:chevron-right" class="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
           <div class="flex gap-4">
              <div class="flex items-center gap-1.5">
                 <span class="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black shadow-xs">↑↓</span>
                 <span class="text-[9px] font-bold text-slate-400 uppercase">Navegar</span>
              </div>
              <div class="flex items-center gap-1.5">
                 <span class="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black shadow-xs">↵</span>
                 <span class="text-[9px] font-bold text-slate-400 uppercase">Seleccionar</span>
              </div>
           </div>
           <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Buscador Global NexoB2B</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useDebounceFn } from '@vueuse/core'
import type { Product, Order, Invoice } from '@/types/portal'

interface SearchResults {
  products: Product[];
  orders: Order[];
  invoices: Invoice[];
}

const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const isOpen = ref(false)
const query = ref('')
const loading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const results = ref<SearchResults>({
  products: [],
  orders: [],
  invoices: []
})

const isEmpty = computed(() => {
  return query.value && !results.value.products?.length && !results.value.orders?.length && !results.value.invoices?.length
})

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val) {
    query.value = ''
    results.value = { products: [], orders: [], invoices: [] }
    nextTick(() => inputRef.value?.focus())
  }
})

const close = () => {
  emit('update:modelValue', false)
}

const navigate = (path: string, queryParams?: Record<string, string>) => {
  close()
  router.push({ path, query: queryParams })
}

const performSearch = useDebounceFn(async (q: string) => {
  if (!q || q.length < 2) {
    results.value = { products: [], orders: [], invoices: [] }
    return
  }
  
  loading.value = true
  try {
    const { data } = await api.get('/portal/search', { params: { q } })
    results.value = data.data
  } catch (err) {
    console.error('Search error:', err)
  } finally {
    loading.value = false
  }
}, 300)

watch(query, (val) => performSearch(val))

// Hotkeys
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    emit('update:modelValue', true)
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>
