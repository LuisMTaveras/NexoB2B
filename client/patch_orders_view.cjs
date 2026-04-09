const fs = require('fs');
const file = 'src/modules/portal/views/OrdersView.vue';
let content = fs.readFileSync(file, 'utf8');

// Insert approval banners before <!-- Notes --> in expanded order section
const notesMarker = '                <!-- Notes -->';
const banners = `                <!-- Pending Approval Banner -->
                <div v-if="order.status === 'PENDING_APPROVAL'" class="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Icon icon="mdi:clock-alert-outline" class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p class="text-xs font-black text-amber-700 uppercase tracking-wide">Pendiente de Aprobación</p>
                    <p class="text-[11px] text-amber-600 mt-0.5">Este pedido está esperando la revisión de un administrador de tu empresa.</p>
                  </div>
                </div>
                <!-- Rejected Banner -->
                <div v-if="order.status === 'REJECTED'" class="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <Icon icon="mdi:close-circle" class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p class="text-xs font-black text-rose-700 uppercase tracking-wide">Pedido Rechazado</p>
                    <p class="text-[11px] text-rose-600 mt-0.5">{{ order.rejectedReason || 'Sin motivo especificado' }}</p>
                  </div>
                </div>
                <!-- Notes -->`;

// Replace old actions section with admin-aware version + reject modal
const oldActions = `                <!-- Actions -->
                 <div class="mt-6 flex justify-end gap-3">
                    <RouterLink 
                      :to="\`/portal/support?orderId=\${order.number}\`"
                      class="px-4 py-2 border border-slate-200 bg-white text-[var(--color-brand-600)] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
                    >
                      <Icon icon="mdi:ticket-outline" class="w-4 h-4" />
                      Reportar Problema
                    </RouterLink>

                    <button 
                      @click.stop="reorderOrder(order)"
                      :disabled="reordering === order.id"
                      class="px-4 py-2 bg-[var(--color-accent-600)] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                     <Icon :icon="reordering === order.id ? 'mdi:loading' : 'mdi:repeat'" :class="{'animate-spin': reordering === order.id}" class="w-4 h-4" />
                     {{ reordering === order.id ? 'Procesando...' : 'Repetir Pedido' }}
                    </button>
                 </div>
              </div>
           </Transition>

       </div>
    </div>
  </div>
</template>`;

const newActions = `                <!-- Actions -->
                 <div class="mt-6 flex flex-wrap justify-end gap-3">
                    <template v-if="isAdmin && order.status === 'PENDING_APPROVAL'">
                      <button
                        @click.stop="rejectOrder(order)"
                        class="px-4 py-2 border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-100 transition-all shadow-sm flex items-center gap-2"
                      >
                        <Icon icon="mdi:close-circle-outline" class="w-4 h-4" />
                        Rechazar
                      </button>
                      <button
                        @click.stop="approveOrder(order)"
                        :disabled="approving === order.id"
                        class="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                      >
                        <Icon :icon="approving === order.id ? 'mdi:loading' : 'mdi:check-circle'" :class="{'animate-spin': approving === order.id}" class="w-4 h-4" />
                        {{ approving === order.id ? 'Aprobando...' : 'Aprobar Pedido' }}
                      </button>
                    </template>

                    <RouterLink
                      :to="\`/portal/support?orderId=\${order.number}\`"
                      class="px-4 py-2 border border-slate-200 bg-white text-[var(--color-brand-600)] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
                    >
                      <Icon icon="mdi:ticket-outline" class="w-4 h-4" />
                      Reportar Problema
                    </RouterLink>

                    <button
                      v-if="order.status !== 'PENDING_APPROVAL'"
                      @click.stop="reorderOrder(order)"
                      :disabled="reordering === order.id"
                      class="px-4 py-2 bg-[var(--color-accent-600)] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      <Icon :icon="reordering === order.id ? 'mdi:loading' : 'mdi:repeat'" :class="{'animate-spin': reordering === order.id}" class="w-4 h-4" />
                      {{ reordering === order.id ? 'Procesando...' : 'Repetir Pedido' }}
                    </button>
                 </div>
              </div>
           </Transition>

       </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <Icon icon="mdi:close-circle" class="w-6 h-6" />
          </div>
          <div>
            <h4 class="font-black text-slate-900">Rechazar Pedido</h4>
            <p class="text-xs text-slate-500">{{ rejectTarget?.number }}</p>
          </div>
        </div>
        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Motivo del Rechazo</label>
        <textarea v-model="rejectReason"
          rows="3"
          class="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
          placeholder="Ej: Presupuesto pendiente de aprobación..."
        />
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showRejectModal = false" class="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">Cancelar</button>
          <button @click="confirmReject" :disabled="rejecting"
            class="px-5 py-2.5 bg-rose-600 text-white text-sm font-black rounded-2xl hover:bg-rose-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Icon v-if="rejecting" icon="mdi:loading" class="animate-spin w-4 h-4" />
            {{ rejecting ? 'Rechazando...' : 'Confirmar Rechazo' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>`;

if (!content.includes(notesMarker)) { console.error('notesMarker NOT FOUND'); process.exit(1); }
if (!content.includes(oldActions)) { console.error('oldActions NOT FOUND'); process.exit(1); }

content = content.replace(notesMarker, banners);
content = content.replace(oldActions, newActions);

fs.writeFileSync(file, content, 'utf8');
console.log('Done - banners and actions injected');
