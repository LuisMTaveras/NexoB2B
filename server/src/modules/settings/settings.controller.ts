import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { encrypt } from '../../lib/crypto';
import nodemailer from 'nodemailer';

export const getEmailConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const config = await prisma.emailConfig.findUnique({
      where: { userId },
      select: {
        provider: true,
        host: true,
        port: true,
        smtpUser: true,
        imapHost: true,
        imapPort: true,
        fromAddress: true,
        fromName: true,
        useTLS: true,
      }
    });
    res.json({ success: true, data: config || null });
  } catch (error) {
    next(error);
  }
};

export const saveEmailConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { 
      provider, host, port, smtpUser, password, 
      fromAddress, fromName, useTLS, imapHost, imapPort 
    } = req.body;

    const encryptedPassword = encrypt(password);

    const config = await prisma.emailConfig.upsert({
      where: { userId },
      create: {
        userId,
        provider,
        host,
        port,
        smtpUser,
        password: encryptedPassword,
        fromAddress,
        fromName,
        useTLS,
        imapHost,
        imapPort,
      },
      update: {
        provider,
        host,
        port,
        smtpUser,
        password: encryptedPassword,
        fromAddress,
        fromName,
        useTLS,
        imapHost,
        imapPort,
      }
    });

    res.json({ success: true, message: 'Configuración guardada correctamente' });
  } catch (error) {
    next(error);
  }
};

export const testEmailConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, host, port, smtpUser, password, useTLS } = req.body;

    const transporter = nodemailer.createTransport({
      host: host || undefined,
      port: port || 587,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: password, // Use raw password for test
      },
    });

    await transporter.verify();
    res.json({ success: true, message: 'Conexión exitosa' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: 'Error de conexión', details: error.message });
  }
};
