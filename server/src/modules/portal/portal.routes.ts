import { Router } from 'express';
import { authenticate, requireCustomerUser } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendNotFound } from '../../utils/apiResponse';
import { prisma } from '../../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { logAction } from '../../lib/audit';
import { logger } from '../../lib/logger';
import { EmailService } from '../../lib/email.service';
import { PdfService } from '../../lib/pdf.service';
import { SmartBasketService } from './smartBasket.service';

const router = Router();

// Apply auth to all portal routes
router.use(authenticate);
router.use(requireCustomerUser);

/**
 * GET /api/portal/me
 * Returns current customer user profile and their company/customer context
 */
router.get('/me', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    include: {
      customer: {
        include: {
          company: {
            include: { branding: true }
          },
          priceAssignment: true
        }
      }
    }
  });

  if (!customerUser) return sendNotFound(res, 'Customer user not found');
  return sendSuccess(res, customerUser);
}));

/**
 * GET /api/portal/dashboard
 * Summary of stats for the customer portal
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true, role: true }
  });

  if (!customerUser) return sendNotFound(res);

  const customerId = customerUser.customerId;
  const companyId = req.companyId!;

  // 1. Pending Balance (from AccountReceivable)
  const receivables = await prisma.accountReceivable.findMany({
    where: { customerId, companyId }
  });
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
    // Last 6 months - Spend by Month
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

    // Initialize months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('es-DO', { month: 'short', year: '2-digit' });
      monthlyData[label] = 0;
    }

    orders.forEach(o => {
      const label = new Date(o.date).toLocaleDateString('es-DO', { month: 'short', year: '2-digit' });
      if (monthlyData[label] !== undefined) {
        monthlyData[label] += Number(o.total);
      }

      if (o.submittedById) {
        if (!userData[o.submittedById]) {
          userData[o.submittedById] = { 
            name: `${o.submittedBy?.firstName} ${o.submittedBy?.lastName}`, 
            total: 0 
          };
        }
        userData[o.submittedById].total += Number(o.total);
      }
    });

    analytics = {
      spendByMonth: Object.entries(monthlyData).reverse().map(([label, total]) => ({ label, total })),
      spendByUser: Object.values(userData).sort((a, b) => b.total - a.total).slice(0, 5)
    };
  }

  return sendSuccess(res, {
    balance,
    orderCount,
    recentInvoices,
    analytics
  });
}));

/**
 * GET /api/portal/catalog
 * Catalog with per-customer pricing
 */
router.get('/catalog', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    include: {
      customer: {
        include: { priceAssignment: true }
      }
    }
  });

  if (!customerUser) return sendNotFound(res);

  const companyId = req.companyId!;
  const assignedPriceList = customerUser.customer.priceAssignment?.priceListId || 'LISTA_1';

  // Fetch all active products with all their prices
  const products = await prisma.product.findMany({
    where: { companyId, isActive: true, isVisible: true },
    include: {
      priceSnapshots: true
    }
  });

  // Map products to include their specific price with fallback logic
  const catalog = products.map(p => {
    // 1. Try to find the price for the assigned list
    let priceInfo = p.priceSnapshots.find(s => s.priceListId === assignedPriceList);
    
    // 2. If not found and assigned list is not LISTA_1, fallback to LISTA_1
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

  return sendSuccess(res, catalog);
}));

/**
 * GET /api/portal/invoices
 * Detailed list of invoices for the customer
 */
router.get('/invoices', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true }
  });

  if (!customerUser) return sendNotFound(res);

  const invoices = await prisma.invoice.findMany({
    where: { customerId: customerUser.customerId, companyId: req.companyId! },
    orderBy: { date: 'desc' }
  });

  return sendSuccess(res, invoices);
}));

/**
 * GET /api/portal/orders
 * List of orders created by this customer
 */
router.get('/orders', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true }
  });

  if (!customerUser) return sendNotFound(res);

  const orders = await prisma.order.findMany({
    where: { customerId: customerUser.customerId, companyId: req.companyId! },
    include: {
      items: true,
      submittedBy: { select: { firstName: true, lastName: true } },
      approvedBy: { select: { firstName: true, lastName: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return sendSuccess(res, orders);
}));

/**
 * POST /api/portal/orders
 * Submit shopping cart and create an open Order
 */
router.post('/orders', asyncHandler(async (req, res) => {
  const { items, notes } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'El carrito está vacío' });
  }

  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true, role: true, requiresApproval: true, orderLimit: true, customer: { select: { internalCode: true } }, firstName: true, lastName: true, email: true }
  });

  if (!customerUser) return sendNotFound(res, 'Usuario de cliente no encontrado');

  const customerId = customerUser.customerId;
  const companyId = req.companyId!;

  // Calcular totales
  let total = new Decimal(0);
  const currency = items[0]?.currency || 'DOP';

  const orderItemsData = items.map((item: any) => {
    const qty = new Decimal(item.quantity);
    const price = new Decimal(item.price);
    const rowTotal = qty.mul(price);
    total = total.add(rowTotal);

    return {
      productId: item.id,
      sku: item.sku,
      name: item.name,
      quantity: qty,
      unitPrice: price,
      total: rowTotal
    };
  });

  // Determinar status basado en rol y configuración:
  // - Los Buyers SIEMPRE requieren aprobación.
  // - Los Admins SOLO si tienen el flag requiresApproval (control de gastos).
  // - CUALQUIERA si el total supera su límite de gasto (spending limit).
  const isOverLimit = customerUser.orderLimit !== null && total.gt(customerUser.orderLimit);
  const needsApproval =
    customerUser.role === 'BUYER' || customerUser.requiresApproval || isOverLimit;
  const orderStatus = needsApproval ? 'PENDING_APPROVAL' : 'OPEN';

  // Crear id consecutivo interno básico temporal
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const numberStr = `ORD-${dateStr}-${randNum}`;

  const order = await prisma.order.create({
    data: {
      companyId,
      customerId,
      submittedById: req.user!.userId,
      number: numberStr,
      date: new Date(),
      status: orderStatus,
      total,
      currency,
      notes,
      items: {
        create: orderItemsData
      }
    },
    include: {
      items: true
    }
  });

  // Notificar a los Administradores si el pedido requiere aprobación
  if (orderStatus === 'PENDING_APPROVAL') {
    (async () => {
      try {
        const mailer = await EmailService.getCompanyTransporter(companyId);
        if (mailer) {
          const admins = await prisma.customerUser.findMany({
            where: { customerId, role: 'ADMIN', status: 'ACTIVE' },
            select: { email: true }
          });
          
          for (const admin of admins) {
            await mailer.transporter.sendMail({
              from: mailer.from,
              to: admin.email,
              subject: `⚠️ Acción Requerida: Pedido ${order.number} por autorizar`,
              html: EmailService.getApprovalRequiredTemplate({
                companyName: customerUser.customer?.internalCode || 'NexoB2B',
                orderNumber: order.number,
                buyerName: `${customerUser.firstName} ${customerUser.lastName}`,
                total: total.toString(),
                currency
              })
            });
          }
        }
      } catch (err) {
        logger.error('Error sending approval notification emails:', err);
      }
    })();
  }

  // Audit log
  await logAction({
    companyId,
    userEmail: customerUser.email,
    action: 'ORDER_SUBMITTED',
    resource: 'Order',
    resourceId: order.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    details: {
      orderNumber: order.number,
      status: orderStatus,
      total: order.total,
      currency: order.currency,
      submittedBy: {
        name: `${customerUser.firstName} ${customerUser.lastName}`,
        email: customerUser.email,
        role: customerUser.role,
      }
    }
  });

  return sendSuccess(res, order);
}));

/**
 * POST /api/portal/orders/:id/reorder
 * Duplicates an existing order's items into the customer's current session/cart
 * Or creates a new order directly if preferred (we'll implement direct creation here)
 */
router.post('/orders/:id/reorder', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true, role: true, requiresApproval: true, orderLimit: true }
  });

  if (!customerUser) return sendNotFound(res);

  const existingOrder = await prisma.order.findFirst({
    where: { id: req.params.id, customerId: customerUser.customerId, companyId: req.companyId! },
    include: { items: true }
  });

  if (!existingOrder) return sendNotFound(res, 'Original order not found');

  // Create new order identity
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const numberStr = `ORD-${dateStr}-${randNum}-RE`;

  const newOrder = await prisma.order.create({
    data: {
      companyId: req.companyId!,
      customerId: customerUser.customerId,
      submittedById: req.user!.userId,
      number: numberStr,
      date: new Date(),
      status: (customerUser.role === 'BUYER' || customerUser.requiresApproval || (customerUser.orderLimit !== null && existingOrder.total.gt(customerUser.orderLimit))) ? 'PENDING_APPROVAL' : 'OPEN',
      total: existingOrder.total,
      currency: existingOrder.currency,
      notes: `Re-pedido del anterior ${existingOrder.number}`,
      items: {
        create: existingOrder.items.map(i => ({
          productId: i.productId,
          sku: i.sku,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total
        }))
      }
    },
    include: { items: true }
  });

  return sendSuccess(res, newOrder, 'Re-pedido creado con éxito');
}));

/**
 * PATCH /api/portal/orders/:id/approve
 * Approve a pending order (ADMIN of the same customer only)
 */
router.patch('/orders/:id/approve', asyncHandler(async (req, res) => {
  const approver = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true, role: true, firstName: true, lastName: true, email: true }
  });

  if (!approver || approver.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Solo los administradores pueden aprobar pedidos.' });
  }

  const order = await prisma.order.findFirst({
    where: { id: req.params.id, customerId: approver.customerId, companyId: req.companyId! },
    include: { submittedBy: { select: { firstName: true, lastName: true, email: true } } }
  });

  if (!order) return sendNotFound(res, 'Pedido no encontrado');
  if ((order as any).status !== 'PENDING_APPROVAL') {
    return res.status(400).json({ success: false, error: 'El pedido no está pendiente de aprobación.' });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'OPEN',
      approvedById: req.user!.userId,
      approvedAt: new Date()
    } as any
  });

  // Audit
  await logAction({
    companyId: req.companyId!,
    userEmail: approver.email,
    action: 'ORDER_APPROVED',
    resource: 'Order',
    resourceId: order.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    details: {
      orderNumber: order.number,
      approvedBy: { name: `${approver.firstName} ${approver.lastName}`, email: approver.email },
      submittedBy: order.submittedBy ? {
        name: `${(order as any).submittedBy.firstName} ${(order as any).submittedBy.lastName}`,
        email: (order as any).submittedBy.email
      } : null
    }
  });

  // Notificar al comprador de la aprobación
  const submittedBy = order.submittedBy;
  if (submittedBy?.email) {
    (async () => {
      try {
        const mailer = await EmailService.getCompanyTransporter(req.companyId!);
        if (mailer) {
          await mailer.transporter.sendMail({
            from: mailer.from,
            to: submittedBy.email,
            subject: `✅ Tu pedido ${order.number} ha sido aprobado`,
            html: EmailService.getOrderStatusTemplate({
              companyName: 'Portal B2B',
              orderNumber: order.number,
              customerName: submittedBy.firstName,
              newStatus: 'Aprobado (Abierto)',
              total: order.total.toString(),
              currency: order.currency
            })
          });
        }
      } catch (err) {
        logger.error('Error sending order approval email:', err);
      }
    })();
  }

  return sendSuccess(res, updated, 'Pedido aprobado exitosamente.');
}));

/**
 * PATCH /api/portal/orders/:id/reject
 * Reject a pending order (ADMIN of the same customer only)
 */
router.patch('/orders/:id/reject', asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const rejector = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true, role: true, firstName: true, lastName: true, email: true }
  });

  if (!rejector || rejector.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Solo los administradores pueden rechazar pedidos.' });
  }

  const order = await prisma.order.findFirst({
    where: { id: req.params.id, customerId: rejector.customerId, companyId: req.companyId! },
    include: { submittedBy: { select: { firstName: true, lastName: true, email: true } } }
  });

  if (!order) return sendNotFound(res, 'Pedido no encontrado');
  if ((order as any).status !== 'PENDING_APPROVAL') {
    return res.status(400).json({ success: false, error: 'El pedido no puede ser rechazado en su estado actual.' });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'REJECTED',
      rejectedReason: reason || 'Sin motivo especificado'
    } as any
  });

  // Audit
  await logAction({
    companyId: req.companyId!,
    userEmail: rejector.email,
    action: 'ORDER_REJECTED',
    resource: 'Order',
    resourceId: order.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    details: {
      orderNumber: order.number,
      rejectedBy: { name: `${rejector.firstName} ${rejector.lastName}`, email: rejector.email },
      reason,
      submittedBy: order.submittedBy ? {
        name: `${(order as any).submittedBy.firstName} ${(order as any).submittedBy.lastName}`,
        email: (order as any).submittedBy.email
      } : null
    }
  });

  // Notificar al comprador del rechazo
  const rejectedTo = order.submittedBy;
  if (rejectedTo?.email) {
    (async () => {
      try {
        const mailer = await EmailService.getCompanyTransporter(req.companyId!);
        if (mailer) {
          await mailer.transporter.sendMail({
            from: mailer.from,
            to: rejectedTo.email,
            subject: `🚫 Tu pedido ${order.number} ha sido rechazado`,
            html: EmailService.getOrderStatusTemplate({
              companyName: 'Portal B2B',
              orderNumber: order.number,
              customerName: rejectedTo.firstName,
              newStatus: 'Rechazado',
              total: order.total.toString(),
              currency: order.currency
            })
          });
        }
      } catch (err) {
        logger.error('Error sending order rejection email:', err);
      }
    })();
  }

  return sendSuccess(res, updated, 'Pedido rechazado exitosamente.');
}));

/**
 * GET /api/portal/orders/:id/proforma
 * Generates and downloads a proforma PDF for the order
 */
router.get('/orders/:id/proforma', asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { 
      id: req.params.id, 
      companyId: req.companyId!,
      // Ensure the order belongs to the customer of the user
      customer: { users: { some: { id: req.user!.userId } } }
    },
    include: {
      items: true,
      company: true,
      submittedBy: true
    }
  });

  if (!order) return sendNotFound(res, 'Pedido no encontrado');

  const pdfBuffer = await PdfService.generateProforma({
    companyName: order.company.name,
    orderNumber: order.number,
    date: order.date.toISOString(),
    customerName: `${order.submittedBy?.firstName} ${order.submittedBy?.lastName}`,
    items: order.items.map(i => ({
      name: i.name,
      sku: i.sku,
      quantity: i.quantity.toString(),
      unitPrice: i.unitPrice.toString(),
      total: i.total.toString()
    })),
    total: order.total.toString(),
    currency: order.currency,
    notes: order.notes || undefined
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=PROFORMA-${order.number}.pdf`);
  return res.send(pdfBuffer);
}));

/**
 * GET /api/portal/invoices/:id/pdf
 * Generates and downloads the PDF version of the invoice
 */
router.get('/invoices/:id/pdf', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true }
  });

  if (!customerUser) return sendNotFound(res);

  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, customerId: customerUser.customerId, companyId: req.companyId! },
    include: {
      company: { include: { branding: true } },
      customer: true
    }
  });

  if (!invoice) return sendNotFound(res, 'Factura no encontrada');

  // We don't have detailed items in Invoice model (it's often a summary from ERP)
  // But we can show the summary or if it has orders related, show items.
  // For now, let's create a generic item from the invoice total.
  const dummyItems = [{
    sku: 'FACTURA',
    name: `Resumen de compra - ${invoice.number}`,
    quantity: '1',
    unitPrice: invoice.subtotal.toString(),
    total: invoice.subtotal.toString()
  }];

  const pdfBuffer = await PdfService.generateInvoicePdf({
    invoiceNumber: invoice.number,
    date: invoice.date.toLocaleDateString(),
    customerName: invoice.customer.name,
    customerTaxId: invoice.customer.taxId || undefined,
    items: dummyItems,
    subtotal: invoice.subtotal.toString(),
    tax: invoice.tax.toString(),
    total: invoice.total.toString(),
    currency: invoice.currency,
    companyName: invoice.company.name,
    companyLogo: invoice.company.logo ? `/api/companies/logo/${invoice.companyId}` : undefined
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Factura_${invoice.number}.pdf`);
  return res.send(pdfBuffer);
}));

/**
 * GET /api/portal/smart-basket
 * Returns suggested products for the current customer
 */
router.get('/smart-basket', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true, customer: { include: { priceAssignment: true } } }
  });

  if (!customerUser) return sendNotFound(res);

  const suggestions = await SmartBasketService.getBasket(customerUser.customerId);
  const assignedPriceList = customerUser.customer.priceAssignment?.priceListId || 'LISTA_1';

  // Format suggestions with pricing
  const result = suggestions.map((s: any) => {
    const p = s.product;
    let priceInfo = p.priceSnapshots.find((ps: any) => ps.priceListId === assignedPriceList);
    if (!priceInfo && assignedPriceList !== 'LISTA_1') {
      priceInfo = p.priceSnapshots.find((ps: any) => ps.priceListId === 'LISTA_1');
    }

    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      imageUrl: p.imageUrl,
      category: p.category,
      unit: p.unit,
      stock: p.stock,
      price: priceInfo?.price || 0,
      currency: priceInfo?.currency || 'DOP',
      smartScore: s.smartScore,
      suggestedQuantity: s.suggestedQuantity,
      urgency: s.urgency,
      patternText: s.patternText,
      lastPurchaseDate: s.lastPurchaseDate
    };
  });

  return sendSuccess(res, result);
}));

export default router;
