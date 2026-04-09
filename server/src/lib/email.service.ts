import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { decrypt } from './crypto';
import { logger } from './logger';
import { env } from '../config/env';

interface SendMailOptions {
  from?: { name: string; address: string };
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Sends an email using a specific InternalUser's configuration.
   */
  static async sendUserEmail(userId: string, options: SendMailOptions) {
    const config = await prisma.emailConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new Error('User has no email configuration set up.');
    }

    const decryptedPassword = decrypt(config.password);

    const transporter = nodemailer.createTransport({
      host: config.host || undefined,
      port: config.port || 587,
      secure: config.port === 465,
      auth: {
        user: config.smtpUser,
        pass: decryptedPassword,
      },
    });

    const info = await transporter.sendMail({
      from: options.from || {
        name: config.fromName || 'NexoB2B',
        address: config.fromAddress,
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info(`Email sent: ${info.messageId} to ${options.to}`);
    return info;
  }

  /**
   * Generates the Sober Corporate template for Customer Invitation.
   */
  static getInvitationTemplate(data: {
    companyName: string;
    companyLogo?: string | null;
    customerName: string;
    setupUrl: string;
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;700;800&display=swap');
          body { margin: 0; padding: 0; background-color: #f1f5f9; }
        </style>
      </head>
      <body style="background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
                
                <!-- Header -->
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 60px 40px;">
                    ${data.companyLogo 
                      ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-height: 80px; max-width: 200px; margin-bottom: 24px; border-radius: 12px; display: block;">`
                      : `<table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                          <tr>
                            <td align="center" style="width: 64px; height: 64px; background: #ffffff; color: #0f172a; border-radius: 16px; font-size: 32px; font-weight: 900; line-height: 64px;">${data.companyName.charAt(0)}</td>
                          </tr>
                        </table>`
                    }
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.01em;">${data.companyName}</h1>
                    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em;">Portal de Negocios B2B</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 50px 40px; line-height: 1.7;">
                    <h2 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 24px 0;">¡Bienvenido al equipo, ${data.customerName}!</h2>
                    
                    <p style="font-size: 16px; color: #475569; margin: 0 0 32px 0;">
                      <strong>${data.companyName}</strong> te ha invitado a unirte a su nueva plataforma digital diseñada para agilizar nuestra colaboración comercial.
                    </p>

                    <!-- Benefits Block (Centered) -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; margin: 32px 0;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 16px 0; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Beneficios de tu acceso:</p>
                          
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td valign="top" style="padding-top: 4px; padding-bottom: 12px; width: 30px;">
                                <span style="font-size: 20px;">📦</span>
                              </td>
                              <td style="padding-bottom: 12px; font-size: 14px; color: #334155;">
                                <strong>Pedidos directos</strong> al inventario en tiempo real.
                              </td>
                            </tr>
                            <tr>
                              <td valign="top" style="padding-top: 4px; padding-bottom: 12px; width: 30px;">
                                <span style="font-size: 20px;">📄</span>
                              </td>
                              <td style="padding-bottom: 12px; font-size: 14px; color: #334155;">
                                <strong>Gestión financiera</strong> descarga facturas y estados de cuenta.
                              </td>
                            </tr>
                            <tr>
                              <td valign="top" style="padding-top: 4px; width: 30px;">
                                <span style="font-size: 20px;">📈</span>
                              </td>
                              <td style="font-size: 14px; color: #334155;">
                                <strong>Precios exclusivos</strong> asignados a tu cuenta corporativa.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 48px 0;">
                      <tr>
                        <td align="center">
                          <a href="${data.setupUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);">
                            Configurar mi Acceso
                          </a>
                          <p style="font-size: 12px; color: #94a3b8; margin: 16px 0 0 0;">Este enlace es válido por 24 horas.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #f8fafc; padding: 32px 40px; border-top: 1px solid #f1f5f9;">
                    <p style="font-size: 12px; color: #64748b; margin: 0;">
                      Has recibido este correo porque tu empresa es cliente de <strong>${data.companyName}</strong>.<br>
                      Operado por NexoB2B Platform.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
