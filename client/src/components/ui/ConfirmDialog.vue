<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { Icon } from '@iconify/vue'

const ui = useUiStore()

const icons = {
  info: { icon: 'mdi:information-outline', color: 'text-blue-500', bg: 'bg-blue-50' },
  success: { icon: 'mdi:check-circle-outline', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  warning: { icon: 'mdi:alert-outline', color: 'text-amber-500', bg: 'bg-amber-50' },
  error: { icon: 'mdi:alert-circle-outline', color: 'text-rose-500', bg: 'bg-rose-50' },
  confirm: { icon: 'mdi:help-circle-outline', color: 'text-indigo-500', bg: 'bg-indigo-50' },
}

const config = computed(() => icons[ui.dialogOptions.type || 'info'])

import { computed } from 'vue'
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="ui.isDialogOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-4"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-4"
      >
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 ring-1 ring-black/5">
          <div class="p-8">
            <div class="flex flex-col items-center text-center">
              <!-- Icon Container -->
              <div :class="[config.bg, 'w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner']">
                <Icon :icon="config.icon" :class="[config.color, 'w-8 h-8']" />
              </div>
              
              <h3 class="text-xl font-black text-slate-800 tracking-tight mb-2">
                {{ ui.dialogOptions.title }}
              </h3>
              
              <p class="text-slate-500 text-sm leading-relaxed">
                {{ ui.dialogOptions.message }}
              </p>
            </div>
          </div>
          
          <div class="px-8 py-6 bg-slate-50/50 flex flex-col sm:flex-row gap-3 border-t border-slate-100">
            <button 
              v-if="ui.dialogOptions.type === 'confirm'"
              @click="ui.handleCancel"
              class="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              {{ ui.dialogOptions.cancelText }}
            </button>
            <button 
              @click="ui.handleConfirm"
              class="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-95"
              :class="[
                ui.dialogOptions.type === 'error' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : 
                ui.dialogOptions.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' :
                ui.dialogOptions.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' :
                'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              ]"
            >
              {{ ui.dialogOptions.confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
