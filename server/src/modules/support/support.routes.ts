import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendNotFound, sendCreated, sendError } from '../../utils/apiResponse';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── Customer Routes ────────────────────────────────────────────────

// GET /api/support/tickets (Portal list)
router.get('/tickets', asyncHandler(async (req, res) => {
  const isInternal = req.user!.type === 'internal';
  
  const where: any = { companyId: req.companyId! };
  
  if (!isInternal) {
    // For customers, only show their company's tickets
    const customerUser = await prisma.customerUser.findUnique({
      where: { id: req.user!.userId },
      select: { customerId: true }
    });
    if (!customerUser) return sendNotFound(res);
    where.customerId = customerUser.customerId;
  }

  const tickets = await (prisma as any).ticket.findMany({

    where,
    include: {
      customer: { select: { name: true } },
      raisedBy: { select: { firstName: true, lastName: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
      _count: { select: { messages: isInternal ? true : { where: { isInternal: false } } } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return sendSuccess(res, tickets);
}));

// POST /api/support/tickets (Create new)
router.post('/tickets', asyncHandler(async (req, res) => {
  if (req.user!.type === 'internal') {
    return sendError(res, 'Solo los clientes pueden abrir tickets', 403);
  }

  const customerUser = await prisma.customerUser.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, customerId: true, firstName: true, lastName: true }
  });

  if (!customerUser) return sendNotFound(res);

  const { subject, body, priority = 'MEDIUM', category = 'OTHER', relatedOrderId } = req.body;
  if (!subject || !body) return sendError(res, 'Asunto y cuerpo son requeridos', 400);

  const ticket = await (prisma as any).ticket.create({
    data: {

      companyId: req.companyId!,
      customerId: customerUser.customerId,
      raisedById: customerUser.id,
      subject,
      priority,
      category,
      relatedOrderId: relatedOrderId || null,
      messages: {
        create: {
          senderId: customerUser.id,
          senderType: 'CUSTOMER',
          senderName: `${customerUser.firstName} ${customerUser.lastName}`,
          body
        }
      }
    },
    include: { messages: true }
  });

  return sendCreated(res, ticket, 'Ticket creado correctamente');
}));

// GET /api/support/tickets/:id
router.get('/tickets/:id', asyncHandler(async (req, res) => {
  const where: any = { id: req.params.id, companyId: req.companyId! };
  
  if (req.user!.type !== 'internal') {
    const customerUser = await prisma.customerUser.findUnique({
      where: { id: req.user!.userId },
      select: { customerId: true }
    });
    if (!customerUser) return sendNotFound(res);
    where.customerId = customerUser.customerId;
  }

  const ticket = await (prisma as any).ticket.findFirst({

    where,
    include: {
      customer: { select: { name: true } },
      raisedBy: { select: { firstName: true, lastName: true, email: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
      messages: { 
        where: req.user!.type === 'internal' ? {} : { isInternal: false },
        orderBy: { createdAt: 'asc' } 
      }
    }
  });

  if (!ticket) return sendNotFound(res, 'Ticket no encontrado');
  return sendSuccess(res, ticket);
}));

// POST /api/support/tickets/:id/messages (Reply)
router.post('/tickets/:id/messages', asyncHandler(async (req, res) => {
  const { body, isInternal = false } = req.body;
  if (!body) return sendError(res, 'El mensaje no puede estar vacío', 400);

  const ticket = await (prisma as any).ticket.findFirst({
    where: { id: req.params.id, companyId: req.companyId! }
  });

  if (!ticket) return sendNotFound(res);

  let senderName = 'Usuario';
  let senderType = 'CUSTOMER';

  if (req.user!.type === 'internal') {
    senderType = 'INTERNAL';
    const user = await prisma.internalUser.findUnique({
      where: { id: req.user!.userId },
      select: { firstName: true, lastName: true }
    });
    senderName = user ? `${user.firstName} ${user.lastName}` : 'Soporte';
  } else {
    // Verify customer owns ticket
    const customerUser = await prisma.customerUser.findUnique({
      where: { id: req.user!.userId },
      select: { customerId: true, firstName: true, lastName: true }
    });
    if (!customerUser || customerUser.customerId !== ticket.customerId) {
        return sendError(res, 'No tienes permiso para responder a este ticket', 403);
    }
    senderName = `${customerUser.firstName} ${customerUser.lastName}`;
  }

  const message = await (prisma as any).ticketMessage.create({

    data: {
      ticketId: ticket.id,
      senderId: req.user!.userId,
      senderType,
      senderName,
      body,
      isInternal: req.user!.type === 'internal' ? isInternal : false
    }
  });

  // Update ticket timestamp
  await (prisma as any).ticket.update({
    where: { id: ticket.id },

    data: { updatedAt: new Date() }
  });

  return sendCreated(res, message, 'Mensaje enviado');
}));

// PATCH /api/support/tickets/:id/status (Admin only)
router.patch('/tickets/:id/status', asyncHandler(async (req, res) => {
  if (req.user!.type !== 'internal') return sendError(res, 'Solo el staff puede cambiar el estado', 403);

  const { status } = req.body;
  const updated = await (prisma as any).ticket.update({
    where: { id: req.params.id },

    data: { status }
  });

  return sendSuccess(res, updated, 'Estado del ticket actualizado');
}));

// PATCH /api/support/tickets/:id/assign (Admin only)
router.patch('/tickets/:id/assign', asyncHandler(async (req, res) => {
  if (req.user!.type !== 'internal') return sendError(res, 'Solo el staff puede asignar tickets', 403);

  const { assignedToId } = req.body;
  const updated = await (prisma as any).ticket.update({
    where: { id: req.params.id },
    data: { assignedToId }
  });

  return sendSuccess(res, updated, 'Ticket asignado correctamente');
}));

export default router;
