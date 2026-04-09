import { Router } from 'express';
import { authenticate, requireCustomerUser } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendNotFound } from '../../utils/apiResponse';
import { prisma } from '../../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

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
    select: { customerId: true }
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
    where: { customerId, companyId, status: { in: ['OPEN', 'CONFIRMED', 'SHIPPED'] } }
  });

  // 3. Recent Invoices
  const recentInvoices = await prisma.invoice.findMany({
    where: { customerId, companyId },
    orderBy: { date: 'desc' },
    take: 5
  });

  return sendSuccess(res, {
    balance,
    orderCount,
    recentInvoices
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
      items: true
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
    select: { customerId: true, customer: { select: { internalCode: true } } }
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
      status: 'OPEN',
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
    select: { customerId: true }
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
      status: 'OPEN',
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
 * GET /api/portal/invoices/:id/pdf
 * Generates and downloads the PDF version of the invoice
 */
import { PdfService } from './pdf.service';

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

export default router;
