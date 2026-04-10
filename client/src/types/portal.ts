/**
 * Shared Type Definitions for the Customer Portal
 */

export type OrderStatus = 'PENDING_APPROVAL' | 'OPEN' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CUSTOMER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';

export type TicketCategory = 'ORDER_ISSUE' | 'BILLING' | 'TECHNICAL' | 'ACCOUNT' | 'OTHER';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface OrderItem {
  id: string;
  productId?: string;
  sku: string;
  name: string;
  quantity: number | string;
  unitPrice: number | string;
  total: number | string;
}

export interface Order {
  id: string;
  number: string;
  date: string;
  status: OrderStatus;
  total: number | string;
  currency: string;
  notes?: string;
  items?: OrderItem[];
  rejectedReason?: string;
  approvedAt?: string;
  submittedBy?: { firstName: string; lastName: string; email?: string };
  approvedBy?: { firstName: string; lastName: string; email?: string };
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate?: string;
  total: number | string;
  currency: string;
  status: InvoiceStatus;
  notes?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  brand?: string;
  unit?: string;
  stock: number;
  price: number;
  currency: string;
}

export interface TicketMessage {
  id: string;
  senderName: string;
  senderType: 'INTERNAL' | 'CUSTOMER';
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  relatedOrderId?: string;
  updatedAt: string;
  raisedBy?: { firstName: string; lastName: string };
  assignedTo?: { firstName: string; lastName: string };
  messages?: TicketMessage[];
}

export interface PortalNotification {
  id: string;
  type: 'ORDER_STATUS' | 'INVOICE_DUE' | 'TICKET_REPLY' | 'INFO';
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SmartBasketSuggestion extends Product {
  smartScore: number;
  suggestedQuantity: number;
  urgency: 'vencido' | 'proximo' | 'sugerido';
  patternText: string;
  lastPurchaseDate: string;
  averageInterval: number;
}

