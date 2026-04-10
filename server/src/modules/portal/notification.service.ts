import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

export class NotificationService {
  /**
   * Creates a notification for a user
   */
  static async create({
    userId,
    userType,
    companyId,
    type,
    title,
    body,
    link
  }: {
    userId?: string;
    userType: 'CUSTOMER' | 'INTERNAL';
    companyId: string;
    type: 'ORDER_STATUS' | 'INVOICE_DUE' | 'TICKET_REPLY' | 'INFO';
    title: string;
    body: string;
    link?: string;
  }) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          userType,
          companyId,
          type,
          title,
          body,
          link
        }
      });
    } catch (error) {
      logger.error('Failed to create notification', { error, userId, title });
      return null;
    }
  }

  /**
   * Notify all admins of a company
   */
  static async notifyAdmins(companyId: string, type: 'ORDER_STATUS' | 'INVOICE_DUE' | 'TICKET_REPLY' | 'INFO', title: string, body: string, link?: string) {
    try {
      const admins = await prisma.customerUser.findMany({
        where: { companyId, role: 'ADMIN' },
        select: { id: true }
      });

      const notifications = admins.map(admin => ({
        userId: admin.id,
        userType: 'CUSTOMER',
        companyId,
        type,
        title,
        body,
        link
      }));

      return await prisma.notification.createMany({
        data: notifications
      });
    } catch (error) {
      logger.error('Failed to notify admins', { error, companyId, title });
      return null;
    }
  }
}
