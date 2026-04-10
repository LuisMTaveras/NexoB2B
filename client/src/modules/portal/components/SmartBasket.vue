<template>
  <div v-if="suggestions.length > 0" class="mb-12">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          Canasta Inteligente ✨
          <span class="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] rounded-full uppercase tracking-widest">Predicciones para hoy</span>
        </h3>
        <p class="text-xs text-slate-500 mt-1">Basado en tu frecuencia de compra, estos productos podrían faltarte pronto.</p>
      </div>
      <button 
        @click="addAllToCart" 
        class="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 flex items-center gap-1 group"
      >
        Añadir Todo al Carrito 
        <Icon icon="mdi:chevron-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>

    <div class="relative group/scroll">
      <div 
        ref="scrollContainer"
        class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
      >
        <div 
          v-for="item in suggestions" 
          :key="item.id"
          class="flex-shrink-0 w-[280px] snap-start"
        >
          <div class="card bg-white border-slate-100 p-4 hover:shadow-xl transition-all duration-300 group">
            <div class="flex gap-4">
              <div class="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 relative">
                <img :src="item.imageUrl || 'https://placehold.co/200x200?text=PRD'" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div 
                  class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  @click="$emit('add', item)"
                >
                  <Icon icon="mdi:plus-circle" class="w-8 h-8 text-white" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-1 mb-1">
                  <span 
                    class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter"
                    :class="urgencyClass(item.urgency)"
                  >
                    {{ item.urgency }}
                  </span>
                  <span 
                    class="text-[10px] font-bold"
                    :class="scoreClass(item.smartScore)"
                  >
                    Score: {{ item.smartScore }}%
                  </span>
                </div>
                <h4 class="text-sm font-bold text-slate-800 line-clamp-2 leading-tight h-8 mb-1">{{ item.name }}</h4>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-2">{{ item.sku }}</p>
                <p class="text-sm font-black text-indigo-600 tracking-tighter">
                  {{ formatCurrency(item.price) }}
                  <span class="text-[9px] text-slate-400 font-bold uppercase ml-1">/ {{ cleanUnit(item.unit || '') }}</span>
                </p>
                <div 
                  class="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[8px] font-bold shadow-sm"
                  :class="item.stock > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'"
                >
                  <Icon :icon="item.stock > 0 ? 'mdi:check-circle' : 'mdi:alert-circle'" class="w-2.5 h-2.5" />
                  <span>Stock: {{ formatNumber(item.stock) }}</span>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
              <div class="space-y-1">
                <div class="flex items-center gap-1">
                    <Icon icon="mdi:calendar-repeat" class="w-3 h-3 text-slate-400" />
                    <span class="text-[9px] font-bold text-slate-500">{{ item.patternText }}</span>
                </div>
                <div class="flex items-center gap-1">
                    <Icon icon="mdi:clock-outline" class="w-3 h-3 text-slate-400" />
                    <span class="text-[9px] text-slate-400">Última: {{ formatLastPurchase(item.lastPurchaseDate) }}</span>
                </div>
              </div>
              <div class="flex flex-col items-end">
                <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sugerido</span>
                <span class="text-sm font-black text-slate-900 leading-none">
                  {{ formatNumber(item.suggestedQuantity) }}
                </span>
              </div>
            </div>
            
            <button 
              @click="$emit('add', item)"
              class="mt-3 w-full py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:cart-plus" class="w-4 h-4" />
              Añadir sugerencia
            </button>
          </div>
        </div>
      </div>
      
      <!-- Gradient masks for scroll indication -->
      <div class="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-50/50 to-transparent pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity"></div>
      <div class="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-50/50 to-transparent pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import api from '@/services/api'
import type { SmartBasketSuggestion } from '@/types/portal'

// Recomended products provided by the Smart Basket API


const emit = defineEmits(['add', 'addAll'])

const suggestions = ref<SmartBasketSuggestion[]>([])
const loading = ref(true)
const scrollContainer = ref<HTMLElement | null>(null)

const fetchData = async () => {
  try {
    const { data } = await api.get('/portal/smart-basket')
    suggestions.value = data.data
  } catch (err) {
    console.error('Error loading smart basket:', err)
  } finally {
    loading.value = false
  }
}

const urgencyClass = (urgency: string) => {
  switch (urgency) {
    case 'vencido': return 'bg-red-100 text-red-600 shadow-sm shadow-red-50'
    case 'proximo': return 'bg-amber-100 text-amber-600 shadow-sm shadow-amber-50'
    default: return 'bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-50'
  }
}

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(val))
}

const formatNumber = (num: number | string) => {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(Number(num))
}

const scoreClass = (score: number) => {
  if (score >= 80) return 'text-red-500'
  if (score >= 60) return 'text-amber-500'
  return 'text-emerald-500'
}

const cleanUnit = (unit: string) => {
  if (!unit) return 'UD'
  // Si contiene comas, es un string técnico (ej: furniture,sofa) -> Usar UD
  if (unit.includes(',')) return 'UD'
  return unit.toUpperCase()
}

const formatLastPurchase = (date: string) => {
  const d = new Date(date)
  const diff = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return `Hace ${diff} días`
}

const addAllToCart = () => {
  emit('addAll', suggestions.value)
}

onMounted(fetchData)
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
