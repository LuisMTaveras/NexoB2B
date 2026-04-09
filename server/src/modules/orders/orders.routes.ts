import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendNotFound } from '../../utils/apiResponse';
import { authenticate, requireInternalUser } from '../../middleware/auth';
import { EmailService } from '../../lib/email.service';

const router = Router();
router.use(authenticate, requireInternalUser);


/**
 * GET /api/orders
 * List all orders for the company (Internal users only)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { customerId, status } = req.query;
  const companyId = req.companyId!;

  const where: any = { companyId };
  if (customerId) where.customerId = customerId as string;
  if (status) where.status = status as any;

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: { select: { name: true, internalCode: true } },
      submittedBy: { select: { firstName: true, lastName: true, email: true } },
      _count: { select: { items: true } }
    } as any,

    orderBy: { createdAt: 'desc' }
  });

  return sendSuccess(res, orders);
}));

/**
 * GET /api/orders/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, companyId: req.companyId! },
    include: {
      customer: true,
      submittedBy: { select: { firstName: true, lastName: true, email: true } },
      items: true
    } as any

  });

  if (!order) return sendNotFound(res, 'Pedido no encontrado');
  return sendSuccess(res, order);
}));


/**

 * PATCH /api/orders/:id/status
 */
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const companyId = req.companyId!;
  
  // Update the status
  await prisma.order.update({
    where: { id: req.params.id },
    data: { status }
  });

  // Fetch full details for notification
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
        customer: { include: { company: true } },
        submittedBy: true
    } as any

  });

  if (!order) return sendNotFound(res, 'Pedido no encontrado después de actualizar');

  // Notify customer via email if they placed the order and we have their contact
  const typedOrder = order as any;
  if (typedOrder.submittedBy && typedOrder.submittedBy.email) {

    try {
        await EmailService.sendUserEmail(req.user!.userId, {
            to: typedOrder.submittedBy.email,
            subject: `Actualización de Pedido: ${typedOrder.number} - ${status}`,
            html: EmailService.getOrderStatusTemplate({
                companyName: typedOrder.customer.company.name,
                orderNumber: typedOrder.number,
                customerName: `${typedOrder.submittedBy.firstName} ${typedOrder.submittedBy.lastName}`,
                newStatus: status,
                total: typedOrder.total.toString(),
                currency: typedOrder.currency
            })
        });
    } catch (err) {
        // Log but don't fail the request
        console.error('Failed to send status notification email:', err);
    }
  }


  return sendSuccess(res, typedOrder, 'Estado del pedido actualizado y notificación enviada');

}));


export default router;


