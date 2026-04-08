import { customAlphabet } from 'nanoid';

// Alphabet: uppercase + numbers, avoiding ambiguous characters (0/O, 1/I/L)
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 8);

function prefix(code: string): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `${code}-${ym}-${nanoid()}`;
}

/**
 * Generates a unique internal code for a product.
 * Format: PRD-YYYYMM-XXXXXXXX
 */
export function generateProductCode(): string {
  return prefix('PRD');
}

/**
 * Generates a unique internal code for a customer.
 * Format: CLT-YYYYMM-XXXXXXXX
 */
export function generateCustomerCode(): string {
  return prefix('CLT');
}

/**
 * Generates a unique internal code for an order.
 * Format: ORD-YYYYMM-XXXXXXXX
 */
export function generateOrderCode(): string {
  return prefix('ORD');
}

/**
 * Generates a unique internal code for an invoice.
 * Format: FAC-YYYYMM-XXXXXXXX
 */
export function generateInvoiceCode(): string {
  return prefix('FAC');
}
