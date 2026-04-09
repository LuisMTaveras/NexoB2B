<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-[var(--color-brand-900)] tracking-tight">Centro de Ayuda B2B</h2>
        <p class="text-[var(--color-brand-500)] font-medium mt-1">Gestión de consultas técnicas y comerciales.</p>
      </div>
      
      <button 
        v-if="!isInternal"
        @click="showCreateModal = true"
        class="px-6 py-3 bg-gradient-to-r from-[var(--color-accent-500)] to-[var(--color-accent-600)] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[var(--color-accent-500)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
      >
        <Icon icon="mdi:plus" class="w-5 h-5" />
        Abrir Nuevo Ticket
      </button>
    </div>

    <!-- Layout: List & Detail -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-250px)]">
      <!-- Ticket List -->
      <div class="lg:col-span-12 xl:col-span-12 bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-xl shadow-[var(--color-brand-900)]/[0.02] overflow-hidden flex flex-col">
        <div class="p-6 border-b border-[var(--color-brand-100)] flex items-center justify-between bg-[var(--color-brand-50)]/30">
           <h3 class="text-xs font-black uppercase tracking-widest text-[var(--color-brand-500)]">Tickets Recientes</h3>
           <div class="flex gap-2">
              <span class="badge badge-indigo text-[10px] font-bold">{{ tickets.length }} Total</span>
           </div>
        </div>
        
        <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
           <div v-if="loading" class="space-y-4">
              <div v-for="i in 3" :key="i" class="h-24 bg-white/40 rounded-3xl animate-pulse"></div>
           </div>
           
           <div v-else-if="tickets.length === 0" class="flex flex-col items-center justify-center h-full text-center">
              <div class="w-20 h-20 rounded-full bg-[var(--color-brand-50)] flex items-center justify-center mb-4">
                 <Icon icon="mdi:ticket-outline" class="w-10 h-10 text-[var(--color-brand-200)]" />
              </div>
              <p class="text-[var(--color-brand-400)] font-bold">No hay tickets abiertos actualmente.</p>
           </div>

           <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                v-for="ticket in tickets" 
                :key="ticket.id"
                @click="openTicket(ticket)"
                class="bg-white/80 border border-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:scale-[1.01] hover:border-[var(--color-accent-100)] transition-all cursor-pointer group"
              >
                 <div class="flex justify-between items-start mb-4">
                    <span :class="getStatusClass(ticket.status)" class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                       {{ ticket.status }}
                    </span>
                    <span :class="getPriorityClass(ticket.priority)" class="text-[9px] font-black uppercase tracking-widest opacity-60">
                       ● {{ ticket.priority }}
                    </span>
                 </div>
                 
                 <h4 class="font-bold text-[var(--color-brand-900)] line-clamp-2 mb-2 group-hover:text-[var(--color-accent-600)] transition-colors">
                    {{ ticket.subject }}
                 </h4>

                 <div>
                    <span v-if="ticket.category && ticket.category !== 'OTHER'" class="text-[9px] text-slate-500 font-bold uppercase tracking-widest border border-slate-200 bg-slate-50 inline-block px-2 py-1 rounded-md mr-2 mt-1 shadow-sm">
                       {{ ticket.category }}
                    </span>
                    <span v-if="ticket.relatedOrderId" class="text-[9px] text-indigo-600 font-bold uppercase tracking-widest border border-indigo-200 bg-indigo-50 inline-block px-2 py-1 rounded-md mt-1 shadow-sm">
                       🔗 PEDIDO
                    </span>
                 </div>

                 
                 <div v-if="isInternal" class="mb-4">
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-tighter">Cliente</p>
                    <p class="text-sm font-bold text-slate-700">{{ ticket.customer?.name }}</p>
                 </div>

                 <div class="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <div class="flex items-center gap-2">
                       <div class="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                          {{ ticket.raisedBy?.firstName?.[0] || '?' }}
                       </div>
                       <span class="text-[11px] text-slate-500 font-medium">{{ ticket.raisedBy?.firstName || 'Usuario' }}</span>
                    </div>
                    <span class="text-[10px] text-slate-400 font-medium">{{ formatDate(ticket.updatedAt) }}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Create Ticket Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
       <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showCreateModal = false"></div>
       <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-300">
          <div class="h-2 bg-[var(--color-accent-500)]"></div>
          <div class="p-8">
             <h3 class="text-2xl font-black text-slate-900 mb-2">Nuevo Ticket de Soporte</h3>
             <p class="text-sm text-slate-500 mb-6 font-medium">Describe tu inconveniente y te responderemos a la brevedad.</p>
             
             <div class="space-y-4">
                <div>
                   <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Asunto</label>
                   <input v-model="newTicket.subject" class="input" placeholder="Ej: Error en precio de SKU-123" />
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Prioridad</label>
                    <select v-model="newTicket.priority" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all">
                       <option value="LOW">Baja (Sin urgencia)</option>
                       <option value="MEDIUM">Normal</option>
                       <option value="HIGH">Alta (Afecta operaciones)</option>
                       <option value="URGENT">Urgente (Bloqueo Total)</option>
                    </select>
                 </div>
                 <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Categoría del Problema</label>
                    <select v-model="newTicket.category" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all">
                       <option value="ORDER_ISSUE">Problema con Pedido / Envío</option>
                       <option value="BILLING">Facturación y Pagos</option>
                       <option value="TECHNICAL">Fallo Técnico en Portal</option>
                       <option value="ACCOUNT">Gestión de Cuenta</option>
                       <option value="OTHER">Consulta General</option>
                    </select>
                 </div>
                 <div v-if="newTicket.category === 'ORDER_ISSUE' || newTicket.category === 'BILLING'">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">ID del Pedido o Factura Relacionada</label>
                    <input v-model="newTicket.relatedOrderId" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm mb-1 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all" placeholder="Ej: ORD-20260409-1234" />
                 </div>
                 <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Mensaje Detallado</label>
                    <textarea v-model="newTicket.body" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all min-h-[120px]" placeholder="Explica el problema..."></textarea>
                 </div>
             </div>
             
             <div class="mt-8 flex gap-3">
                <button @click="showCreateModal = false" class="flex-1 px-6 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button 
                  @click="createTicket"
                  :disabled="creating"
                  class="flex-1 px-6 py-3 bg-[var(--color-accent-600)] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {{ creating ? 'Enviando...' : 'Abrir Ticket' }}
                </button>
             </div>
          </div>
       </div>
    </div>

    <!-- Ticket Detail Modal -->
    <div v-if="selectedTicket" class="fixed inset-0 z-50 flex items-center justify-center p-4">
       <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" @click="selectedTicket = null"></div>
       <div class="bg-[#F8FAFC] rounded-[3rem] shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden relative flex flex-col animate-in slide-in-from-bottom-8 duration-500 border border-white/20">
          <!-- Chat Header -->
          <div class="p-8 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
             <div class="flex items-center gap-4">
                <div :class="getStatusClass(selectedTicket.status)" class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner">
                   <Icon icon="mdi:ticket-confirmation-outline" class="w-6 h-6" />
                </div>
                <div>
                   <h3 class="text-xl font-black text-slate-900">{{ selectedTicket.subject }}</h3>
                   <div class="flex items-center gap-3 mt-1">
                      <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID: {{ selectedTicket.id.slice(-8) }}</span>
                      <span class="text-slate-300">|</span>
                      <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado: {{ selectedTicket.status }}</span>
                   </div>
                </div>
             </div>
             <button @click="selectedTicket = null" class="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-all">
                <Icon icon="mdi:close" class="w-6 h-6 text-slate-400" />
             </button>
          </div>

          <!-- Messages Area -->
          <div class="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/50">
             <div v-for="msg in selectedTicket.messages" :key="msg.id" :class="msg.senderType === 'INTERNAL' ? 'flex flex-row' : 'flex flex-row-reverse'" class="gap-4">
                <div class="w-10 h-10 rounded-2xl shrink-0 shadow-sm border border-white flex items-center justify-center text-xs font-black" :class="msg.senderType === 'INTERNAL' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'">
                   {{ (msg.senderName || 'U')[0] }}
                </div>

                <div class="max-w-[70%] space-y-1 relative mt-[6px]">
                   <div :class="msg.senderType === 'INTERNAL' ? (msg.isInternal ? 'bg-orange-50 border-orange-200 text-orange-900 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border-dashed border-2' : 'bg-white border-slate-100 text-slate-800 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl') : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tl-2xl rounded-bl-2xl rounded-br-2xl'" class="p-4 shadow-sm border relative">
                      <div v-if="msg.isInternal" class="absolute -top-3 -right-2 bg-orange-100 text-orange-600 px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border border-orange-200 shadow-sm flex items-center gap-1 z-10"><Icon icon="mdi:lock-outline" /> NOTA PRIVADA</div>
                      <p class="text-[13px] font-medium leading-relaxed">{{ msg.body }}</p>
                   </div>
                   <div class="flex items-center gap-2 px-1" :class="msg.senderType === 'INTERNAL' ? 'justify-start' : 'justify-end'">
                      <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">{{ msg.senderName || 'Usuario' }}</span>
                      <span class="text-[9px] text-slate-300">•</span>
                      <span class="text-[9px] font-medium text-slate-400">{{ formatDate(msg.createdAt) }}</span>
                   </div>
                </div>
             </div>
          </div>

          <!-- Quick Actions for Admin -->
          <div v-if="isInternal" class="px-8 py-3 bg-white border-t border-slate-100 flex items-center justify-between gap-4 shrink-0 shadow-sm z-10">
             <div class="flex items-center gap-3">
                 <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado:</span>
                 <select :value="selectedTicket.status" @change="updateStatus(($event.target as any).value)" class="text-[11px] font-bold uppercase tracking-wider border border-slate-200 rounded-lg py-1.5 px-3 bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100">
                   <option v-for="s in ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED']" :key="s" :value="s">{{s.replace(/_/g, ' ')}}</option>
                 </select>
             </div>
             <div>
                 <button v-if="!selectedTicket.assignedTo" @click="assignToMe" class="text-[10px] font-bold tracking-widest uppercase bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg border border-indigo-100 flex items-center gap-2 transition-colors"><Icon icon="mdi:account-arrow-left-outline" class="w-4 h-4"/> Tomar Ticket</button>
                 <div v-else class="text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg">
                    <Icon icon="mdi:account-check" class="text-green-500 w-4 h-4" /> Asignado a {{selectedTicket.assignedTo.firstName}}
                 </div>
             </div>
          </div>

          <!-- Input Area -->
          <div class="p-8 bg-white border-t border-slate-100 shrink-0">
             <div v-if="isInternal" class="mb-4 flex items-center gap-2">
                <input type="checkbox" id="isInternalNote" v-model="isInternalReply" class="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 cursor-pointer">
                <label for="isInternalNote" class="text-xs font-bold text-orange-600 flex items-center gap-1.5 cursor-pointer uppercase tracking-widest"><Icon icon="mdi:lock" /> Enviar como Nota Interna Privada</label>
             </div>
             <div class="relative flex items-center gap-4">
                <textarea 
                  v-model="replyBody"
                  placeholder="Escribe tu respuesta aquí..." 
                  class="flex-1 bg-slate-50 border border-slate-200 rounded-[2rem] px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all resize-none h-16"
                  @keyup.enter.ctrl="sendReply"
                ></textarea>
                <button 
                  @click="sendReply"
                  :disabled="!replyBody.trim() || replying"
                  class="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                   <Icon icon="mdi:send" class="w-6 h-6" />
                </button>
             </div>
             <p class="text-[10px] text-slate-400 mt-3 ml-6 font-medium tracking-tight">Presiona <span class="font-bold">Ctrl + Enter</span> para enviar rápidamente.</p>
          </div>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth = useAuthStore()
const route = useRoute()
const isInternal = computed(() => auth.user?.type === 'internal')

const tickets = ref<any[]>([])
const loading = ref(true)
const selectedTicket = ref<any>(null)
const showCreateModal = ref(false)

const newTicket = ref({
   subject: '',
   body: '',
   priority: 'MEDIUM',
   category: 'OTHER',
   relatedOrderId: ''
})
const creating = ref(false)

const replyBody = ref('')
const replying = ref(false)
const isInternalReply = ref(false)

async function fetchTickets() {
  loading.value = true
  try {
    const res = await api.get('/support/tickets')
    tickets.value = res.data.data
  } catch (err) {
    console.error('Error fetching tickets:', err)
  } finally {
    loading.value = false
  }
}

async function openTicket(ticket: any) {
   try {
      const res = await api.get(`/support/tickets/${ticket.id}`)
      selectedTicket.value = res.data.data
   } catch (err) {
      console.error('Error opening ticket:', err)
   }
}

async function createTicket() {
   if (!newTicket.value.subject || !newTicket.value.body) return
   creating.value = true
   try {
      await api.post('/support/tickets', newTicket.value)
      showCreateModal.value = false
      newTicket.value = { subject: '', body: '', priority: 'MEDIUM', category: 'OTHER', relatedOrderId: '' }
      fetchTickets()
   } catch (err) {
      console.error('Error creating ticket:', err)
   } finally {
      creating.value = false
   }
}

async function sendReply() {
   if (!replyBody.value.trim() || !selectedTicket.value) return
   replying.value = true
   try {
      const payload: any = { body: replyBody.value }
      if (isInternal.value) {
         payload.isInternal = isInternalReply.value
      }
      const res = await api.post(`/support/tickets/${selectedTicket.value.id}/messages`, payload)
      selectedTicket.value.messages.push(res.data.data)
      replyBody.value = ''
      if (isInternal.value) isInternalReply.value = false
      // Scroll handling would happen here
   } catch (err) {
      console.error('Error sending reply:', err)
   } finally {
      replying.value = false
   }
}

async function updateStatus(status: string) {
   if (!selectedTicket.value) return
   try {
      await api.patch(`/support/tickets/${selectedTicket.value.id}/status`, { status })
      selectedTicket.value.status = status
      fetchTickets()
   } catch (err) {
      console.error('Error updating status:', err)
   }
}

async function assignToMe() {
   if (!selectedTicket.value) return
   try {
      await api.patch(`/support/tickets/${selectedTicket.value.id}/assign`, { assignedToId: auth.user!.id })
      selectedTicket.value.assignedTo = { firstName: auth.user!.firstName, lastName: auth.user!.lastName }
      fetchTickets() // refresh lists in background
   } catch (err) {
      console.error('Error assigning ticket:', err)
   }
}

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-DO', { 
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

function getStatusClass(status: string) {
  switch (status) {
    case 'OPEN':                return 'bg-blue-50 text-blue-600 border border-blue-100'
    case 'IN_PROGRESS':         return 'bg-amber-50 text-amber-600 border border-amber-100'
    case 'WAITING_ON_CUSTOMER': return 'bg-purple-50 text-purple-600 border border-purple-100'
    case 'ESCALATED':           return 'bg-red-50 text-red-600 border border-red-100'
    case 'RESOLVED':            return 'bg-green-50 text-green-600 border border-green-100'
    case 'CLOSED':              return 'bg-slate-100 text-slate-500 border border-slate-200'
    default:                    return 'bg-slate-100 text-slate-600'
  }
}

function getPriorityClass(p: string) {
  switch (p) {
    case 'URGENT': return 'text-red-600 font-black'
    case 'HIGH':   return 'text-orange-600'
    case 'MEDIUM': return 'text-blue-600'
    case 'LOW':    return 'text-slate-400'
    default:       return 'text-slate-400'
  }
}

onMounted(() => {
  fetchTickets()
  if (route.query.orderId) {
     newTicket.value.relatedOrderId = route.query.orderId as string
     newTicket.value.category = 'ORDER_ISSUE'
     showCreateModal.value = true
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}


</style>
