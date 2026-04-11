import { prisma } from '../../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { cache } from '../../lib/cache';
import { PdfService } from '../../lib/pdf.service';
import { EmailService } from '../../lib/email.service';
import { NotificationService } from './notification.service';
import { logAction } from '../../lib/audit';
import { logger } from '../../lib/logger';
import { SyncStatus, SyncResource } from '@prisma/client';

export class PortalService {
  /**
   * Returns current customer user profile and their company/customer context.
   */
  static async getMe(userId: string) {
    return prisma.customerUser.findUnique({
      where: { id: userId },
      include: {
        customer: {
          include: {
            company: { include: { branding: true } },
            priceAssignment: true
          }
        }
      }
    });
  }

  /**
   * Summary of stats for the customer portal (Balance, Orders, Recent Invoices, Analytics).
   */
  static async getDashboardStats(userId: string, companyId: string) {
    const customerUser = await prisma.customerUser.findUnique({
      where: { id: userId },
      select: { customerId: true, role: true, customer: { select: { internalCode: true, creditLimit: true } } }
    });

    if (!customerUser) throw new Error('User not found');

    const customerId = customerUser.customerId;

    // 1. Pending Balance
    const receivables = await prisma.accountReceivable.findMany({ where: { customerId, companyId } });
    const balance = receivables.reduce((sum, r) => sum.add(r.balance), new Decimal(0));

    // 2. Active Orders
    const orderCount = await prisma.order.count({
      where: { customerId, companyId, status: { in: ['OPEN', 'CONFIRMED', 'SHIPPED', 'PENDING_APPROVAL'] } }
    });

    // 3. Recent Invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: { customerId, companyId },
      orderBy: { date: 'desc' },
      take: 5
    });

    // 4. Analytics (Admins only)
    let analytics = null;
    if (customerUser.role === 'ADMIN') {
      analytics = await this.getAdminAnalytics(customerId, companyId);
    }

    return {
      customerCode: customerUser.customer?.internalCode || null,
      creditLimit: customerUser.customer?.creditLimit || 0,
      balance,
      orderCount,
      recentInvoices,
      analytics
    };
  }

  private static async getAdminAnalytics(customerId: string, companyId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { 
        customerId, 
        companyId, 
        status: { notIn: ['CANCELLED', 'REJECTED'] },
        date: { gte: sixMonthsAgo }
      },
      select: { total: true, date: true, submittedById: true, submittedBy: { select: { firstName: true, lastName: true } } }
    });

    const monthlyData: Record<string, number> = {};
    const userData: Record<string, { name: string, total: number }> = {};

    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthlyData[d.toLocaleDateString('es-DO', { month: 'short', year: '2-digit' })] = 0;
    }

    orders.forEach(o => {
      const label = new Date(o.date).toLocaleDateString('es-DO', { month: 'short', year: '2-digit' });
      if (monthlyData[label] !== undefined) monthlyData[label] += Number(o.total);

      if (o.submittedById) {
        if (!userData[o.submittedById]) {
          userData[o.submittedById] = { name: `${o.submittedBy?.firstName} ${o.submittedBy?.lastName}`, total: 0 };
        }
        userData[o.submittedById].total += Number(o.total);
      }
    });

    return {
      spendByMonth: Object.entries(monthlyData).reverse().map(([label, total]) => ({ label, total })),
      spendByUser: Object.values(userData).sort((a, b) => b.total - a.total).slice(0, 5)
    };
  }

  /**
   * Catalog with per-customer pricing and Redis caching.
   */
  static async getCatalog(userId: string, companyId: string) {
    const customerUser = await prisma.customerUser.findUnique({
      where: { id: userId },
      include: { customer: { include: { priceAssignment: true } } }
    });

    if (!customerUser) throw new Error('User not found');

    const assignedPriceList = customerUser.customer.priceAssignment?.priceListId || 'LISTA_1';
    const cacheKey = `portal:catalog:${companyId}:${assignedPriceList}`;

    const cachedData = await cache.get<any[]>(cacheKey);
    if (cachedData) return cachedData;

    const products = await prisma.product.findMany({
      where: { companyId, isActive: true, isVisible: true },
      include: { priceSnapshots: true }
    });

    const catalog = products.map(p => {
      let priceInfo = p.priceSnapshots.find(s => s.priceListId === assignedPriceList);
      if (!priceInfo && assignedPriceList !== 'LISTA_1') {
        priceInfo = p.priceSnapshots.find(s => s.priceListId === 'LISTA_1');
      }

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        category: p.category,
        brand: p.brand,
        unit: p.unit,
        stock: p.stock,
        price: priceInfo?.price || 0,
        currency: priceInfo?.currency || 'DOP'
      };
    });

    await cache.set(cacheKey, catalog, 600);
    return catalog;
  }

  /**
   * Submits a shopping cart and creates an Order.
   */
  static async submitOrder(userId: string, companyId: string, items: any[], extendedFields?: any, notes?: string, auditContext?: any) {
    if (!items || items.length === 0) throw new Error('El carrito está vacío');

    const customerUser = await prisma.customerUser.findUnique({
      where: { id: userId },
      include: { customer: true }
    });

    if (!customerUser) throw new Error('User not found');

    let total = new Decimal(0);
    const currency = items[0]?.currency || 'DOP';

    const orderItemsData = items.map((item: any) => {
      const qty = new Decimal(item.quantity);
      const price = new Decimal(item.price);
      const rowTotal = qty.mul(price);
      total = total.add(rowTotal);
      return { productId: item.id, sku: item.sku, name: item.name, quantity: qty, unitPrice: price, total: rowTotal };
    });

    const isOverLimit = customerUser.orderLimit !== null && total.gt(customerUser.orderLimit);
    const needsApproval = customerUser.role === 'BUYER' || customerUser.requiresApproval || isOverLimit;
    const orderStatus = needsApproval ? 'PENDING_APPROVAL' : 'OPEN';

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const number = `ORD-${dateStr}-${randNum}`;

    const order = await prisma.order.create({
      data: {
        companyId,
        customerId: customerUser.customerId,
        submittedById: userId,
        number,
        date: new Date(),
        status: orderStatus,
        total,
        currency,
        notes,
        syncStatus: 'SUBMITTED' as any,
        extendedFields: extendedFields || {},
        items: { create: orderItemsData }
      },
      include: { items: true }
    });

    // If order is ready to go, trigger sync immediately in background
    if (orderStatus === 'OPEN') {
      import('../integration/outbound.service').then(({ OutboundSyncService }) => {
        OutboundSyncService.syncOrder(order.id, companyId).catch(console.error);
      });
    }

    if (orderStatus === 'PENDING_APPROVAL') {
      await this.handleOrderApprovalNotification(order, customerUser, companyId);
    }

    await logAction({
      companyId,
      userEmail: customerUser.email,
      action: 'ORDER_SUBMITTED',
      resource: 'Order',
      resourceId: order.id,
      ip: auditContext?.ip,
      userAgent: auditContext?.userAgent,
      details: { orderNumber: order.number, status: orderStatus, total: order.total }
    });

    return order;
  }

  private static async handleOrderApprovalNotification(order: any, buyer: any, companyId: string) {
    await NotificationService.notifyAdmins(
      companyId,
      'ORDER_STATUS',
      'Nuevo Pedido por Autorizar ⚠️',
      `El comprador ${buyer.firstName} ${buyer.lastName} ha creado el pedido ${order.number}.`,
      `/portal/orders`
    );

    try {
      const mailer = await EmailService.getCompanyTransporter(companyId);
      if (mailer) {
        const admins = await prisma.customerUser.findMany({
          where: { customerId: buyer.customerId, role: 'ADMIN', status: 'ACTIVE' },
          select: { email: true }
        });
        
        for (const admin of admins) {
          await mailer.transporter.sendMail({
            from: mailer.from,
            to: admin.email,
            subject: `⚠️ Acción Requerida: Pedido ${order.number} por autorizar`,
            html: EmailService.getApprovalRequiredTemplate({
              companyName: buyer.customer?.internalCode || 'NexoB2B',
              orderNumber: order.number,
              buyerName: `${buyer.firstName} ${buyer.lastName}`,
              total: order.total.toString(),
              currency: order.currency
            })
          });
        }
      }
    } catch (err) {
      logger.error('Error sending approval notification emails', err);
    }
  }

  /**
   * Returns metadata and extended fields required for checkout.
   */
  static async getCheckoutConfig(companyId: string) {
    const mapping = await prisma.integrationMapping.findFirst({
      where: { 
        integration: { companyId, isActive: true },
        resource: 'ORDERS',
        direction: 'OUTBOUND',
        isActive: true
      },
      select: { extendedFieldsDef: true }
    });

    return {
      extendedFields: mapping?.extendedFieldsDef || {}
    };
  }

  /**
   * Fetches a single order with its items.
   * If an ON_DEMAND integration is configured, it fetches lines from the ERP in real-time.
   */
  static async getOrderDetail(orderId: string, userId: string, companyId: string) {
    const customerUser = await prisma.customerUser.findUnique({
      where: { id: userId },
      select: { customerId: true }
    });

    if (!customerUser) return null;

    const { OrdersService } = await import('../orders/orders.service');
    return OrdersService.getById(orderId, companyId, customerUser.customerId);
  }
}
