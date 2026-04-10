/**
 * Utility functions for consistent formatting across the portal
 */

/**
 * Formats a number or string as Dominican Pesos (DOP)
 */
export const formatCurrency = (val: number | string) => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2
  }).format(Number(val))
}

/**
 * Formats a date string into a readable format (es-DO)
 * @param dateStr ISO date string
 * @param includeTime Whether to include hours and minutes
 */
export const formatDate = (dateStr: string, includeTime: boolean = false) => {
  if (!dateStr) return ''
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }

  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }

  return new Intl.DateTimeFormat('es-DO', options).format(new Date(dateStr))
}

/**
 * Formats a number with consistent decimal places
 */
export const formatNumber = (num: number | string, decimals: number = 0) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(Number(num))
}
