import puppeteer from 'puppeteer';
import { logger } from './logger';

export class PdfService {
  /**
   * Generates a PDF proforma using Puppeteer
   */
  static async generateProforma(data: {
    companyName: string;
    companyLogo?: string | null;
    orderNumber: string;
    date: string;
    customerName: string;
    items: any[];
    total: string;
    currency: string;
    notes?: string;
  }) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
            .frost-border { border: 1px solid rgba(226, 232, 240, 0.8); }
          </style>
        </head>
        <body class="bg-white p-12 text-slate-800">
          <div class="flex justify-between items-start mb-12">
            <div>
              <h1 class="text-4xl font-black text-indigo-600 tracking-tighter mb-2 uppercase italic">PROFORMA</h1>
              <p class="text-slate-400 font-bold tracking-widest text-xs">SOLICITUD DE PEDIDO #${data.orderNumber}</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-extrabold text-slate-900">${data.companyName}</h2>
              <p class="text-sm text-slate-500 font-medium">${new Date(data.date).toLocaleDateString()}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-8 mb-12">
            <div class="bg-slate-50 p-6 rounded-3xl frost-border">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Emitido para:</p>
              <p class="font-bold text-slate-900 text-lg">${data.customerName}</p>
            </div>
            <div class="bg-slate-50 p-6 rounded-3xl frost-border">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Condiciones:</p>
              <p class="font-bold text-slate-900">Sujeto a aprobación</p>
              <p class="text-xs text-slate-500 mt-1">Este documento no es una factura comercial.</p>
            </div>
          </div>

          <table class="w-full mb-12">
            <thead>
              <tr class="border-b-2 border-slate-100 italic">
                <th class="text-left py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th class="text-center py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Cant.</th>
                <th class="text-right py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Precio</th>
                <th class="text-right py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr class="border-b border-slate-50">
                  <td class="py-5 font-bold text-slate-800">${item.name}<br><span class="text-[10px] text-slate-400 font-medium">SKU: ${item.sku}</span></td>
                  <td class="py-5 text-center font-bold text-slate-600">${item.quantity}</td>
                  <td class="py-5 text-right text-slate-500">${data.currency} ${item.unitPrice}</td>
                  <td class="py-5 text-right font-extrabold text-slate-900">${data.currency} ${item.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="flex justify-end mb-16">
            <div class="w-1/3 space-y-4">
              <div class="flex justify-between items-center py-4 border-t-4 border-indigo-600 bg-indigo-50/50 px-6 rounded-b-2xl">
                <span class="text-sm font-black text-indigo-900 uppercase tracking-widest">TOTAL</span>
                <span class="text-2xl font-black text-indigo-600">${data.currency} ${data.total}</span>
              </div>
            </div>
          </div>

          ${data.notes ? `
            <div class="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 mb-12">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas del pedido:</p>
              <p class="text-sm text-slate-600 leading-relaxed italic">"${data.notes}"</p>
            </div>
          ` : ''}

          <div class="border-t border-slate-100 pt-8 text-center">
            <p class="text-xs text-slate-400 font-medium tracking-tight">Gracias por confiar en nuestra plataforma B2B. Este es un documento generado digitalmente por NexoB2B.</p>
          </div>
        </body>
        </html>
      `;

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px' }
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error('Error generating PDF:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generates an invoice PDF
   */
  static async generateInvoicePdf(data: {
    invoiceNumber: string;
    date: string;
    customerName: string;
    customerTaxId?: string;
    items: any[];
    subtotal: string;
    tax: string;
    total: string;
    currency: string;
    companyName: string;
    companyLogo?: string;
  }): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
            :root {
              --color-brand-900: #0F172A;
              --color-brand-600: #475569;
              --color-brand-500: #64748b;
              --color-accent-500: #3B82F6;
              --glass-bg: rgba(255, 255, 255, 0.7);
            }
            body { font-family: 'Inter', sans-serif; color: var(--color-brand-900); line-height: 1.5; margin: 0; padding: 40px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px; }
            .logo-section h1 { font-size: 24px; font-weight: 800; letter-spacing: -1px; margin: 0; }
            .invoice-tag { background: var(--color-brand-900); color: white; padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; display: inline-block; }
            .invoice-details { text-align: right; }
            .invoice-details h2 { font-size: 32px; font-weight: 800; margin: 0; color: var(--color-brand-900); }
            .invoice-details p { margin: 4px 0; font-size: 12px; color: var(--color-brand-500); }
            .billing-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .billing-box h3 { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--color-brand-500); margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
            .billing-box p { margin: 2px 0; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 12px; color: var(--color-brand-500); background: #f8fafc; border-radius: 8px 0 0 8px; }
            td { padding: 16px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
            .item-sku { font-size: 10px; font-weight: 600; color: var(--color-accent-600); display: block; }
            .totals-section { margin-top: 40px; display: flex; justify-content: flex-end; }
            .totals-table { width: 250px; }
            .totals-table td { border: none; padding: 8px 12px; }
            .total-row td { background: #f8fafc; font-weight: 800; font-size: 18px; border-radius: 8px; }
            .footer { margin-top: 80px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10px; color: var(--color-brand-400); text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              ${data.companyLogo ? `<img src="${data.companyLogo}" height="40" />` : `<h1>${data.companyName}</h1>`}
              <div class="invoice-tag">Comprobante Fiscal</div>
            </div>
            <div class="invoice-details">
              <h2>Invoice</h2>
              <p>No: <strong>${data.invoiceNumber}</strong></p>
              <p>Fecha: ${data.date}</p>
            </div>
          </div>
          <div class="billing-section">
            <div class="billing-box">
              <h3>De:</h3>
              <p><strong>${data.companyName}</strong></p>
              <p>República Dominicana</p>
            </div>
            <div class="billing-box">
              <h3>Facturar a:</h3>
              <p><strong>${data.customerName}</strong></p>
              ${data.customerTaxId ? `<p>RNC/Cédula: ${data.customerTaxId}</p>` : ''}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Producto / Servicio</th>
                <th style="text-align: center">Cant.</th>
                <th style="text-align: right">Precio Uni.</th>
                <th style="text-align: right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td><span class="item-sku">${item.sku}</span><strong>${item.name}</strong></td>
                  <td style="text-align: center">${item.quantity}</td>
                  <td style="text-align: right">${item.unitPrice}</td>
                  <td style="text-align: right">${item.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals-section">
            <table class="totals-table">
              <tr><td>Subtotal</td><td style="text-align: right">${data.subtotal}</td></tr>
              <tr><td>ITBIS (18%)</td><td style="text-align: right">${data.tax}</td></tr>
              <tr class="total-row"><td>Total</td><td style="text-align: right">${data.currency} ${data.total}</td></tr>
            </table>
          </div>
          <div class="footer">
            Este documento es una representación digital del comprobante generado por NexoB2B. 
            © ${new Date().getFullYear()} ${data.companyName}.
          </div>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);
      const pdfBuffer = await page.pdf({ 
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
      });

      return Buffer.from(pdfBuffer);
    } catch (error: any) {
      logger.error('PDF Generation failed', { error: error.message });
      throw error;
    } finally {
      await browser.close();
    }
  }
}
