<template>
  <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="page-header mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-slate-800 tracking-tight">Catálogo de Productos 🛒</h2>
        <p class="text-sm text-slate-500 mt-1">Explora nuestra disponibilidad con tus precios especiales.</p>
      </div>
      
      <div class="flex items-center gap-3">
        <div class="relative">
          <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            v-model="search" 
            type="text" 
            placeholder="Buscar por SKU o nombre..." 
            class="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64 transition-all"
          />
        </div>
        <button 
          @click="showCart = true" 
          class="btn btn-primary relative flex items-center gap-2 group transition-all duration-300"
          :class="{ 'scale-110 shadow-indigo-200': animatingCart }"
        >
          <Icon 
            icon="mdi:cart-outline" 
            class="w-5 h-5 group-hover:scale-110 transition-transform" 
            :class="{ 'animate-pulse text-white': animatingCart }"
          />
          <span class="hidden sm:inline">Mi Carrito</span>
          <span v-if="cartItems.length" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white" :class="{ 'animate-bounce': !animatingCart, 'scale-125': animatingCart }">
            {{ cartItems.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Smart Basket Section -->
    <SmartBasket 
      v-if="selectedCategory === 'Todos' && !search" 
      @add="addToCart" 
      @add-all="addAllToCart" 
    />

    <!-- Filters -->
    <div class="flex flex-wrap gap-2 mb-8">
      <button 
        v-for="cat in categories" 
        :key="cat"
        @click="selectedCategory = cat"
        class="px-4 py-1.5 rounded-full text-xs font-bold transition-all border"
        :class="selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Products Grid -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="card p-4 animate-pulse">
        <div class="aspect-square bg-slate-100 rounded-xl mb-4"></div>
        <div class="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-slate-100 rounded w-1/2"></div>
      </div>
    </div>

    <div v-else-if="!filteredProducts.length" class="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
      <Icon icon="mdi:package-variant" class="w-20 h-20 text-slate-200 mx-auto mb-4" />
      <h3 class="text-xl font-bold text-slate-800">No encontramos productos</h3>
      <p class="text-slate-500 mt-2">Intenta ajustar tu búsqueda o filtros.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div 
        v-for="product in filteredProducts" 
        :key="product.id" 
        class="card group bg-white hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 border-slate-100 p-4"
      >
        <div class="aspect-square relative rounded-2xl overflow-hidden bg-slate-50 mb-4 border border-slate-50">
          <img 
            :src="product.imageUrl || 'https://placehold.co/400x400?text=Producto'" 
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          />
          <div class="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
             <button 
              @click="addToCart(product)"
              class="w-full btn btn-primary flex items-center justify-center gap-2 py-2 shadow-xl"
             >
                <Icon icon="mdi:plus-circle" class="w-5 h-5" />
                Añadir al Carrito
             </button>
          </div>
          <div v-if="product.brand" class="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black text-indigo-600 uppercase tracking-tighter shadow-sm">
            {{ product.brand }}
          </div>
        </div>
        
        <div class="space-y-1">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{{ product.sku }}</p>
          <h4 class="font-bold text-slate-800 leading-tight line-clamp-2 h-10">{{ product.name }}</h4>
        </div>
        
        <div class="mt-4 flex flex-col gap-3">
          <div class="flex items-end justify-between">
            <div>
              <p class="text-[10px] font-bold text-emerald-600 uppercase leading-none mb-1">Tu Precio Especial</p>
              <p class="text-xl font-black text-slate-900 tracking-tighter">
                {{ formatCurrency(product.price) }}
                <span class="text-[10px] text-slate-500 uppercase ml-0.5">{{ product.currency }}</span>
              </p>
            </div>
            <div class="text-[10px] font-bold text-slate-400">
              x {{ product.unit || 'UD' }}
            </div>
          </div>

          <!-- Stock Indicator -->
          <div 
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold shadow-sm"
            :class="product.stock > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'"
          >
            <Icon :icon="product.stock > 0 ? 'mdi:check-circle' : 'mdi:alert-circle'" class="w-3.5 h-3.5" />
            <span v-if="product.stock > 0">Disponible: {{ formatNumber(product.stock) }}</span>
            <span v-else>Agotado Temporalmente</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide-over Cart (Simple version) -->
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition duration-400 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-full opacity-0"
    >
      <div v-if="showCart" class="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-50 flex flex-col border-l border-slate-100">
        <div class="p-6 border-b border-slate-50 flex justify-between items-center">
           <h3 class="text-xl font-black text-slate-800 tracking-tight">Mi Carrito</h3>
           <button @click="showCart = false" class="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <Icon icon="mdi:close" class="w-6 h-6 text-slate-400" />
           </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
           <div v-if="!cartItems.length" class="text-center py-20">
              <Icon icon="mdi:cart-off" class="w-16 h-16 text-slate-100 mx-auto mb-4" />
              <p class="text-slate-500 font-bold">Tu carrito está vacío</p>
              <button @click="showCart = false" class="text-indigo-600 text-xs font-black uppercase mt-4 hover:underline">Explorar Catálogo</button>
           </div>
           
           <div v-else class="space-y-6">
              <div v-for="item in cartItems" :key="item.id" class="flex gap-4 group">
                 <div class="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                    <img :src="item.imageUrl" class="w-full h-full object-cover" />
                 </div>
                 <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-bold text-slate-400 uppercase truncate">{{ item.sku }}</p>
                    <h5 class="text-sm font-bold text-slate-800 truncate mb-1">{{ item.name }}</h5>
                    <div class="flex items-center gap-4">
                       <div class="flex items-center border border-slate-200 rounded-lg">
                          <button @click="updateQty(item.id, -1)" class="px-2 py-1 text-slate-400 hover:text-indigo-600">-</button>
                          <span class="text-xs font-black w-8 text-center">{{ item.quantity }}</span>
                          <button @click="updateQty(item.id, 1)" class="px-2 py-1 text-slate-400 hover:text-indigo-600">+</button>
                       </div>
                       <p class="text-sm font-black text-indigo-600">{{ formatCurrency(item.price * item.quantity) }}</p>
                    </div>
                 </div>
                 <button @click="removeFromCart(item.id)" class="text-slate-300 hover:text-red-500 transition-colors">
                    <Icon icon="mdi:trash-can-outline" class="w-5 h-5" />
                 </button>
              </div>
           </div>
        </div>

        <div v-if="cartItems.length" class="p-6 bg-slate-50 border-t border-slate-100">
           <div class="flex justify-between items-center mb-4">
              <span class="text-sm font-bold text-slate-500">Total Estimado</span>
              <span class="text-2xl font-black text-slate-900 tracking-tighter">{{ formatCurrency(cartTotal) }}</span>
           </div>
           <button 
             @click="submitOrder"
             :disabled="isSubmitting"
             class="w-full btn btn-primary py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
           >
              <Icon v-if="isSubmitting" icon="mdi:loading" class="animate-spin w-5 h-5" />
              {{ isSubmitting ? 'Procesando...' : 'Confirmar Pedido B2B' }}
           </button>
           <p class="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
             * Sujeto a aprobación según su límite de crédito disponible.
           </p>
        </div>
      </div>
    </Transition>

    <!-- Overlay -->
    <div v-if="showCart" @click="showCart = false" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-all"></div>

    <!-- Toast Notification -->
    <Transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="translate-y-20 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-400 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-20 opacity-0"
    >
      <div v-if="showToast" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl">
        <div class="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Icon icon="mdi:check-bold" class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Añadido con éxito</p>
          <p class="font-bold text-sm tracking-tight">{{ lastAddedItem }}</p>
        </div>
        <div class="ml-4 pl-4 border-l border-white/10">
          <button @click="showCart = true; showToast = false" class="text-xs font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors">Ver Carrito</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'
import SmartBasket from '../components/SmartBasket.vue'

const ui = useUiStore()

const products = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const selectedCategory = ref('Todos')
const showCart = ref(false)
const cartItems = ref<any[]>([])
const lastAddedItem = ref<string | null>(null)
const showToast = ref(false)
const animatingCart = ref(false)
const isSubmitting = ref(false)

const categories = computed(() => {
  const cats = ['Todos', ...new Set(products.value.map(p => p.category).filter(Boolean))]
  return cats
})

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.value.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'Todos' || p.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const cartTotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const fetchData = async () => {
  try {
    const { data } = await api.get('/portal/catalog')
    products.value = data.data
  } catch (err) {
    console.error('Error loading catalog:', err)
  } finally {
    loading.value = false
  }
}

const formatNumber = (num: number | string, decimals: number = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(Number(num))
}

const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(val))
}

const addToCart = (product: any) => {
  const existing = cartItems.value.find(i => i.id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    cartItems.value.push({ ...product, quantity: 1 })
  }
  
  // Feedback visual sin abrir el carrito
  lastAddedItem.value = product.name
  showToast.value = true
  animatingCart.value = true
  
  // Limpiar estados de animación
  setTimeout(() => { showToast.value = false }, 3000)
  setTimeout(() => { animatingCart.value = false }, 1000)
}

const updateQty = (id: string, delta: number) => {
  const item = cartItems.value.find(i => i.id === id)
  if (item) {
    item.quantity = Math.max(1, item.quantity + delta)
  }
}

const removeFromCart = (id: string) => {
  cartItems.value = cartItems.value.filter(i => i.id !== id)
}

const addAllToCart = (suggestions: any[]) => {
  suggestions.forEach(s => {
    const existing = cartItems.value.find(i => i.id === s.id)
    const qty = Math.ceil(s.suggestedQuantity || 1)
    if (existing) {
      existing.quantity = Math.max(existing.quantity, qty)
    } else {
      cartItems.value.push({ ...s, quantity: qty })
    }
  })
  showCart.value = true
  ui.alert('Smart Basket', `${suggestions.length} productos añadidos basándose en tus patrones de compra.`, 'success')
}

const submitOrder = async () => {
  if (!cartItems.value.length) return
  isSubmitting.value = true
  try {
    await api.post('/portal/orders', { items: cartItems.value, notes: '' })
    cartItems.value = []
    showCart.value = false
    ui.alert('Pedido Confirmado', 'Su pedido B2B se ha guardado correctamente. Puede ver el detalle en la pestaña de Órdenes.', 'success')
  } catch (err: any) {
    ui.alert('Error', err.response?.data?.error || 'No se pudo procesar el pedido.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(fetchData)
</script>

