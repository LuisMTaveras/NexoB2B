<template>
  <div>
    <div class="page-header mb-8">
      <div>
        <h2 class="page-title text-2xl font-bold text-brand-900 tracking-tight flex items-center gap-3">
          <div class="p-2 rounded-lg bg-indigo-100 text-indigo-600">
            <Icon icon="mdi:office-building-cog" class="w-7 h-7" />
          </div>
          Configuración de Empresa
        </h2>
        <p class="page-subtitle text-sm text-[var(--color-brand-600)] mt-1">
          Gestiona la identidad legal, contacto y branding visual de tu plataforma.
        </p>
      </div>
      <div v-if="hasChanges" class="animate-in fade-in slide-in-from-right-4 duration-300">
        <button @click="saveAll" :disabled="saving" class="btn btn-primary shadow-lg shadow-blue-200">
          <Icon v-if="saving" icon="mdi:loading" class="animate-spin w-5 h-5" />
          <Icon v-else icon="mdi:content-save-check" class="w-5 h-5" />
          {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Navegación Lateral / Pestañas -->
      <div class="lg:col-span-3">
        <div class="card p-2 space-y-1">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
            :class="activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'"
          >
            <Icon :icon="tab.icon" class="w-5 h-5" :class="activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'" />
            <span class="font-medium text-sm">{{ tab.label }}</span>
          </button>
        </div>

        <!-- Info Card (Visual Preview) -->
        <div class="mt-8 card bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none overflow-hidden relative group">
          <div class="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all"></div>
          <div class="relative z-10 flex flex-col items-center text-center p-4">
            <div class="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2 mb-4 flex items-center justify-center text-3xl font-bold">
              <img v-if="form.logo" :src="form.logo" class="w-full h-full object-contain rounded-lg" />
              <span v-else>{{ form.name?.charAt(0) || 'N' }}</span>
            </div>
            <h3 class="font-bold text-lg leading-tight">{{ form.name || 'Empresa Nueva' }}</h3>
            <p class="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">{{ form.taxId || 'RNC no definido' }}</p>
            
            <div class="mt-6 flex gap-2">
              <div class="w-6 h-6 rounded-full border border-white/20" :style="{ backgroundColor: branding.primaryColor }"></div>
              <div class="w-6 h-6 rounded-full border border-white/20" :style="{ backgroundColor: branding.secondaryColor }"></div>
            </div>
            <p class="text-[10px] text-slate-500 mt-4">Previsualización del branding</p>
          </div>
        </div>
      </div>

      <!-- Contenido Principal -->
      <div class="lg:col-span-9 space-y-8">
        <!-- PESTAÑA 1: PERFIL GENERAL -->
        <div v-if="activeTab === 'general'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="card space-y-8">
            <div class="flex flex-col md:flex-row gap-8 items-start">
              <!-- Logo Upload Section -->
              <div class="flex-shrink-0">
                <label class="label mb-3">Logo Corporativo</label>
                <div class="relative group">
                  <div class="w-40 h-40 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400">
                    <img v-if="form.logo" :src="form.logo" class="w-full h-full object-contain p-4" />
                    <div v-else class="text-center p-4">
                      <Icon icon="mdi:cloud-upload-outline" class="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Subir PNG/JPG</p>
                    </div>
                    <div class="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <button @click="triggerLogoUpload" class="btn btn-sm bg-white text-indigo-900 font-bold border-none">
                        Cambiar
                      </button>
                    </div>
                  </div>
                  <input ref="logoInput" type="file" class="hidden" accept="image/*" @change="handleLogoUpload" />
                </div>
              </div>

              <!-- General Fields -->
              <div class="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="label">Nombre de la Empresa</label>
                  <input v-model="form.name" type="text" class="input" placeholder="Nombre comercial..." />
                </div>
                <div>
                  <label class="label">RNC (Identificación Fiscal)</label>
                  <input v-model="form.taxId" type="text" class="input" placeholder="001-000000-0" />
                </div>
                <div>
                  <label class="label">Sitio Web</label>
                  <input v-model="form.website" type="text" class="input" placeholder="https://..." />
                </div>
                <div class="md:col-span-2">
                  <label class="label">Correo Corporativo</label>
                  <input v-model="form.corporateEmail" type="email" class="input" placeholder="info@empresa.com" />
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">Teléfono Principal</label>
                <input v-model="form.phone" type="text" class="input" placeholder="+1 809-000-0000" />
              </div>
              <div class="md:col-span-2">
                <label class="label">Dirección Física</label>
                <textarea v-model="form.address" class="input min-h-[80px]" placeholder="Av. Winston Churchill #123..."></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- PESTAÑA 2: BRANDING -->
        <div v-if="activeTab === 'branding'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="card space-y-8">
            <div>
              <h3 class="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Icon icon="mdi:palette-swatch" class="text-pink-500 w-6 h-6" />
                Estética del Portal
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-4">
                  <div>
                    <label class="label">Título del Portal B2B</label>
                    <input v-model="branding.portalTitle" type="text" class="input" placeholder="Ej: Portal de Clientes Nexo" />
                    <p class="text-[10px] text-slate-400 mt-1 italic">Este nombre aparecerá en la pestaña del navegador y emails.</p>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="label">Color Primario</label>
                      <div class="flex items-center gap-2">
                        <input v-model="branding.primaryColor" type="color" class="h-10 w-12 rounded border-none cursor-pointer" />
                        <input v-model="branding.primaryColor" type="text" class="input !py-1 text-xs uppercase" />
                      </div>
                    </div>
                    <div>
                      <label class="label">Color Secundario</label>
                      <div class="flex items-center gap-2">
                        <input v-model="branding.secondaryColor" type="color" class="h-10 w-12 rounded border-none cursor-pointer" />
                        <input v-model="branding.secondaryColor" type="text" class="input !py-1 text-xs uppercase" />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <h4 class="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Vista Previa Botones</h4>
                  <div class="space-y-4">
                    <button class="w-full py-2.5 rounded-lg text-white font-bold shadow-lg" :style="{ background: branding.primaryColor }">
                      Botón Primario
                    </button>
                    <button class="w-full py-2.5 rounded-lg text-white font-bold opacity-80" :style="{ background: branding.secondaryColor }">
                      Botón Secundario
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-slate-100">
              <label class="label flex items-center gap-2">
                <Icon icon="mdi:xml" class="text-slate-400" />
                CSS Personalizado (Avanzado)
              </label>
              <textarea v-model="branding.customCss" class="input font-mono text-xs min-h-[120px]" placeholder=".portal-header { background: linear-gradient(...); }"></textarea>
            </div>
          </div>
        </div>

        <!-- PESTAÑA 3: REDES SOCIALES -->
        <div v-if="activeTab === 'social'" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="card">
            <h3 class="font-bold text-slate-800 mb-6">Redes Sociales & Presencia</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-for="social in socialFields" :key="social.id">
                <label class="label flex items-center gap-2">
                  <Icon :icon="social.icon" :class="social.color" class="w-5 h-5" />
                  {{ social.label }}
                </label>
                <input v-model="form.socialLinks[social.id]" type="text" class="input" :placeholder="social.placeholder" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback UI -->
    <div v-if="notification" class="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div :class="notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'" class="px-6 py-3 rounded-2xl text-white shadow-2xl flex items-center gap-3">
        <Icon :icon="notification.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'" class="w-6 h-6" />
        <span class="font-medium">{{ notification.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const activeTab = ref('general')
const saving = ref(false)
const notification = ref<{ text: string, type: 'success' | 'error' } | null>(null)
const logoInput = ref<HTMLInputElement | null>(null)
const initialDataStr = ref('')
const hasChanges = ref(false)

const tabs = [
  { id: 'general', label: 'Datos Generales', icon: 'mdi:account-details-outline' },
  { id: 'branding', label: 'Imagen Visual', icon: 'mdi:palette-outline' },
  { id: 'social', label: 'Redes Sociales', icon: 'mdi:share-variant-outline' },
]

const socialFields = [
  { id: 'linkedin', label: 'LinkedIn', icon: 'mdi:linkedin', color: 'text-blue-600', placeholder: 'https://linkedin.com/company/...' },
  { id: 'instagram', label: 'Instagram', icon: 'mdi:instagram', color: 'text-pink-600', placeholder: 'https://instagram.com/...' },
  { id: 'facebook', label: 'Facebook', icon: 'mdi:facebook', color: 'text-blue-700', placeholder: 'https://facebook.com/...' },
  { id: 'twitter', label: 'Twitter / X', icon: 'mdi:twitter', color: 'text-slate-900', placeholder: 'https://twitter.com/...' },
]

const form = reactive({
  name: '',
  taxId: '',
  phone: '',
  website: '',
  address: '',
  logo: '',
  corporateEmail: '',
  socialLinks: {} as Record<string, string>,
})

const branding = reactive({
  primaryColor: '#0F172A',
  secondaryColor: '#3B82F6',
  portalTitle: '',
  logoUrl: '',
  faviconUrl: '',
  customCss: '',
})

const fetchData = async () => {
  try {
    const { data } = await api.get('/companies/me')
    const company = data.data
    
    // Fill main form
    form.name = company.name || ''
    form.taxId = company.taxId || ''
    form.phone = company.phone || ''
    form.website = company.website || ''
    form.address = company.address || ''
    form.logo = company.logo || ''
    form.corporateEmail = company.corporateEmail || ''
    form.socialLinks = company.socialLinks || {}

    // Fill branding
    if (company.branding) {
      branding.primaryColor = company.branding.primaryColor || '#0F172A'
      branding.secondaryColor = company.branding.secondaryColor || '#3B82F6'
      branding.portalTitle = company.branding.portalTitle || ''
      branding.logoUrl = company.branding.logoUrl || ''
      branding.faviconUrl = company.branding.faviconUrl || ''
      branding.customCss = company.branding.customCss || ''
    }

    initialDataStr.value = JSON.stringify({ ...form, ...branding })
    hasChanges.value = false
  } catch {
    showNotification('Error al cargar datos corporativos', 'error')
  }
}

// Watch for changes to show/hide save button
watch([form, branding], () => {
  const currentDataStr = JSON.stringify({ ...form, ...branding })
  hasChanges.value = currentDataStr !== initialDataStr.value
}, { deep: true })

const saveAll = async () => {
  saving.value = true
  try {
    // 1. Save general profile
    const { data: compData } = await api.patch('/companies/me', form)
    
    // 2. Save branding profile
    await api.patch('/companies/me/branding', branding)
    
    // Update auth store to reflect changes globally (like the sidebar logo)
    const auth = useAuthStore()
    if (auth.company) {
      auth.company = { ...auth.company, ...compData.data }
    }
    
    showNotification('Configuración guardada exitosamente', 'success')
    initialDataStr.value = JSON.stringify({ ...form, ...branding })
    hasChanges.value = false
  } catch (err: any) {
    const msg = err.response?.data?.error || 'Error al guardar'
    showNotification(msg, 'error')
  } finally {
    saving.value = false
  }
}

const showNotification = (text: string, type: 'success' | 'error') => {
  notification.value = { text, type }
  setTimeout(() => notification.value = null, 4000)
}

const triggerLogoUpload = () => {
  logoInput.value?.click()
}

const handleLogoUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const base64 = event.target?.result as string
    form.logo = base64
    branding.logoUrl = base64 // Sync for now
  }
  reader.readAsDataURL(file)
}

onMounted(fetchData)
</script>

<style scoped>
.animate-in {
  animation-duration: 0.5s;
}
</style>
