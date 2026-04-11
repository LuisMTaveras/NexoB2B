import { ref, computed } from 'vue';
import api from '@/services/api';
import { useUiStore } from '@/stores/ui';
import type { Product, SmartBasketSuggestion } from '@/types/portal';

export function useCatalog() {
  const ui = useUiStore();
  
  const products = ref<Product[]>([]);
  const loading = ref(true);
  const search = ref('');
  const selectedCategory = ref('Todos');
  const showCart = ref(false);
  const cartItems = ref<(Product & { quantity: number })[]>([]);
  const lastAddedItem = ref<string | null>(null);
  const showToast = ref(false);
  const animatingCart = ref(false);
  const isSubmitting = ref(false);
  const checkoutConfig = ref<{ extendedFields: Record<string, any> }>({ extendedFields: {} });
  const extendedFields = ref<Record<string, any>>({});

  const categories = computed(() => {
    const cats = ['Todos', ...new Set(products.value.map(p => p.category).filter(Boolean))];
    return cats as string[];
  });

  const filteredProducts = computed(() => {
    return products.value.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.value.toLowerCase()) || 
                            p.sku.toLowerCase().includes(search.value.toLowerCase());
      const matchesCategory = selectedCategory.value === 'Todos' || p.category === selectedCategory.value;
      return matchesSearch && matchesCategory;
    });
  });

  const cartTotal = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  });

  const fetchData = async () => {
    loading.value = true;
    try {
      const { data } = await api.get('/portal/catalog');
      products.value = data.data;
    } catch (err) {
      console.error('Error loading catalog:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchCheckoutConfig = async () => {
    try {
      const { data } = await api.get('/portal/checkout-config');
      checkoutConfig.value = data.data;
      // Initialize extended fields with empty strings
      Object.keys(checkoutConfig.value.extendedFields).forEach(key => {
        extendedFields.value[key] = '';
      });
    } catch (err) {
      console.error('Error loading checkout config:', err);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cartItems.value.find(i => i.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      cartItems.value.push({ ...product, quantity: 1 });
    }
    
    lastAddedItem.value = product.name;
    showToast.value = true;
    animatingCart.value = true;
    
    setTimeout(() => { showToast.value = false; }, 3000);
    setTimeout(() => { animatingCart.value = false; }, 1000);
  };

  const updateQty = (id: string, delta: number) => {
    const item = cartItems.value.find(i => i.id === id);
    if (item) {
      item.quantity = Math.max(1, item.quantity + delta);
    }
  };

  const removeFromCart = (id: string) => {
    cartItems.value = cartItems.value.filter(i => i.id !== id);
  };

  const addAllToCart = (suggestions: SmartBasketSuggestion[]) => {
    suggestions.forEach(s => {
      const existing = cartItems.value.find(i => i.id === s.id);
      const qty = Math.ceil(s.suggestedQuantity || 1);
      if (existing) {
        existing.quantity = Math.max(existing.quantity, qty);
      } else {
        cartItems.value.push({ ...s, quantity: qty });
      }
    });
    showCart.value = true;
    ui.alert('Smart Basket', `${suggestions.length} productos añadidos basándose en tus patrones de compra.`, 'success');
  };

  const submitOrder = async () => {
    if (!cartItems.value.length) return;
    isSubmitting.value = true;
    try {
      await api.post('/portal/orders', { 
        items: cartItems.value, 
        extendedFields: extendedFields.value,
        notes: '' 
      });
      cartItems.value = [];
      showCart.value = false;
      ui.alert('Pedido Confirmado', 'Su pedido B2B se ha guardado correctamente.', 'success');
    } catch (err: any) {
      ui.alert('Error', err.response?.data?.error || 'No se pudo procesar el pedido.', 'error');
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    products, loading, search, selectedCategory, showCart, cartItems,
    lastAddedItem, showToast, animatingCart, isSubmitting,
    categories, filteredProducts, cartTotal,
    fetchData, fetchCheckoutConfig, addToCart, updateQty, removeFromCart, addAllToCart, submitOrder,
    checkoutConfig, extendedFields
  };
}
