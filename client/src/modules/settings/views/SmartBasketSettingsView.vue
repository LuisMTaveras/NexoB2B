<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-black text-slate-800 tracking-tight">Smart Basket 🧠</h2>
        <p class="text-sm text-slate-500 mt-1">Configura el algoritmo de predicción de pedidos para tus clientes.</p>
      </div>
      <div class="flex items-center gap-2">
        <span 
          class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
          :class="config.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'"
        >
          {{ config.isActive ? 'Activo' : 'Inactivo' }}
        </span>
        <button 
          @click="saveConfig" 
          :disabled="saving"
          class="btn btn-primary"
        >
          {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Config -->
      <div class="lg:col-span-2 space-y-6">
        <div class="card p-6 bg-white border-slate-100 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Icon icon="mdi:cog" class="w-5 h-5 text-indigo-500" />
            Parámetros del Algoritmo
          </h3>
          
          <div class="space-y-8">
            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p class="font-bold text-slate-800">Estado del Módulo</p>
                <p class="text-xs text-slate-500">Activa o desactiva las sugerencias en el portal.</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="config.isActive" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-black text-slate-500 uppercase tracking-widest">Ventana de Historial (Días)</label>
                <select v-model.number="config.historyWindow" class="w-full bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 p-3">
                  <option :value="90">90 Días (3 meses)</option>
                  <option :value="120">120 Días (4 meses)</option>
                  <option :value="180">180 Días (6 meses)</option>
                  <option :value="365">365 Días (1 año)</option>
                </select>
                <p class="text-[10px] text-slate-400 italic">Días de compras pasadas a analizar.</p>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-black text-slate-500 uppercase tracking-widest">Smart Score Mínimo (%)</label>
                <div class="flex items-center gap-4">
                  <input type="range" v-model.number="config.minScore" min="30" max="90" step="5" class="flex-1 accent-indigo-600" />
                  <span class="text-lg font-black text-indigo-600 w-12 text-right">{{ config.minScore }}%</span>
                </div>
                <p class="text-[10px] text-slate-400 italic">Solo se sugieren productos con score mayor a este.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div class="space-y-2">
                <label class="text-xs font-black text-slate-500 uppercase tracking-widest">Frecuencia de Actualización</label>
                <select v-model="config.frequency" class="w-full bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 p-3">
                  <option value="12h">Cada 12 horas</option>
                  <option value="24h">Cada 24 horas (Recomendado)</option>
                  <option value="48h">Cada 48 horas</option>
                  <option value="manual">Solo Manual</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-black text-slate-500 uppercase tracking-widest">Hora de Ejecución (Local)</label>
                <input type="time" v-model="config.executionHour" class="w-full bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 p-3" />
                <p class="text-[10px] text-slate-400 italic">Se recomienda ejecutar en horas de poco tráfico (madrugada).</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Logic Card -->
        <div class="card p-6 bg-indigo-900 border-none shadow-xl text-white overflow-hidden relative">
          <Icon icon="mdi:brain" class="absolute -right-4 -bottom-4 w-40 h-40 text-white/5 opacity-50" />
          <h3 class="text-lg font-bold mb-4 relative z-10">Lógica Smart Score</h3>
          <div class="space-y-4 relative z-10">
            <div class="flex gap-4">
               <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                 <Icon icon="mdi:clock-alert" class="w-6 h-6" />
               </div>
               <div>
                 <p class="text-sm font-bold">60% Urgencia</p>
                 <p class="text-[11px] text-indigo-200">Calculado comparando los días desde la última compra contra el intervalo promedio del cliente.</p>
               </div>
            </div>
            <div class="flex gap-4">
               <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                 <Icon icon="mdi:chart-bell-curve" class="w-6 h-6" />
               </div>
               <div>
                 <p class="text-sm font-bold">40% Consistencia</p>
                 <p class="text-[11px] text-indigo-200">Mide la variabilidad del intervalo de compra. A menor variabilidad, mayor score de predictibilidad.</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Execution Stats -->
      <div class="space-y-6">
        <div class="card p-6 bg-white border-slate-100 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-6">Estado de Ejecución</h3>
          
          <div class="space-y-4">
            <div class="p-4 rounded-2xl" :class="statusClass(config.lastRunStatus)">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] font-black uppercase tracking-widest opacity-70">Última Corrida</span>
                <span class="text-[10px] font-black uppercase tracking-widest">{{ config.lastRunStatus || 'NUNCA' }}</span>
              </div>
              <p class="text-sm font-black">{{ config.lastRunAt ? new Date(config.lastRunAt).toLocaleString() : '-' }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clientes</p>
                <p class="text-xl font-black text-slate-800">{{ config.processedCount || 0 }}</p>
              </div>
              <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Próxima</p>
                <p class="text-xs font-black text-slate-800">{{ config.nextRunAt ? new Date(config.nextRunAt).toLocaleTimeString() : 'Manual' }}</p>
              </div>
            </div>

            <div v-if="config.lastRunError" class="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold border border-red-100">
              <p class="mb-1 uppercase font-black">Error detectado:</p>
              {{ config.lastRunError }}
            </div>

            <button 
              @click="runManualJob" 
              :disabled="runningManual"
              class="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Icon v-if="runningManual" icon="mdi:loading" class="animate-spin w-5 h-5" />
              <Icon v-else icon="mdi:play" class="w-5 h-5" />
              Ejecutar Ahora
            </button>
          </div>
        </div>

        <div class="card p-6 bg-amber-50 border-amber-100 shadow-sm border">
          <h4 class="text-sm font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Icon icon="mdi:information" class="w-4 h-4" />
            Nota Importante
          </h4>
          <p class="text-xs text-amber-700 leading-relaxed">
            El algoritmo solo procesa pedidos con estado <strong>"ENTREGADO"</strong>. 
            Se requieren al menos 2 compras históricas de un producto para generar una sugerencia.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const saving = ref(false)
const runningManual = ref(false)
const config = ref<any>({
  isActive: false,
  frequency: '24h',
  executionHour: '02:00',
  historyWindow: 180,
  minScore: 50,
  lastRunStatus: null,
  lastRunAt: null,
  nextRunAt: null,
  processedCount: 0,
  lastRunError: null
})

const fetchData = async () => {
  try {
    const { data } = await api.get('/settings/smart-basket')
    if (data.success) {
      config.value = { ...config.value, ...data.data }
    }
  } catch (err) {
    console.error('Failed to load smart basket config:', err)
  }
}

const saveConfig = async () => {
  saving.value = true
  try {
    await api.post('/settings/smart-basket', config.value)
    ui.alert('Configuración Guardada', 'Los parámetros del Smart Basket han sido actualizados.', 'success')
  } catch (err) {
    ui.alert('Error', 'No se pudo guardar la configuración.', 'error')
  } finally {
    saving.value = false
  }
}

const runManualJob = async () => {
  runningManual.value = true
  try {
    await api.post('/settings/smart-basket/run')
    ui.alert('Trabajo Encolado', 'El proceso ha comenzado en segundo plano. Regrese pronto para ver los resultados.', 'info')
    // Set status to RUNNING locally for better UX
    config.value.lastRunStatus = 'RUNNING'
  } catch (err) {
    ui.alert('Error', 'No se pudo iniciar el proceso manual.', 'error')
  } finally {
    runningManual.value = false
  }
}

const statusClass = (status: string) => {
  switch (status) {
    case 'SUCCESS': return 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    case 'FAILED': return 'bg-red-50 text-red-700 border border-red-100'
    case 'RUNNING': return 'bg-indigo-50 text-indigo-700 border border-indigo-100'
    default: return 'bg-slate-50 text-slate-500 border border-slate-100'
  }
}

onMounted(fetchData)
</script>
