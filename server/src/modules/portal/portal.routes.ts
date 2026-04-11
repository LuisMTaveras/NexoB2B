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
import { PortalService } from './portal.service';
import { SmartBasketService } from './smartBasket.service';
import { exportToCsv } from '../../utils/csvExport';
import { NotificationService } from './notification.service';
import { cache } from '../../lib/cache';


const router = Router();

// Apply auth to all portal routes
router.use(authenticate);
router.use(requireCustomerUser);

/**
 * GET /api/portal/me
 * Returns current customer user profile and their company/customer context
 */
router.get('/me', asyncHandler(async (req, res) => {
  const customerUser = await PortalService.getMe(req.user!.userId);
  if (!customerUser) return sendNotFound(res, 'Customer user not found');
  return sendSuccess(res, customerUser);
}));

/**
 * GET /api/portal/dashboard
 * Summary of stats for the customer portal
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const stats = await PortalService.getDashboardStats(req.user!.userId, req.companyId!);
  return sendSuccess(res, stats);
}));

/**
 * GET /api/portal/catalog
 * Catalog with per-customer pricing
 */
router.get('/catalog', asyncHandler(async (req, res) => {
  const catalog = await PortalService.getCatalog(req.user!.userId, req.companyId!);
  return sendSuccess(res, catalog);
}));

/**
 * GET /api/portal/invoices
 * Detailed list of invoices for the customer
 */
router.get('/invoices', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true, customer: { select: { creditLimit: true } } }
  });

  if (!customerUser) return sendNotFound(res);

  const invoices = await prisma.invoice.findMany({
    where: { customerId: customerUser.customerId, companyId: req.companyId! },
    orderBy: { date: 'desc' }
  });

  return sendSuccess(res, {
    invoices,
    creditLimit: customerUser.customer?.creditLimit || 0
  });
}));

/**
 * GET /api/portal/invoices/export
 * Export invoices to CSV
 */
router.get('/invoices/export', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true }
  });

  if (!customerUser) return sendNotFound(res);

  const invoices = await prisma.invoice.findMany({
    where: { customerId: customerUser.customerId, companyId: req.companyId! },
    orderBy: { date: 'desc' }
  });

  const exportData = invoices.map(i => ({
    Numero: i.number,
    Fecha: i.date.toLocaleDateString('es-DO'),
    Monto: Number(i.total),
    Moneda: i.currency,
    Estado: i.status === 'PAID' ? 'Pagado' : i.status === 'OVERDUE' ? 'Vencido' : 'Pendiente',
    Vencimiento: i.dueDate ? i.dueDate.toLocaleDateString('es-DO') : 'N/A'
  }));

  return exportToCsv(res, `Facturas_${new Date().getTime()}`, exportData);
}));

/**
 * GET /api/portal/invoices/statement
 * Downloads a consolidated account statement PDF
 */
router.get('/invoices/statement', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    include: {
      customer: true
    }
  });

  if (!customerUser) return sendNotFound(res);

  const invoices = await prisma.invoice.findMany({
    where: { customerId: customerUser.customerId, companyId: req.companyId! },
    orderBy: { date: 'desc' }
  });

  const company = await prisma.company.findUnique({
    where: { id: req.companyId! }
  });

  const totals = invoices.reduce((acc, inv) => {
    const amt = Number(inv.total);
    acc.total += amt;
    if (inv.status === 'PAID') acc.paid += amt;
    else acc.pending += amt;
    return acc;
  }, { total: 0, paid: 0, pending: 0 });

  const pdfBuffer = await PdfService.generateStatementPdf({
    customerName: customerUser.customer.name,
    date: new Date().toLocaleDateString('es-DO'),
    totalInvoiced: new Intl.NumberFormat('en-US').format(totals.total),
    totalPaid: new Intl.NumberFormat('en-US').format(totals.paid),
    totalPending: new Intl.NumberFormat('en-US').format(totals.pending),
    creditLimit: new Intl.NumberFormat('en-US').format(Number(customerUser.customer.creditLimit || 0)),
    currency: invoices[0]?.currency || 'DOP',
    invoices,
    companyName: company?.name || 'NexoB2B'
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Estado_Cuenta_${customerUser.customer.name.replace(/\s+/g, '_')}.pdf`);
  return res.send(pdfBuffer);
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
 * GET /api/portal/orders/:id
 * Fetch single order details (supports ON_DEMAND ERP sync for lines)
 */
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await PortalService.getOrderDetail(id, req.user!.userId, req.companyId!);

  if (!order) return sendNotFound(res, 'Pedido no encontrado');

  return sendSuccess(res, order);
}));


/**
 * GET /api/portal/orders/export
 * Export orders to CSV
 */
router.get('/orders/export', asyncHandler(async (req, res) => {
  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true }
  });

  if (!customerUser) return sendNotFound(res);

  const orders = await prisma.order.findMany({
    where: { customerId: customerUser.customerId, companyId: req.companyId! },
    orderBy: { date: 'desc' }
  });

  const exportData = orders.map(o => ({
    Numero: o.number,
    Fecha: o.date.toLocaleDateString('es-DO'),
    Estado: o.status,
    Total: Number(o.total),
    Moneda: o.currency
  }));

  return exportToCsv(res, `Pedidos_${new Date().getTime()}`, exportData);
}));

/**
 * GET /api/portal/notifications
 * Fetch user notifications
 */
router.get('/notifications', asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { 
      userId: req.user!.userId,
      companyId: req.companyId!
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return sendSuccess(res, notifications);
}));

/**
 * PATCH /api/portal/notifications/:id/read
 * Mark notification as read
 */
router.patch('/notifications/:id/read', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.notification.update({
    where: { id, userId: req.user!.userId },
    data: { isRead: true }
  });
  return sendSuccess(res, { success: true });
}));

/**
 * GET /api/portal/search
 * Global search for products, orders, and invoices
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') return sendSuccess(res, { products: [], orders: [], invoices: [] });

  const query = q.toLowerCase();
  const companyId = req.companyId!;

  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { customerId: true }
  });

  if (!customerUser) return sendNotFound(res);

  // Search Products
  const products = await prisma.product.findMany({
    where: {
      companyId,
      OR: [
        { name: { contains: query } },
        { sku: { contains: query } }
      ],
      isActive: true,
      isVisible: true
    },
    take: 5
  });

  // Search Orders
  const orders = await prisma.order.findMany({
    where: {
      companyId,
      customerId: customerUser.customerId,
      OR: [
        { number: { contains: query } },
        { notes: { contains: query } }
      ]
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  // Search Invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      companyId,
      customerId: customerUser.customerId,
      number: { contains: query }
    },
    take: 5,
    orderBy: { date: 'desc' }
  });

  return sendSuccess(res, { products, orders, invoices });
}));

/**
 * POST /api/portal/orders
 * Submit shopping cart and create an open Order
 */
router.post('/orders', asyncHandler(async (req, res) => {
  try {
    const order = await PortalService.submitOrder(req.user!.userId, req.companyId!, req.body.items, req.body.extendedFields, req.body.notes, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    return sendSuccess(res, order);
  } catch (err: any) {
    return res.status(err.message === 'El carrito está vacío' ? 400 : 500).json({ success: false, error: err.message });
  }
}));

router.get('/checkout-config', asyncHandler(async (req, res) => {
  const config = await PortalService.getCheckoutConfig(req.companyId!);
  return sendSuccess(res, config);
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

  // In-App Notification for Buyer
  if (order.submittedById) {
    await NotificationService.create({
      userId: order.submittedById,
      userType: 'CUSTOMER',
      companyId: req.companyId!,
      type: 'ORDER_STATUS',
      title: '¡Pedido Aprobado! ✅',
      body: `Tu pedido ${order.number} ha sido aprobado por ${approver.firstName} ${approver.lastName}.`,
      link: '/portal/orders'
    });
  }

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

  // In-App Notification for Buyer
  if (order.submittedById) {
    await NotificationService.create({
      userId: order.submittedById,
      userType: 'CUSTOMER',
      companyId: req.companyId!,
      type: 'ORDER_STATUS',
      title: 'Pedido Rechazado 🚫',
      body: `Tu pedido ${order.number} ha sido rechazado por ${rejector.firstName} ${rejector.lastName}. Motivo: ${reason || 'Sin motivo especificado'}.`,
      link: '/portal/orders'
    });
  }

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
