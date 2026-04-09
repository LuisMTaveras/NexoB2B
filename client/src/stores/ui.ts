import { defineStore } from 'pinia'
import { ref } from 'vue'

export type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm'

interface DialogOptions {
  title: string
  message: string
  type?: DialogType
  confirmText?: string
  cancelText?: string
}

export const useUiStore = defineStore('ui', () => {
  const isDialogOpen = ref(false)
  const dialogOptions = ref<DialogOptions>({
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar'
  })

  let resolveCallback: ((value: boolean) => void) | null = null

  function showDialog(options: DialogOptions): Promise<boolean> {
    isDialogOpen.value = true
    dialogOptions.value = {
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
      type: 'info',
      ...options
    }

    return new Promise((resolve) => {
      resolveCallback = resolve
    })
  }

  function confirmUI(title: string, message: string, options: Partial<DialogOptions> = {}): Promise<boolean> {
    return showDialog({
      title,
      message,
      type: 'confirm',
      confirmText: 'Confirmar',
      ...options
    })
  }

  function alertUI(title: string, message: string, type: DialogType = 'info'): Promise<boolean> {
    return showDialog({
      title,
      message,
      type,
      confirmText: 'Entendido'
    })
  }

  function handleConfirm() {
    isDialogOpen.value = false
    if (resolveCallback) resolveCallback(true)
  }

  function handleCancel() {
    isDialogOpen.value = false
    if (resolveCallback) resolveCallback(false)
  }

  return {
    isDialogOpen,
    dialogOptions,
    confirm: confirmUI,
    alert: alertUI,
    handleConfirm,
    handleCancel
  }
})
