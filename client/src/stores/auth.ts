import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string // This will now hold roleName
  type: 'internal' | 'customer'
  customerId?: string
  customerName?: string
  permissions?: string[]
}

export interface AuthCompany {
  id: string
  name: string
  slug: string
  logo?: string
  status: string
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const token = ref<string | null>(localStorage.getItem('nexob2b_token'))
  const user = ref<AuthUser | null>(null)
  const company = ref<AuthCompany | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const fullName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}` : '',
  )

  function setTokens(accessToken: string) {
    token.value = accessToken
    localStorage.setItem('nexob2b_token', accessToken)
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setTokens(data.data.accessToken)
      company.value = data.data.company
      
      // Map user with proper role string and granular permissions
      const userData = data.data.user
      user.value = {
        ...userData,
        role: userData.type === 'internal' ? (userData.role?.name || 'USER') : (userData.role || 'BUYER'),
        customerName: userData.customerName,
        permissions: userData.type === 'internal' 
          ? (userData.role?.permissions?.map((p: { permission: { code: string } }) => p.permission.code) || [])
          : []
      }
      
      const target = userData.type === 'internal' ? '/admin/dashboard' : '/portal/dashboard'
      router.push(target)
    } finally {
      loading.value = false
    }
  }

  async function register(payload: {
    companyName: string
    companySlug: string
    firstName: string
    lastName: string
    email: string
    password: string
  }) {
    loading.value = true
    try {
      const { data } = await api.post('/auth/register', payload)
      setTokens(data.data.accessToken)
      company.value = data.data.company
      
      // Map user with proper role string and granular permissions
      const userData = data.data.user
      user.value = {
        ...userData,
        role: userData.role?.name || 'ADMIN',
        permissions: userData.role?.permissions?.map((p: { permission: { code: string } }) => p.permission.code) || []
      }
      
      const target = userData.type === 'internal' ? '/admin/dashboard' : '/portal/dashboard'
      router.push(target)
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const { data } = await api.get('/auth/me')
      
      // Map user with proper role string and granular permissions
      const userData = data.data
      user.value = {
        ...userData,
        role: userData.type === 'internal' ? (userData.roleName || 'USER') : (userData.role || 'BUYER'),
        customerName: userData.customerName,
        permissions: userData.permissions || []
      }
      
      company.value = userData.company
    } catch {
      logout()
    }
  }

  async function logout() {
    try {
      if (token.value) {
        await api.post('/auth/logout')
      }
    } catch (err) {
      console.error('Logout sync failed', err)
    } finally {
      token.value = null
      user.value = null
      company.value = null
      localStorage.removeItem('nexob2b_token')
      
      // Direct redirect to clear SPA state entirely
      window.location.href = '/login'
    }
  }


  async function updateProfile(payload: { firstName: string; lastName: string; email: string }) {
    loading.value = true
    try {
      const { data } = await api.put('/auth/profile', payload)
      user.value = data.data
      return data.data
    } finally {
      loading.value = false
    }
  }

  async function changePassword(payload: { currentPassword: string; newPassword: string }) {
    loading.value = true
    try {
      await api.put('/auth/password', payload)
    } finally {
      loading.value = false
    }
  }

  /**
   * Universal Permission Checker (Frontend)
   * Super Admins (ADMIN role) always return true
   */
  function hasPermission(code: string): boolean {
    if (!user.value) return false
    
    // Internal God Mode Bypass
    if (user.value.type === 'internal' && user.value.role === 'ADMIN') return true
    
    // Customers (for now) don't have granular permissions
    if (user.value.type === 'customer') return true

    // Check atomic permission match
    return user.value.permissions?.includes(code) || false
  }

  return {
    token,
    user,
    company,
    loading,
    isAuthenticated,
    fullName,
    login,
    register,
    fetchMe,
    logout,
    updateProfile,
    changePassword,
    hasPermission,
  }
})
