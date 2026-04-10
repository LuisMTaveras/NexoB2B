<template>
  <div class="animate-in fade-in duration-700">
    <div class="page-header mb-8">
      <div>
        <h2 class="page-title text-2xl font-bold text-brand-900 tracking-tight flex items-center gap-3">
          <div class="p-2 rounded-lg bg-indigo-100 text-indigo-600">
            <Icon icon="mdi:account-badge-outline" class="w-7 h-7" />
          </div>
          Gestión de Clientes B2B
        </h2>
        <p class="page-subtitle text-sm text-[var(--color-brand-600)] mt-1">
          Controla el acceso al portal, gestiona delegados y sincroniza cuentas corporativas.
        </p>
      </div>
      <div class="flex gap-3">
         <button class="btn border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm" @click="loadCustomers">
            <Icon icon="mdi:refresh" :class="{ 'animate-spin': loading }" />
         </button>
          <button class="btn btn-primary shadow-lg shadow-indigo-200" @click="syncCustomers" :disabled="syncing">
            <Icon icon="mdi:sync" :class="{ 'animate-spin': syncing }" />
            {{ syncing ? 'Sincronizando...' : 'Sincronizar ERP' }}
          </button>
          <button class="btn bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm flex items-center gap-2" @click="exportCustomers" :disabled="exporting">
            <Icon icon="mdi:file-export-outline" class="w-5 h-5" />
            {{ exporting ? 'Generando...' : 'Exportar' }}
          </button>
      </div>
    </div>

    <!-- Stats Bar (Premium Cards) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div class="card p-6 bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        <div class="relative z-10 flex items-center gap-5">
          <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <Icon icon="mdi:account-group" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Total Clientes</p>
            <p class="text-2xl font-black text-slate-900 leading-tight">{{ customers.length }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6 bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        <div class="relative z-10 flex items-center gap-5">
          <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
            <Icon icon="mdi:check-decagram" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Cuentas Activas</p>
            <p class="text-2xl font-black text-slate-900 leading-tight">{{ customers.filter(c => c.status === 'ACTIVE').length }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6 bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        <div class="relative z-10 flex items-center gap-5">
          <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200">
            <Icon icon="mdi:key-variant" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Accesos Portal</p>
            <p class="text-2xl font-black text-slate-900 leading-tight">{{ customers.filter(c => c._count?.users > 0).length }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-8 items-start">
      <!-- Main List Container -->
      <div class="flex-1 min-w-0">
        <div class="card p-2 mb-6 bg-white border-slate-100 shadow-sm flex items-center gap-2">
          <div class="flex-1 relative">
            <Icon icon="mdi:magnify" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input v-model="search" class="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-sm font-medium" placeholder="Filtrar por nombre, RNC o código ERP..." />
          </div>
          <div class="h-8 w-px bg-slate-100 mx-2"></div>
          <p class="px-4 text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{{ filteredCustomers.length }} resultados</p>
        </div>

        <!-- Skeletons -->
        <div v-if="loading" class="grid grid-cols-1 gap-3">
          <div v-for="i in 8" :key="'skel'+i" class="card p-5 bg-white border border-slate-100 flex items-center gap-5 animate-pulse">
            <div class="w-14 h-14 rounded-2xl bg-slate-100 shrink-0"></div>
            <div class="flex-1 space-y-3">
               <div class="flex items-center gap-3">
                 <div class="h-4 bg-slate-200 rounded w-1/3"></div>
                 <div class="h-3 bg-slate-100/60 rounded w-1/6"></div>
               </div>
               <div class="flex items-center gap-4">
                 <div class="h-3 bg-slate-100/60 rounded w-1/4"></div>
                 <div class="h-3 bg-slate-100/60 rounded w-1/4"></div>
               </div>
            </div>
            <div class="w-20 h-6 bg-slate-100 rounded-lg"></div>
          </div>
        </div>

        <div v-else-if="filteredCustomers.length === 0" class="card py-24 flex flex-col items-center text-center bg-white border-dashed border-2 border-slate-200">
            <div class="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
              <Icon icon="mdi:account-search-outline" class="w-10 h-10 text-slate-200" />
            </div>
            <p class="text-base font-bold text-slate-900">No se encontraron clientes</p>
            <p class="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Prueba con otros términos de búsqueda o realiza una nueva sincronización con el ERP.</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-3">
            <div 
              v-for="c in displayedCustomers" 
              :key="c.id"
              class="card p-5 bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group flex items-center gap-5"
              :class="{ 'border-indigo-500 ring-2 ring-indigo-50 bg-indigo-50/20': selectedId === c.id }"
              @click="selectCustomer(c)"
            >
              <div class="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                {{ c.name.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  <h4 class="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{{ c.name }}</h4>
                  <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">
                    {{ c.externalId || 'S/ID' }}
                  </div>
                </div>
                <div class="flex items-center gap-4 mt-2">
                  <div class="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Icon icon="mdi:card-account-details-outline" class="w-4 h-4 text-slate-300" />
                    {{ c.taxId || 'RNC no registrado' }}
                  </div>
                  <div class="w-1 h-1 rounded-full bg-slate-200"></div>
                  <div class="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Icon icon="mdi:clock-outline" class="w-3.5 h-3.5 text-slate-300" />
                    Sinc: {{ formatShortTime(c.syncedAt) }}
                  </div>
                </div>
              </div>
              <div class="text-right flex flex-col items-end gap-1">
                 <div class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100" v-if="c._count?.users > 0">
                    <Icon icon="mdi:account-key" class="w-4 h-4" />
                    <span class="text-[11px] font-bold">{{ c._count?.users }} Portal</span>
                 </div>
                 <div class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 text-slate-400 border border-slate-100" v-else>
                    <Icon icon="mdi:account-off-outline" class="w-4 h-4" />
                    <span class="text-[11px] font-bold">Sin acceso</span>
                 </div>
              </div>
            </div>
            <!-- Infinite Scroll Sentinel -->
            <div ref="sentinelRef" class="h-8 w-full"></div>
        </div>
      </div>

      <!-- Detail Panel (Advanced View) -->
      <!-- Detail Panel (Advanced View) -->
      <div class="w-[420px] sticky top-24 shrink-0">
        <div v-if="!selectedCustomer" class="card py-32 px-10 border-dashed border-2 bg-slate-50/30 flex flex-col items-center text-center rounded-3xl">
          <div class="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6 text-slate-200">
             <Icon icon="mdi:identifier" class="w-10 h-10" />
          </div>
          <h5 class="text-sm font-bold text-slate-900 uppercase tracking-widest">Centro de Control</h5>
          <p class="text-xs text-slate-400 mt-3 leading-relaxed">Selecciona una cuenta de cliente para gestionar sus permisos de portal, invitar delegados y ver el estado de sincronización.</p>
        </div>

        <div v-else class="bg-white/80 backdrop-blur-xl border border-white/80 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.1)] rounded-3xl overflow-hidden animate-in slide-in-from-right-8 duration-500 relative">
           <!-- Decorative glow -->
           <div class="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none"></div>
           
           <!-- Header Detail -->
           <div class="p-8 pb-6 border-b border-slate-100/50 relative">
              <button @click="selectedCustomer = null; selectedId = ''" class="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <Icon icon="mdi:close" class="w-4 h-4" />
              </button>
              <div class="flex items-center gap-5 mb-2">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-50 shrink-0">
                  {{ selectedCustomer.name.charAt(0) }}
                </div>
                <div class="min-w-0 pr-4">
                  <h3 class="font-bold text-xl text-[var(--color-brand-900)] leading-tight tracking-tight truncate">{{ selectedCustomer.name }}</h3>
                  <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span class="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-indigo-100/50">{{ selectedCustomer.externalId || 'S/ID' }}</span>
                    <span class="text-[10px] text-[var(--color-brand-400)] font-medium">{{ selectedCustomer.taxId }}</span>
                  </div>
                </div>
              </div>
           </div>
           
           <div class="p-8 space-y-8 bg-gradient-to-b from-slate-50/30 to-transparent">
              <!-- Portal Users Management -->
              <div>
                <div class="flex flex-col gap-1 mb-5">
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs font-black uppercase tracking-[0.15em] text-[var(--color-brand-900)]">Delegados del Portal</h4>
                    <button @click="showInviteModal = true" class="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-600 hover:text-white transition-all">
                      <Icon icon="mdi:plus-circle" class="w-3.5 h-3.5" />
                      Invitar
                    </button>
                  </div>
                  <p class="text-[11px] text-[var(--color-brand-500)]">Usuarios autorizados para operaciones B2B.</p>
                </div>

                <div v-if="detailLoading" class="flex justify-center py-10">
                   <div class="w-8 h-8 rounded-full border-2 border-[var(--color-accent-100)] border-t-[var(--color-accent-600)] animate-spin"></div>
                </div>

                <div v-else-if="selectedFullData?.users?.length === 0" class="p-8 rounded-2xl bg-white/50 border border-[var(--color-brand-100)] text-center shadow-sm">
                   <div class="w-10 h-10 bg-white rounded-full shadow-sm border border-[var(--color-brand-50)] flex items-center justify-center mx-auto mb-3">
                      <Icon icon="mdi:account-outline text-[var(--color-brand-300)] w-5 h-5" />
                   </div>
                   <p class="text-[11px] font-bold text-[var(--color-brand-900)]">Sin delegados registrados</p>
                   <p class="text-[10px] text-[var(--color-brand-400)] mt-1 mb-3">Invita miembros para darles acceso.</p>
                   <button @click="showInviteModal = true" class="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-[var(--color-accent-700)] transition">Configurar Acceso</button>
                </div>

                <div v-else class="space-y-2.5">
                   <div v-for="user in selectedFullData.users" :key="user.id" 
                        class="p-3.5 rounded-2xl border flex items-center gap-4 transition-all group/userCard"
                        :class="user.status === 'INACTIVE' ? 'bg-slate-50/80 grayscale-[0.5] border-transparent' : 'bg-white border-slate-100/60 hover:shadow-[0_8px_20px_-12px_rgba(0,0,0,0.1)] hover:border-indigo-100'">
                      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase shrink-0 ring-4 ring-white shadow-sm">
                        {{ user.firstName[0] }}{{ user.lastName[0] }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                          <div class="flex items-center gap-2 pr-2">
                             <div v-if="isUserOnline(user.lastActiveAt)" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)] shrink-0" title="En línea"></div>
                             <p class="text-[13px] font-bold text-[var(--color-brand-900)] group-hover/userCard:text-indigo-600 transition-colors truncate leading-tight">{{ user.firstName }} {{ user.lastName }}</p>
                          </div>
                          <span class="shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border" :class="getUserStatusClass(user.status)">
                             {{ formatUserStatus(user.status) }}
                          </span>
                        </div>
                        <div class="flex items-center gap-1.5 mt-1">
                          <Icon icon="mdi:shield-account-outline" class="w-3 h-3 text-[var(--color-brand-400)]" />
                          <span class="text-[10px] font-bold text-[var(--color-brand-500)]">{{ user.role === 'ADMIN' ? 'Administrador' : 'Comprador' }}</span>
                          <div class="w-1 h-1 rounded-full bg-slate-200 ml-1"></div>
                          <p class="text-[10px] text-[var(--color-brand-400)] truncate flex-1 ml-1">{{ user.email }}</p>
                        </div>
                      </div>
                      <div class="shrink-0 pl-1 border-l border-slate-100 h-8 flex items-center">
                         <button 
                           @click="toggleUserStatus(user)"
                           class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
                           :class="user.status === 'ACTIVE' ? 'hover:text-amber-500' : 'hover:text-emerald-500'"
                           :title="user.status === 'ACTIVE' ? 'Suspender acceso' : 'Habilitar acceso'"
                         >
                           <Icon :icon="user.status === 'ACTIVE' ? 'mdi:pause' : 'mdi:play'" class="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
              </div>

              <!-- Config & Advanced -->
              <div class="pt-6 border-t border-slate-100/50">
                  <h4 class="text-xs font-black uppercase tracking-[0.15em] text-[var(--color-brand-900)] mb-5">Configuración Global</h4>
                  
                  <div class="space-y-3">
                    <div class="p-4 rounded-2xl bg-white border border-slate-100/60 shadow-sm flex items-center justify-between group">
                       <div class="flex items-center gap-3">
                         <div class="p-2.5 rounded-xl bg-orange-50 text-orange-500"><Icon icon="mdi:ticket-percent-outline" class="w-5 h-5"/></div>
                         <div>
                            <p class="text-xs font-bold text-[var(--color-brand-900)]">Cupo de Usuarios</p>
                            <p class="text-[10px] text-[var(--color-brand-500)] mt-0.5">Límite de delegados portal</p>
                         </div>
                       </div>
                       <input v-model="selectedCustomer.maxUsers" type="number" class="w-16 text-center text-sm font-black py-1.5 focus:ring-2 focus:ring-orange-500/20 bg-slate-50 rounded-xl border border-slate-200" @change="updateCustomerSettings" />
                    </div>

                    <div class="p-4 rounded-2xl bg-white border border-slate-100/60 shadow-sm flex items-center justify-between group">
                       <div class="flex items-center gap-3">
                         <div class="p-2.5 rounded-xl transition-colors" :class="selectedCustomer.portalEnabled ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-[var(--color-brand-400)]'"><Icon icon="mdi:web" class="w-5 h-5" /></div>
                         <div>
                            <p class="text-xs font-bold text-[var(--color-brand-900)]">Acceso B2B</p>
                            <p class="text-[10px] text-[var(--color-brand-500)] mt-0.5">Habilitar portal</p>
                         </div>
                       </div>
                       <button 
                        @click="togglePortal"
                        class="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                        :class="selectedCustomer.portalEnabled ? 'bg-emerald-500' : 'bg-slate-200'"
                      >
                         <div class="absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm"
                              :class="selectedCustomer.portalEnabled ? 'left-[26px]' : 'left-[2px]'"></div>
                       </button>
                    </div>
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Modern Invite Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 sm:p-4">
       <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          <div class="px-8 py-10 bg-slate-900 text-white relative">
             <div class="flex items-center gap-4">
               <div class="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center">
                  <Icon icon="mdi:email-fast-outline" class="w-7 h-7" />
               </div>
               <div>
                  <h3 class="text-xl font-bold">Invitar Representante</h3>
                  <p class="text-white/50 text-xs mt-1">El usuario recibirá un correo para configurar su clave de acceso.</p>
               </div>
             </div>
             <button @click="showInviteModal = false" class="absolute top-8 right-8 text-white/40 hover:text-white transition-colors text-xl">✕</button>
          </div>
          
          <div class="p-10">
             <form @submit.prevent="inviteUser" class="space-y-6">
                <div class="grid grid-cols-2 gap-6">
                   <div class="relative">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Nombre</label>
                      <input v-model="inviteForm.firstName" class="input !rounded-2xl !bg-slate-50 !border-slate-100 focus:!bg-white" placeholder="Ej: Juan" required />
                   </div>
                   <div class="relative">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Apellido</label>
                      <input v-model="inviteForm.lastName" class="input !rounded-2xl !bg-slate-50 !border-slate-100 focus:!bg-white" placeholder="Ej: Pérez" required />
                   </div>
                </div>
                <div>
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Email Corporativo</label>
                   <input v-model="inviteForm.email" type="email" class="input !rounded-2xl !bg-slate-50 !border-slate-100 focus:!bg-white" placeholder="correo@cliente.com" required />
                </div>
                <div>
                   <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Rol Asignado</label>
                   <div class="grid grid-cols-2 gap-4">
                      <div 
                        @click="inviteForm.role = 'ADMIN'"
                        class="p-4 rounded-3xl border-2 cursor-pointer transition-all"
                        :class="inviteForm.role === 'ADMIN' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-300'"
                      >
                        <Icon icon="mdi:shield-account" class="w-6 h-6 mb-2" :class="inviteForm.role === 'ADMIN' ? 'text-indigo-600' : 'text-slate-300'" />
                        <p class="text-sm font-bold" :class="inviteForm.role === 'ADMIN' ? 'text-indigo-900' : 'text-slate-500'">Administrador</p>
                        <p class="text-[9px] text-slate-400 mt-1 leading-tight">Gestión total de compras y equipo.</p>
                      </div>
                      <div 
                        @click="inviteForm.role = 'BUYER'"
                        class="p-4 rounded-3xl border-2 cursor-pointer transition-all"
                        :class="inviteForm.role === 'BUYER' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-300'"
                      >
                        <Icon icon="mdi:cart-outline" class="w-6 h-6 mb-2" :class="inviteForm.role === 'BUYER' ? 'text-indigo-600' : 'text-slate-300'" />
                        <p class="text-sm font-bold" :class="inviteForm.role === 'BUYER' ? 'text-indigo-900' : 'text-slate-500'">Comprador</p>
                        <p class="text-[9px] text-slate-400 mt-1 leading-tight">Solo gestión de pedidos e inventario.</p>
                      </div>
                   </div>

                 <!-- Approval toggle: visible only for ADMIN -->
                 <Transition name="fade">
                   <div v-if="inviteForm.role === 'ADMIN'" class="p-4 rounded-2xl border-2 border-amber-100 bg-amber-50/50 flex items-center justify-between gap-4">
                     <div class="flex items-center gap-3">
                       <div class="p-2 rounded-xl bg-amber-100 text-amber-600">
                         <Icon icon="mdi:clipboard-check-outline" class="w-5 h-5" />
                       </div>
                       <div>
                         <p class="text-xs font-bold text-slate-800">Requiere aprobación de pedidos</p>
                         <p class="text-[10px] text-slate-500 mt-0.5">Si está activo, sus pedidos también pasarán por revisión antes de procesarse.</p>
                       </div>
                     </div>
                     <button
                       type="button"
                       @click="inviteForm.requiresApproval = !inviteForm.requiresApproval"
                       class="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 focus:outline-none"
                       :class="inviteForm.requiresApproval ? 'bg-amber-500' : 'bg-slate-200'"
                     >
                       <div class="absolute top-[2px] w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm"
                            :class="inviteForm.requiresApproval ? 'left-[26px]' : 'left-[2px]'"></div>
                     </button>
                   </div>
                 </Transition>
                </div>

                <div v-if="inviteError" class="p-4 bg-rose-50 text-rose-700 text-xs rounded-2xl border border-rose-100 animate-in shake duration-300 flex gap-3 items-center">
                   <Icon icon="mdi:alert-circle" class="w-5 h-5 shrink-0" />
                   {{ inviteError }}
                </div>

                <div class="flex justify-end gap-3 pt-4">
                   <button type="button" class="px-6 py-3 font-bold text-slate-400 hover:text-slate-900 transition-colors" @click="showInviteModal = false">Cancelar</button>
                   <button type="submit" class="btn btn-primary !rounded-2xl px-10 py-3 shadow-xl shadow-indigo-200" :disabled="inviting">
                      <Icon v-if="inviting" icon="mdi:loading" class="animate-spin" />
                      {{ inviting ? 'Procesando...' : 'Enviar Invitación' }}
                   </button>
                </div>
             </form>
          </div>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import api from '@/services/api'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const customers = ref<any[]>([])
const loading = ref(true)
const syncing = ref(false)
const search = ref('')
const selectedId = ref('')
const selectedCustomer = ref<any>(null)
const selectedFullData = ref<any>(null)
const detailLoading = ref(false)
const exporting = ref(false)

const showInviteModal = ref(false)
const inviting = ref(false)
const inviteError = ref('')
const inviteForm = reactive({
  email: '',
  firstName: '',
  lastName: '',
  role: 'BUYER',
  requiresApproval: false
})

const filteredCustomers = computed(() => {
  if (!search.value) return customers.value
  const s = search.value.toLowerCase()
  return customers.value.filter(c => 
    c.name.toLowerCase().includes(s) || 
    c.taxId?.includes(s) || 
    c.externalId?.toLowerCase().includes(s) ||
    c.internalCode?.toLowerCase().includes(s)
  )
})

// Client Side Lazy Loading
const displayLimit = ref(20)

const displayedCustomers = computed(() => {
  return filteredCustomers.value.slice(0, displayLimit.value)
})

watch(search, () => {
  displayLimit.value = 20
})

useInfiniteScroll(
  window,
  () => {
    if (!loading.value && displayLimit.value < filteredCustomers.value.length) {
      displayLimit.value += 20
    }
  },
  { distance: 600 }
)

async function loadCustomers() {
  loading.value = true
  try {
    const res = await api.get('/customers')
    customers.value = res.data.data
  } catch (error) {
    console.error('Failed to load customers')
  } finally {
    loading.value = false
  }
}

async function selectCustomer(c: any) {
  selectedId.value = c.id
  selectedCustomer.value = c
  detailLoading.value = true
  try {
    const res = await api.get(`/customers/${c.id}`)
    selectedFullData.value = res.data.data
  } catch (error) {
    console.error('Failed to load customer details')
  } finally {
    detailLoading.value = false
  }
}

async function inviteUser() {
  if (!selectedCustomer.value) return
  inviting.value = true
  inviteError.value = ''
  try {
    await api.post(`/customers/${selectedCustomer.value.id}/invite`, inviteForm)
    showInviteModal.value = false
    Object.assign(inviteForm, { email: '', firstName: '', lastName: '', role: 'BUYER', requiresApproval: false })
    // Refresh details
    selectCustomer(selectedCustomer.value)
    ui.alert('¡Éxito!', 'La invitación ha sido enviada correctamente.', 'success')
  } catch (error: any) {
    inviteError.value = error.response?.data?.error || 'Error al enviar la invitación'
  } finally {
    inviting.value = false
  }
}

async function syncCustomers() {
  syncing.value = true
  try {
    // Conceptual trigger - assuming there's an integration endpoint to sync customers
    // api.post('/integrations/sync/CUSTOMERS')
    ui.alert('Sincronización Iniciada', 'El proceso de sincronización con el ERP se está ejecutando.', 'info')
    setTimeout(loadCustomers, 2000)
  } catch {
    ui.alert('Error', 'No se pudo iniciar la sincronización.', 'error')
  } finally {
    syncing.value = false
  }
}

async function exportCustomers() {
  exporting.value = true
  try {
    const response = await api.get('/customers/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `clientes_nexob2b_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error exporting customers:', err)
    ui.alert('Error', 'No se pudo generar la exportación.', 'error')
  } finally {
    exporting.value = false
  }
}

async function updateCustomerSettings() {
  if (!selectedCustomer.value) return
  try {
    await api.patch(`/customers/${selectedCustomer.value.id}`, {
      maxUsers: selectedCustomer.value.maxUsers
    })
    ui.alert('Configuración guardada', 'Cupo de usuarios actualizado.', 'success')
  } catch {
    ui.alert('Error', 'No se pudo actualizar la configuración.', 'error')
  }
}

async function togglePortal() {
  if (!selectedCustomer.value) return
  const action = selectedCustomer.value.portalEnabled ? 'desactivar' : 'activar'
  const confirmed = await ui.confirm(
    '¿Cambiar estado del portal?',
    `Vas a ${action} el acceso total al portal para esta cuenta corporativa.`
  )
  if (!confirmed) return

  try {
    await api.patch(`/customers/${selectedCustomer.value.id}`, {
      portalEnabled: !selectedCustomer.value.portalEnabled
    })
    selectedCustomer.value.portalEnabled = !selectedCustomer.value.portalEnabled
    ui.alert('Estado Actualizado', `Portal ${action}ado exitosamente.`, 'success')
  } catch {
    ui.alert('Error', 'No se pudo cambiar el estado.', 'error')
  }
}

async function toggleUserStatus(user: any) {
  const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  const actionMsg = newStatus === 'ACTIVE' ? 'activar' : 'suspender'
  
  const confirmed = await ui.confirm(
    `${actionMsg.charAt(0).toUpperCase() + actionMsg.slice(1)} acceso?`,
    `¿Estás seguro de que deseas ${actionMsg} el acceso al portal para ${user.firstName}?`
  )
  if (!confirmed) return

  try {
    await api.patch(`/customers/users/${user.id}/status`, { status: newStatus })
    user.status = newStatus
    ui.alert('Usuario actualizado', `El acceso ha sido ${actionMsg}ado.`, 'success')
  } catch (e: any) {
    ui.alert('Error', e.response?.data?.error || 'No se pudo cambiar el estado del usuario.', 'error')
  }
}

function getUserStatusClass(status: string) {
  switch(status) {
    case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'INACTIVE': return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'INVITED': return 'bg-amber-50 text-amber-700 border-amber-200'
    default: return 'bg-slate-50 text-slate-500 border-slate-200'
  }
}

function formatUserStatus(status: string) {
  switch(status) {
    case 'ACTIVE': return 'Activo'
    case 'INACTIVE': return 'Inactivo'
    case 'INVITED': return 'Invitado'
    default: return status
  }
}

function isUserOnline(lastActiveAt: string | undefined) {
  if (!lastActiveAt) return false
  return (new Date().getTime() - new Date(lastActiveAt).getTime()) < 120000 // 2 minutes
}

function formatShortTime(d: string) {
  if (!d) return 'Pend'
  const date = new Date(d)
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

onMounted(() => {
  loadCustomers()
})
</script>

<style scoped>
.animate-in {
  animation-duration: 0.5s;
}
.shake {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
