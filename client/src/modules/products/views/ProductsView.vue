<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header & Actions -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
      <div>
        <h2 class="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          Catálogo de Productos
          <span v-if="!loading" class="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-200 shadow-sm animate-pulse-once">
            {{ formatNumber(totalProducts) }} artículos
          </span>
        </h2>
        <p class="text-sm text-slate-500 mt-2 max-w-xl leading-relaxed">
          Gestiona los productos disponibles para el portal B2B. Oculta temporalmente artículos para evitar pedidos de stock comprometido.
        </p>
      </div>

      <!-- Filters & Search -->
      <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        <!-- Status Filter -->
        <div class="w-full sm:w-48 bg-white/60 backdrop-blur-lg border border-white/80 rounded-2xl p-1 shadow-sm flex items-center">
          <button 
            @click="setStatusFilter('all')"
            class="flex-1 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300"
            :class="statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'"
          >
            Todos
          </button>
          <button 
            @click="setStatusFilter('visible')"
            class="flex-1 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300"
            :class="statusFilter === 'visible' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'"
          >
            Públicos
          </button>
          <button 
            @click="setStatusFilter('hidden')"
            class="flex-1 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300"
            :class="statusFilter === 'hidden' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'"
          >
            Ocultos
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative w-full sm:w-72 group">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <Icon icon="mdi:magnify" class="w-5 h-5" />
          </div>
          <input
            v-model="searchQuery"
            @input="onSearchInput"
            type="text"
            placeholder="Buscar por nombre, SKU o marca..."
            class="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-xl border border-white/90 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all"
          />
        </div>
      </div>
    </div>

    <!-- Product Grid -->
    <div class="relative min-h-[400px]">
      <!-- Loading State -->
      <div v-if="loading" class="absolute inset-0 z-20 flex items-center justify-center bg-transparent backdrop-blur-sm rounded-3xl">
        <div class="flex flex-col items-center">
          <Icon icon="mdi:loading" class="w-10 h-10 text-indigo-500 animate-spin" />
          <p class="text-sm font-bold text-indigo-600 mt-4 animate-pulse">Cargando inventario...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="products.length === 0" class="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-sm text-center px-4">
        <div class="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <Icon icon="mdi:package-variant-closed" class="w-12 h-12 text-indigo-200" />
        </div>
        <h3 class="text-xl font-bold text-slate-800">No se encontraron productos</h3>
        <p class="text-sm text-slate-500 mt-2 max-w-md">
          {{ searchQuery ? 'Intenta ajustar tus términos de búsqueda o filtros.' : 'El catálogo está vacío. Ejecuta la sincronización con el ERP para poblar el inventario.' }}
        </p>
        <button 
          v-if="searchQuery || statusFilter !== 'all'"
          @click="resetFilters"
          class="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all"
        >
          Limpiar Filtros
        </button>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        <div 
          v-for="product in products" 
          :key="product.id"
          class="group bg-white/70 backdrop-blur-xl border border-white/90 rounded-3xl p-4 flex flex-col shadow-[0_8px_30px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
          :class="!product.isVisible ? 'opacity-70 grayscale-[30%]' : ''"
        >
          <!-- Visibility Badge & Switch -->
          <div class="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
            <div 
              class="w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm border"
              :class="product.isVisible ? 'bg-emerald-500/10 border-emerald-200/50 text-emerald-600' : 'bg-slate-800/10 border-slate-300 text-slate-600'"
              :title="product.isVisible ? 'Público en Portal' : 'Oculto en Portal'"
            >
              <Icon :icon="product.isVisible ? 'mdi:eye-outline' : 'mdi:eye-off-outline'" class="w-3.5 h-3.5" />
            </div>

            <!-- iOS Edge Switch -->
            <button 
              @click="toggleVisibility(product)"
              class="relative w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none shadow-sm border border-white/20"
              :class="product.isVisible ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-slate-300 hover:bg-slate-400'"
            >
              <div class="absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm"
                   :class="product.isVisible ? 'left-[22px]' : 'left-[2px]'"></div>
            </button>
          </div>

          <!-- Image -->
          <div class="aspect-square bg-slate-50/50 rounded-2xl mb-4 overflow-hidden flex items-center justify-center relative p-2 shadow-inner border border-slate-100/50">
             <img 
               v-if="product.imageUrl" 
               :src="product.imageUrl" 
               :alt="product.name"
               class="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
             />
             <Icon v-else icon="mdi:camera-off" class="w-10 h-10 text-slate-300" />
          </div>

          <!-- Info -->
          <div class="flex flex-col flex-1">
            <h3 class="text-sm font-bold text-slate-800 leading-tight line-clamp-2 h-10 group-hover:text-indigo-700 transition-colors">
              {{ product.name }}
            </h3>
            
            <div class="flex items-center justify-between mt-2 mb-3">
              <span class="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded tracking-tighter truncate max-w-[60%]">
                {{ product.sku }}
              </span>
              <span class="text-[10px] text-indigo-500 font-bold uppercase tracking-wider truncate">
                {{ product.brand || product.category || '' }}
              </span>
            </div>

            <div class="mt-auto pt-3 border-t border-slate-100/80 flex flex-col gap-2">
              <div class="flex items-end justify-between">
                <div>
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Precio Base</p>
                  <div class="flex items-baseline gap-1">
                    <span class="text-[10px] font-bold text-slate-500">{{ getBaseCurrency(product) }}</span>
                    <p class="text-lg font-black text-slate-900 tracking-tighter flex items-center">{{ getBasePrice(product) }}</p>
                  </div>
                </div>

                <!-- Stock Badge -->
                <div 
                  class="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold shadow-sm"
                  :class="product.stock > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'"
                >
                  <Icon :icon="product.stock > 0 ? 'mdi:check-circle' : 'mdi:alert-circle'" class="w-3.5 h-3.5" />
                  <span v-if="product.stock > 0">{{ formatNumber(product.stock) }} UND</span>
                  <span v-else>Agotado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-4 bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl shadow-sm">
      <p class="text-xs font-medium text-slate-500">
        Mostrando <span class="font-bold text-slate-800">{{ products.length }}</span> de <span class="font-bold text-slate-800">{{ totalProducts }}</span> productos
      </p>
      
      <div class="flex items-center gap-2">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="w-8 h-8 flex items-center justify-center rounded-xl transition-colors disabled:opacity-30"
          :class="currentPage === 1 ? 'text-slate-400 bg-slate-50' : 'bg-white shadow-sm border border-slate-100 text-slate-700 hover:bg-slate-50 hover:text-indigo-600'"
        >
          <Icon icon="mdi:chevron-left" class="w-5 h-5" />
        </button>
        
        <div class="flex items-center gap-1">
          <span class="text-sm font-bold text-slate-700 bg-slate-100/80 px-3 py-1 rounded-lg">{{ currentPage }}</span>
          <span class="text-sm font-medium text-slate-400">/</span>
          <span class="text-sm font-medium text-slate-500">{{ totalPages }}</span>
        </div>

        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="w-8 h-8 flex items-center justify-center rounded-xl transition-colors disabled:opacity-30"
          :class="currentPage === totalPages ? 'text-slate-400 bg-slate-50' : 'bg-white shadow-sm border border-slate-100 text-slate-700 hover:bg-slate-50 hover:text-indigo-600'"
        >
          <Icon icon="mdi:chevron-right" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const formatNumber = (num: number, decimals: number = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

const auth = useAuthStore()
const products = ref<any[]>([])
const loading = ref(true)
const totalProducts = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const limit = ref(24)
const searchQuery = ref('')
const statusFilter = ref<'all' | 'visible' | 'hidden'>('all')

let searchTimeout: any = null

// Fetch logic
const fetchProducts = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/products', {
      params: {
        page: currentPage.value,
        limit: limit.value,
        search: searchQuery.value,
        status: statusFilter.value
      }
    })
    products.value = data.data
    totalProducts.value = data.meta.total
    totalPages.value = data.meta.totalPages
  } catch (error) {
    console.error('Error fetching products', error)
  } finally {
    loading.value = false
  }
}

// Handlers
const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchProducts()
  }, 500)
}

const setStatusFilter = (status: 'all' | 'visible' | 'hidden') => {
  statusFilter.value = status
  currentPage.value = 1
  fetchProducts()
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchProducts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  currentPage.value = 1
  fetchProducts()
}

const toggleVisibility = async (product: any) => {
  const previousState = product.isVisible
  product.isVisible = !previousState // Optimistic UI Update

  try {
    await api.patch(`/products/${product.id}/visibility`, {
      isVisible: product.isVisible
    })
  } catch (error) {
    // Revert on failure
    product.isVisible = previousState
    console.error('Failed to change visibility', error)
  }
}

// Formatters
const getBaseSnapshot = (product: any) => {
  if (!product.priceSnapshots || product.priceSnapshots.length === 0) return null
  return product.priceSnapshots[0]
}

const getBasePrice = (product: any) => {
  const snap = getBaseSnapshot(product)
  if (!snap) return '--'
  return formatNumber(Number(snap.price), 2)
}

const getBaseCurrency = (product: any) => {
  const snap = getBaseSnapshot(product)
  return snap ? snap.currency : ''
}

// Init
onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
</style>
